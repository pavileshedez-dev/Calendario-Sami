/**
 * extract-all-staging.mjs
 * Extrae quirúrgicamente las 31 figuras individuales de las 7 láminas
 * hacia mascots-art/processed-staging/ con transparencia alfa real,
 * sin reducción a 48x48 (conservando resolución nativa de píxel),
 * eliminando fondos, cuadrículas, sombras de contacto y rótulos.
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const ART = 'C:/Users/pavil/Downloads/Personal/Sami/Agenda Sami/mascots-art'
const STAGING = `${ART}/processed-staging`

const FIGURES_METADATA = [
  // ── PIBBLE LÁMINA 1 (1376x768, BG [216, 226, 235]) ──────────────────────────
  {
    char: 'pibble',
    subfolder: 'pibble',
    id: '01-reposo',
    sheet: `${ART}/pibble/01-reposo-caminar-correr-dormir-despertar.jpg`,
    bg: [216, 226, 235],
    crop: [70, 50, 390, 310], // left, top, right, bottom
    label: 'Reposo',
    desc: 'Sentado en calma, patas delanteras juntas, orejas relajadas'
  },
  {
    char: 'pibble',
    subfolder: 'pibble',
    id: '02-caminar',
    sheet: `${ART}/pibble/01-reposo-caminar-correr-dormir-despertar.jpg`,
    bg: [216, 226, 235],
    crop: [450, 50, 850, 310],
    label: 'Caminar',
    desc: 'Paso hacia delante con pata delantera alzada'
  },
  {
    char: 'pibble',
    subfolder: 'pibble',
    id: '03-correr',
    sheet: `${ART}/pibble/01-reposo-caminar-correr-dormir-despertar.jpg`,
    bg: [216, 226, 235],
    crop: [870, 45, 1340, 310],
    label: 'Correr',
    desc: 'Carrera dinámica, patas estiradas y orejas al viento'
  },
  {
    char: 'pibble',
    subfolder: 'pibble',
    id: '04-dormir',
    sheet: `${ART}/pibble/01-reposo-caminar-correr-dormir-despertar.jpg`,
    bg: [216, 226, 235],
    crop: [40, 440, 600, 695],
    label: 'Dormir',
    desc: 'Echado sobre la panza dormido con zzz flotando'
  },
  {
    char: 'pibble',
    subfolder: 'pibble',
    id: '05-despertar',
    sheet: `${ART}/pibble/01-reposo-caminar-correr-dormir-despertar.jpg`,
    bg: [216, 226, 235],
    crop: [640, 420, 1180, 695],
    label: 'Despertar',
    desc: 'Incorporándose soñoliento mientras se frota un ojo'
  },

  // ── PIBBLE LÁMINA 2 (1376x768, BG [193, 193, 193]) ──────────────────────────
  {
    char: 'pibble',
    subfolder: 'pibble',
    id: '06-sentarse',
    sheet: `${ART}/pibble/02-sentarse-tumbarse-bocaarriba-caricias-feliz.jpg`,
    bg: [193, 193, 193],
    crop: [40, 35, 430, 325],
    label: 'Sentarse',
    desc: 'Sentado erguido y atento mirando al frente'
  },
  {
    char: 'pibble',
    subfolder: 'pibble',
    id: '07-tumbarse',
    sheet: `${ART}/pibble/02-sentarse-tumbarse-bocaarriba-caricias-feliz.jpg`,
    bg: [193, 193, 193],
    crop: [450, 40, 920, 325],
    label: 'Tumbarse',
    desc: 'Tumbado boca abajo (sploot) con la barbilla sobre el suelo'
  },
  {
    char: 'pibble',
    subfolder: 'pibble',
    id: '08-boca-arriba',
    sheet: `${ART}/pibble/02-sentarse-tumbarse-bocaarriba-caricias-feliz.jpg`,
    bg: [193, 193, 193],
    crop: [930, 35, 1340, 325],
    label: 'Boca arriba',
    desc: 'Tumbado sobre la espalda con la barriga redonda expuesta'
  },
  {
    char: 'pibble',
    subfolder: 'pibble',
    id: '09-recibir-caricias',
    sheet: `${ART}/pibble/02-sentarse-tumbarse-bocaarriba-caricias-feliz.jpg`,
    bg: [193, 193, 193],
    crop: [40, 390, 650, 690],
    label: 'Recibir caricias',
    desc: 'Acariciado por una mano humana con mejillas sonrojadas y corazones rosas'
  },
  {
    char: 'pibble',
    subfolder: 'pibble',
    id: '10-estar-feliz',
    sheet: `${ART}/pibble/02-sentarse-tumbarse-bocaarriba-caricias-feliz.jpg`,
    bg: [193, 193, 193],
    crop: [680, 390, 1340, 690],
    label: 'Estar feliz',
    desc: 'Bote de entusiasmo con cola en movimiento y destellos dorados'
  },

  // ── PIBBLE LÁMINA 3 (1376x768, BG [217, 207, 195]) ──────────────────────────
  {
    char: 'pibble',
    subfolder: 'pibble',
    id: '11-jugar',
    sheet: `${ART}/pibble/03-jugar-ladrar-grunir-grunir-jugando-saludar.jpg`,
    bg: [217, 207, 195],
    crop: [20, 50, 470, 335],
    label: 'Jugar',
    desc: 'Postura de juego (play-bow) frente a una pelota roja'
  },
  {
    char: 'pibble',
    subfolder: 'pibble',
    id: '12-ladrar',
    sheet: `${ART}/pibble/03-jugar-ladrar-grunir-grunir-jugando-saludar.jpg`,
    bg: [217, 207, 195],
    crop: [490, 50, 910, 335],
    label: 'Ladrar',
    desc: 'Erguido ladrando con la boca bien abierta y ondas sonoras'
  },
  {
    char: 'pibble',
    subfolder: 'pibble',
    id: '13-grunir',
    sheet: `${ART}/pibble/03-jugar-ladrar-grunir-grunir-jugando-saludar.jpg`,
    bg: [217, 207, 195],
    crop: [920, 50, 1350, 335],
    label: 'Gruñir',
    desc: 'Postura baja de advertencia con ceño fruncido y dientes asomando'
  },
  {
    char: 'pibble',
    subfolder: 'pibble',
    id: '14-grunir-jugando',
    sheet: `${ART}/pibble/03-jugar-ladrar-grunir-grunir-jugando-saludar.jpg`,
    bg: [217, 207, 195],
    crop: [20, 380, 500, 715],
    label: 'Gruñir jugando',
    desc: 'Gruñido pícaro de juego agachado con una zarpa alzada'
  },
  {
    char: 'pibble',
    subfolder: 'pibble',
    id: '15-saludar',
    sheet: `${ART}/pibble/03-jugar-ladrar-grunir-grunir-jugando-saludar.jpg`,
    bg: [217, 207, 195],
    crop: [530, 380, 920, 715],
    label: 'Saludar',
    desc: 'De pie sobre dos patas traseras saludando con la zarpa delantera'
  },

  // ── CAPILÁMPARA LÁMINA 1 (1200x896, BG [214, 215, 210]) ─────────────────────
  {
    char: 'capilampara',
    subfolder: 'capilampara',
    id: '01-reposo',
    sheet: `${ART}/capilampara/01-reposo-caminar-dormir-despertar-sentarse.jpg`,
    bg: [214, 215, 210],
    crop: [60, 50, 420, 385],
    label: 'Reposo',
    desc: 'De pie a 4 patas en actitud serena con mandarina en la cabeza'
  },
  {
    char: 'capilampara',
    subfolder: 'capilampara',
    id: '02-caminar',
    sheet: `${ART}/capilampara/01-reposo-caminar-dormir-despertar-sentarse.jpg`,
    bg: [214, 215, 210],
    crop: [430, 50, 800, 385],
    label: 'Caminar',
    desc: 'Paso tranquilo con pata delantera levantada y mandarina estable'
  },
  {
    char: 'capilampara',
    subfolder: 'capilampara',
    id: '03-dormir',
    sheet: `${ART}/capilampara/01-reposo-caminar-dormir-despertar-sentarse.jpg`,
    bg: [214, 215, 210],
    crop: [800, 50, 1180, 385],
    label: 'Dormir',
    desc: 'Completamente echada descansando plácidamente con mandarina'
  },
  {
    char: 'capilampara',
    subfolder: 'capilampara',
    id: '04-despertar',
    sheet: `${ART}/capilampara/01-reposo-caminar-dormir-despertar-sentarse.jpg`,
    bg: [214, 215, 210],
    crop: [60, 450, 600, 790],
    label: 'Despertar',
    desc: 'Entreabriendo un ojo soñolienta en el suelo con mandarina'
  },
  {
    char: 'capilampara',
    subfolder: 'capilampara',
    id: '05-sentarse',
    sheet: `${ART}/capilampara/01-reposo-caminar-dormir-despertar-sentarse.jpg`,
    bg: [214, 215, 210],
    crop: [610, 450, 1180, 790],
    label: 'Sentarse',
    desc: 'Sentada sobre las ancas con la barriga clara redonda visible'
  },

  // ── CAPILÁMPARA LÁMINA 2 (1200x896, BG [193, 177, 151]) ─────────────────────
  {
    char: 'capilampara',
    subfolder: 'capilampara',
    id: '06-tumbarse',
    sheet: `${ART}/capilampara/02-tumbarse-bocaarriba-leer-estudiar-caricias.jpg`,
    bg: [193, 177, 151],
    crop: [30, 40, 420, 380],
    label: 'Tumbarse',
    desc: 'Echada relajada con la barbilla sobre el suelo'
  },
  {
    char: 'capilampara',
    subfolder: 'capilampara',
    id: '07-boca-arriba',
    sheet: `${ART}/capilampara/02-tumbarse-bocaarriba-leer-estudiar-caricias.jpg`,
    bg: [193, 177, 151],
    crop: [430, 40, 800, 380],
    label: 'Boca arriba',
    desc: 'Panza arriba alegre con patas en el aire y mandarina equilibrada'
  },
  {
    char: 'capilampara',
    subfolder: 'capilampara',
    id: '08-leer',
    sheet: `${ART}/capilampara/02-tumbarse-bocaarriba-leer-estudiar-caricias.jpg`,
    bg: [193, 177, 151],
    crop: [800, 40, 1180, 380],
    label: 'Leer',
    desc: 'Sentada leyendo atentamente un libro abierto entre las patas'
  },
  {
    char: 'capilampara',
    subfolder: 'capilampara',
    id: '09-estudiar',
    sheet: `${ART}/capilampara/02-tumbarse-bocaarriba-leer-estudiar-caricias.jpg`,
    bg: [193, 177, 151],
    crop: [30, 450, 600, 815],
    label: 'Estudiar',
    desc: 'Inclinada sobre un cuaderno de apuntes con lápiz en la mesa'
  },
  {
    char: 'capilampara',
    subfolder: 'capilampara',
    id: '10-recibir-caricias',
    sheet: `${ART}/capilampara/02-tumbarse-bocaarriba-leer-estudiar-caricias.jpg`,
    bg: [193, 177, 151],
    crop: [610, 450, 1180, 815],
    label: 'Recibir caricias',
    desc: 'Acariciada en la mandarina con ojos cerrados de placer, corazones y chispas'
  },

  // ── CAPILÁMPARA LÁMINA 3 (1376x768, BG [227, 221, 205]) ─────────────────────
  {
    char: 'capilampara',
    subfolder: 'capilampara',
    id: '11-estar-feliz',
    sheet: `${ART}/capilampara/03-feliz-saludar-saludar2.jpg`,
    bg: [227, 221, 205],
    crop: [80, 140, 460, 580],
    label: 'Estar feliz',
    desc: 'Bote de gozo con ojos curvados, mejillas sonrojadas y chispas doradas'
  },
  {
    char: 'capilampara',
    subfolder: 'capilampara',
    id: '12-saludar',
    sheet: `${ART}/capilampara/03-feliz-saludar-saludar2.jpg`,
    bg: [227, 221, 205],
    crop: [480, 140, 930, 580],
    label: 'Saludar',
    desc: 'A 4 patas saludando afablemente con una pata delantera alzada'
  },
  {
    char: 'capilampara',
    subfolder: 'capilampara',
    id: '13-saludar-erguida',
    sheet: `${ART}/capilampara/03-feliz-saludar-saludar2.jpg`,
    bg: [227, 221, 205],
    crop: [940, 130, 1340, 600],
    label: 'Saludar erguida',
    desc: 'De pie sobre las patas traseras despidiendo o saludando en alto'
  },

  // ── CAPILÁMPARA UNIVERSITARIA LÁMINA 1 (1376x768, BG [227, 219, 206]) ────────
  {
    char: 'capilampara-uni',
    subfolder: 'capilampara-uni',
    id: '01-reposo-uni',
    sheet: `${ART}/capilampara-uni/01-reposo-estudiar-caminar-uni.jpg`,
    bg: [227, 219, 206],
    crop: [80, 120, 460, 610],
    label: 'Reposo Universitaria',
    desc: 'Con birrete de graduación, mandarina en la cima, gafas redondas y mochila UCM'
  },
  {
    char: 'capilampara-uni',
    subfolder: 'capilampara-uni',
    id: '02-estudiar-uni',
    sheet: `${ART}/capilampara-uni/01-reposo-estudiar-caminar-uni.jpg`,
    bg: [227, 219, 206],
    crop: [470, 120, 930, 610],
    label: 'Estudiar Universitaria',
    desc: 'Inclinada sobre libro de apuntes con gafas académicas, birrete+mandarina y mochila'
  },
  {
    char: 'capilampara-uni',
    subfolder: 'capilampara-uni',
    id: '03-caminar-uni',
    sheet: `${ART}/capilampara-uni/01-reposo-estudiar-caminar-uni.jpg`,
    bg: [227, 219, 206],
    crop: [940, 120, 1340, 610],
    label: 'Caminar Universitaria',
    desc: 'Caminando hacia la facultad con mochila ajustada, birrete+mandarina y gafas'
  }
]

function colorDist(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

async function extractFigure(fig) {
  const [cLeft, cTop, cRight, cBottom] = fig.crop
  const cWidth = cRight - cLeft
  const cHeight = cBottom - cTop

  // 1. Extraer recorte de la lámina original sin reescalar
  const { data, info } = await sharp(fig.sheet)
    .extract({ left: cLeft, top: cTop, width: cWidth, height: cHeight })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height } = info
  const bg = fig.bg

  // 2. Preparar búfer RGBA
  const rgba = Buffer.alloc(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = data[i * 3]
    rgba[i * 4 + 1] = data[i * 3 + 1]
    rgba[i * 4 + 2] = data[i * 3 + 2]
    rgba[i * 4 + 3] = 255
  }

  // 3. Criterio de borde exterior (fondo y sombra)
  function isOuterPixel(r, g, b) {
    // Si es línea de contorno oscura (negro / carbón / marrón oscuro), es el borde del personaje
    if (r < 75 && g < 75 && b < 75) return false

    const dist = colorDist(r, g, b, bg[0], bg[1], bg[2])

    // Sombra de contacto suave (generalmente más oscura que el fondo pero con tono similar)
    if (dist < 100 && (Math.abs(r - bg[0]) < 65 && Math.abs(g - bg[1]) < 65 && Math.abs(b - bg[2]) < 65)) {
      // Si no es parte del cuerpo (evitar colores vivos de pelaje o mandarina)
      const isMandarina = (r > 200 && g > 90 && g < 180 && b < 60)
      const isPibbleFur = (r > 220 && g > 215 && b > 195)
      const isCapiFur = (r > 130 && r < 210 && g > 90 && g < 155 && b < 105)
      if (!isMandarina && !isPibbleFur && !isCapiFur) {
        return true
      }
    }

    // Fondo estándar
    if (dist < 48) return true

    return false
  }

  // 4. Flood fill BFS desde todo el perímetro exterior
  const visited = new Uint8Array(width * height)
  const queue = []

  for (let x = 0; x < width; x++) {
    queue.push(x) // borde superior
    queue.push((height - 1) * width + x) // borde inferior
  }
  for (let y = 0; y < height; y++) {
    queue.push(y * width) // borde izquierdo
    queue.push(y * width + (width - 1)) // borde derecho
  }

  let head = 0
  while (head < queue.length) {
    const idx = queue[head++]
    if (visited[idx]) continue
    visited[idx] = 1

    const px = idx * 4
    const r = rgba[px], g = rgba[px + 1], b = rgba[px + 2]

    if (!isOuterPixel(r, g, b)) {
      continue
    }

    rgba[px + 3] = 0 // Transparente

    const x = idx % width
    const y = Math.floor(idx / width)

    if (x > 0 && !visited[idx - 1]) queue.push(idx - 1)
    if (x < width - 1 && !visited[idx + 1]) queue.push(idx + 1)
    if (y > 0 && !visited[idx - width]) queue.push(idx - width)
    if (y < height - 1 && !visited[idx + width]) queue.push(idx + width)
  }

  // 5. Limpieza de franja de borde (anti-fringe JPEG)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      if (rgba[idx + 3] !== 0) {
        const r = rgba[idx], g = rgba[idx + 1], b = rgba[idx + 2]
        const dist = colorDist(r, g, b, bg[0], bg[1], bg[2])
        if (dist < 55) {
          let hasTransp = false
          if (x > 0 && rgba[idx - 4 + 3] === 0) hasTransp = true
          if (x < width - 1 && rgba[idx + 4 + 3] === 0) hasTransp = true
          if (y > 0 && rgba[idx - width * 4 + 3] === 0) hasTransp = true
          if (y < height - 1 && rgba[idx + width * 4 + 3] === 0) hasTransp = true
          if (hasTransp) rgba[idx + 3] = 0
        }
      }
    }
  }

  // 6. Ajustar recorte ajustado y añadir 4px de margen transparente
  const outPath = `${STAGING}/${fig.subfolder}/${fig.id}.png`
  await sharp(rgba, { raw: { width, height, channels: 4 } })
    .trim()
    .extend({ top: 4, bottom: 4, left: 4, right: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath)

  const meta = await sharp(outPath).metadata()
  return {
    id: fig.id,
    char: fig.char,
    subfolder: fig.subfolder,
    label: fig.label,
    desc: fig.desc,
    file: `mascots-art/processed-staging/${fig.subfolder}/${fig.id}.png`,
    width: meta.width,
    height: meta.height,
    channels: meta.channels,
    hasAlpha: meta.hasAlpha,
    sizeKB: (fs.statSync(outPath).size / 1024).toFixed(1)
  }
}

async function main() {
  console.log('=== Iniciando extracción de 31 figuras quirúrgicas ===\n')
  const results = []

  for (let i = 0; i < FIGURES_METADATA.length; i++) {
    const fig = FIGURES_METADATA[i]
    process.stdout.write(`[${i + 1}/${FIGURES_METADATA.length}] Extrayendo ${fig.subfolder}/${fig.id}... `)
    try {
      const res = await extractFigure(fig)
      results.push(res)
      console.log(`✓ (${res.width}x${res.height}, ${res.sizeKB} KB, alfa: ${res.hasAlpha})`)
    } catch (err) {
      console.log(`✗ Error: ${err.message}`)
    }
  }

  // Guardar manifiesto de staging
  const manifestPath = `${STAGING}/manifest.json`
  fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`\nManifiesto guardado en: ${manifestPath}`)
  console.log(`Total de figuras extraídas con éxito: ${results.length}/31`)
}

main().catch(console.error)
