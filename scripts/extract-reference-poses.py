#!/usr/bin/env python3
"""Separa las poses de las hojas de referencia en PNG individuales transparentes.

No se usa para el sprite atlas de runtime: es el archivo de referencia/QA que
permite comparar el redibujado 48x48 con el diseño original. Conserva una copia
intacta de los JPG en referencias/mascotas/.
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
REF_DIR = ROOT / "referencias" / "mascotas"
OUT_DIR = REF_DIR / "poses"

SHEETS = {
    "pibble-referencia": ["idle", "feliz", "rascandose", "ladrando", "dormido", "boca-abajo", "boca-arriba", "caminando"],
    "capilampara-referencia": ["idle", "feliz", "rascandose", "sonido", "dormido", "boca-abajo", "boca-arriba", "caminando"],
    "capilampara-universitaria": ["idle", "feliz", "estudiando", "sonido", "dormido", "boca-abajo", "boca-arriba", "caminando"],
    "capilampara-universitaria-gafas": ["idle", "feliz", "estudiando", "sonido", "dormido", "boca-abajo", "boca-arriba", "caminando"],
}


def foreground_mask(arr: np.ndarray) -> np.ndarray:
    height, width, _ = arr.shape
    border = np.concatenate([
        arr[0:12].reshape(-1, 3),
        arr[-12:].reshape(-1, 3),
        arr[:, 0:12].reshape(-1, 3),
        arr[:, -12:].reshape(-1, 3),
    ])
    background = np.median(border, axis=0)
    candidate = np.abs(arr - background).sum(axis=2) <= 34

    seen = np.zeros((height, width), dtype=bool)
    queue = deque()
    for x in range(width):
        for y in (0, height - 1):
            if candidate[y, x] and not seen[y, x]:
                seen[y, x] = True
                queue.append((y, x))
    for y in range(height):
        for x in (0, width - 1):
            if candidate[y, x] and not seen[y, x]:
                seen[y, x] = True
                queue.append((y, x))
    while queue:
        y, x = queue.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < height and 0 <= nx < width and not seen[ny, nx] and candidate[ny, nx]:
                seen[ny, nx] = True
                queue.append((ny, nx))

    # Conservar solo el componente mayor (personaje + sombra). Así se eliminan
    # etiquetas, letras y destellos sueltos que no son parte del personaje.
    foreground = ~seen
    labels = np.zeros((height, width), dtype=np.int32)
    largest_id = 0
    largest_area = 0
    current = 0
    for y in range(height):
        for x in range(width):
            if not foreground[y, x] or labels[y, x]:
                continue
            current += 1
            queue = deque([(y, x)])
            labels[y, x] = current
            area = 0
            while queue:
                cy, cx = queue.popleft()
                area += 1
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < height and 0 <= nx < width and foreground[ny, nx] and not labels[ny, nx]:
                        labels[ny, nx] = current
                        queue.append((ny, nx))
            if area > largest_area:
                largest_area = area
                largest_id = current
    return labels == largest_id


def remove_shadow_colors(rgba: np.ndarray) -> None:
    """La sombra de referencia es azulada; el pelaje es cálido. Se elimina solo
    cuando el azul domina claramente, para no tocar crema ni tostado."""
    r = rgba[:, :, 0].astype(int)
    g = rgba[:, :, 1].astype(int)
    b = rgba[:, :, 2].astype(int)
    shadow = (b > r + 5) & (b > g + 2) & (b > 145) & (b < 220)
    rgba[:, :, 3] = np.where(shadow, 0, rgba[:, :, 3])


def extract_cell(image: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    cell = image.crop(box)
    arr = np.array(cell).astype(int)
    foreground = foreground_mask(arr)
    alpha = np.where(foreground, 255, 0).astype(np.uint8)
    alpha = np.array(Image.fromarray(alpha, "L").filter(ImageFilter.MinFilter(3)))
    rgba = np.dstack([np.array(cell), alpha])
    remove_shadow_colors(rgba)
    result = Image.fromarray(rgba, "RGBA")
    bbox = result.getbbox()
    if not bbox:
        return result
    left, top, right, bottom = bbox
    pad = 4
    return result.crop((max(0, left - pad), max(0, top - pad),
                        min(result.width, right + pad), min(result.height, bottom + pad)))


def fit_canvas(image: Image.Image, size: int = 48) -> Image.Image:
    scale = min((size - 2) / image.width, (size - 2) / image.height)
    resized = image.resize(
        (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((size - resized.width) // 2, size - 3 - resized.height))
    return canvas


def checker(size: tuple[int, int]) -> Image.Image:
    tile = 12
    image = Image.new("RGBA", size, (238, 238, 238, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], tile):
        for x in range(0, size[0], tile):
            if (x // tile + y // tile) % 2:
                draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill=(222, 222, 222, 255))
    return image


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    contact_items = []

    for sheet_name, poses in SHEETS.items():
        image = Image.open(REF_DIR / f"{sheet_name}.jpg").convert("RGB")
        cell_width = image.width // 4
        cell_height = image.height // 2
        sheet_dir = OUT_DIR / sheet_name
        sheet_dir.mkdir(parents=True, exist_ok=True)

        for index, pose in enumerate(poses):
            row, column = divmod(index, 4)
            box = (
                column * cell_width,
                row * cell_height,
                (column + 1) * cell_width,
                row * cell_height + int(cell_height * 0.86),
            )
            cut = extract_cell(image, box)
            cut.save(sheet_dir / f"{index:02d}-{pose}.png")
            fit_canvas(cut).save(sheet_dir / f"{index:02d}-{pose}-48.png")
            contact_items.append((sheet_name, pose, cut))

    # Hoja de contacto de control de calidad
    thumb_w = 220
    label_h = 24
    columns = 4
    rows = (len(contact_items) + columns - 1) // columns
    sheet = checker((columns * thumb_w, rows * (thumb_w + label_h)))
    draw = ImageDraw.Draw(sheet)
    for index, (sheet_name, pose, cut) in enumerate(contact_items):
        thumb = cut.copy()
        thumb.thumbnail((thumb_w - 8, thumb_w - 8), Image.Resampling.LANCZOS)
        x = (index % columns) * thumb_w + (thumb_w - thumb.width) // 2
        y = (index // columns) * (thumb_w + label_h) + (thumb_w - thumb.height) // 2
        sheet.alpha_composite(thumb, (x, y))
        draw.text(((index % columns) * thumb_w + 6, (index // columns) * (thumb_w + label_h) + thumb_w - 2),
                  f"{sheet_name[:12]} · {pose}", fill=(30, 30, 30))
    out = ROOT / "docs" / "auditoria-mascotas" / "12-referencias-separadas.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.convert("RGB").save(out)
    print(f"Poses extraídas: {len(contact_items)}")
    print(out)


if __name__ == "__main__":
    main()
