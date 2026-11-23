/**
 * build-mascot-sprites.mjs  v2 — coordenadas refinadas con análisis automático
 * Pipeline completo de procesamiento de mascotas para Agenda Sami.
 */

import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dir, '..')
const ART = path.join(ROOT, 'mascots-art')
const OUT = path.join(ROOT, 'public', 'sprites')

const FRAME_W = 48
const FRAME_H = 48

// ─────────────────────────────────────────────────────────
// Coordenadas refinadas con análisis automático
// Para láminas donde los sprites están en fila continua,
// dividimos el ancho total entre el número de sprites.
// ─────────────────────────────────────────────────────────

const PIBBLE_SOURCES = {
  // Lámina 01: 1376×768 — fondo azul-gris claro (R216 G226 B235)
  // Fila superior: 3 sprites (reposo, caminar, correr) en x=91..1272, y=48..375
  // Fila inferior: 2 sprites (dormir, despertar) en y=421..702
  sheet1: {
    file: path.join(ART, 'pibble', '01-reposo-caminar-correr-dormir-despertar.jpg'),
    bg: { r: 216, g: 226, b: 235 },
    poses: {
      reposo:    { x: 91,  y: 48,  w: 393, h: 327 },
      caminar:   { x: 484, y: 48,  w: 393, h: 327 },
      correr:    { x: 877, y: 48,  w: 393, h: 327 },
      dormir:    { x: 91,  y: 421, w: 540, h: 281 },
      despertar: { x: 677, y: 421, w: 435, h: 281 },
    },
  },
  // Lámina 02: 1376×768 — fondo gris neutro (R193 G193 B193)
  // Fila superior: 3 sprites (sentarse, tumbarse, bocaarriba) en x=40..1336, y=37..319
  // Fila inferior: 2 sprites (caricias, feliz) en y=403..691
  sheet2: {
    file: path.join(ART, 'pibble', '02-sentarse-tumbarse-bocaarriba-caricias-feliz.jpg'),
    bg: { r: 193, g: 193, b: 193 },
    poses: {
      sentarse:   { x: 40,  y: 37, w: 432, h: 282 },
      tumbarse:   { x: 472, y: 37, w: 432, h: 282 },
      bocaarriba: { x: 904, y: 37, w: 432, h: 282 },
      caricias:   { x: 40,  y: 403, w: 648, h: 288 },
      feliz:      { x: 688, y: 403, w: 648, h: 288 },
    },
  },
  // Lámina 03: 1376×768 — fondo beige (R217 G207 B195)
  // 3 columnas bien separadas (detectadas automáticamente)
  sheet3: {
    file: path.join(ART, 'pibble', '03-jugar-ladrar-grunir-grunir-jugando-saludar.jpg'),
    bg: { r: 217, g: 207, b: 195 },
    poses: {
      jugar:         { x: 14,  y: 65,  w: 456, h: 259 },
      ladrar:        { x: 533, y: 59,  w: 362, h: 270 },
      grunir:        { x: 967, y: 65,  w: 334, h: 263 },
      grunir_jugando:{ x: 19,  y: 392, w: 452, h: 310 },
      saludar:       { x: 579, y: 398, w: 302, h: 310 },
    },
  },
}

const CAPI_SOURCES = {
  // Lámina 01: 1200×896 — fondo gris verdoso (R214 G215 B210)
  // Fila superior: 3 sprites en x=78..1141, y=67..393
  // Fila inferior: 2 sprites en y=462..793
  sheet1: {
    file: path.join(ART, 'capilampara', '01-reposo-caminar-dormir-despertar-sentarse.jpg'),
    bg: { r: 214, g: 215, b: 210 },
    poses: {
      reposo:    { x: 78,  y: 67, w: 354, h: 326 },
      caminar:   { x: 432, y: 67, w: 354, h: 326 },
      dormir:    { x: 787, y: 67, w: 354, h: 326 },
      despertar: { x: 78,  y: 462, w: 528, h: 331 },
      sentarse:  { x: 606, y: 462, w: 529, h: 331 },
    },
  },
  // Lámina 02: 1200×896 — fondo beige cálido (R193 G177 B151)
  // Fila superior: 3 sprites en x=42..1153, y=63..405
  // Fila inferior: 2 sprites en y=468..818
  sheet2: {
    file: path.join(ART, 'capilampara', '02-tumbarse-bocaarriba-leer-estudiar-caricias.jpg'),
    bg: { r: 193, g: 177, b: 151 },
    poses: {
      tumbarse:  { x: 42,  y: 63, w: 370, h: 342 },
      bocaarriba:{ x: 412, y: 63, w: 370, h: 342 },
      leer:      { x: 783, y: 63, w: 370, h: 342 },
      estudiar:  { x: 42,  y: 468, w: 556, h: 350 },
      caricias:  { x: 598, y: 468, w: 555, h: 350 },
    },
  },
  // Lámina 03: 1376×768 — fondo beige claro (R227 G221 B205)
  // 3 columnas separadas (detectadas automáticamente)
  sheet3: {
    file: path.join(ART, 'capilampara', '03-feliz-saludar-saludar2.jpg'),
    bg: { r: 227, g: 221, b: 205 },
    poses: {
      feliz:    { x: 91,  y: 151, w: 327, h: 420 },
      saludar:  { x: 526, y: 151, w: 352, h: 420 },
      saludar2: { x: 985, y: 151, w: 299, h: 420 },
    },
  },
}

const CAPI_UNI_SOURCES = {
  sheet1: {
    file: path.join(ART, 'capilampara-uni', '01-reposo-estudiar-caminar-uni.jpg'),
    bg: { r: 227, g: 219, b: 206 },
    poses: {
      reposo_uni:   { x: 91,  y: 140, w: 322, h: 431 },
      estudiar_uni: { x: 510, y: 140, w: 408, h: 431 },
      caminar_uni:  { x: 962, y: 140, w: 316, h: 431 },
    },
  },
}

// ─────────────────────────────────────────────────────────
// Utilidades de imagen
// ─────────────────────────────────────────────────────────

function colorDist(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2)
}

async function removeBg(inputBuffer, bgColor, threshold = 46) {
  const img = sharp(inputBuffer).ensureAlpha()
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const out = Buffer.from(data)
  for (let i = 0; i < width * height; i++) {
    const o = i * channels
    const dist = colorDist(out[o], out[o+1], out[o+2], bgColor.r, bgColor.g, bgColor.b)
    if (dist < threshold) out[o+3] = 0
  }
  return sharp(out, { raw: { width, height, channels } }).png().toBuffer()
}

async function extractPose(sourceFile, region, bgColor) {
  const src = fs.readFileSync(sourceFile)
  const { width: imgW, height: imgH } = await sharp(src).metadata()
  // Clamp region to image bounds
  const left = Math.max(0, Math.min(region.x, imgW - 1))
  const top  = Math.max(0, Math.min(region.y, imgH - 1))
  const rw   = Math.min(region.w, imgW - left)
  const rh   = Math.min(region.h, imgH - top)
  const cropped = await sharp(src).extract({ left, top, width: rw, height: rh }).toBuffer()
  const noBg = await removeBg(cropped, bgColor)
  return sharp(noBg)
    .resize(FRAME_W, FRAME_H, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: 'nearest',
    })
    .png()
    .toBuffer()
}

async function transparentFrame() {
  return sharp({
    create: { width: FRAME_W, height: FRAME_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).png().toBuffer()
}

/** Genera N frames de animación a partir de una pose usando variaciones sutiles */
async function breatheFrames(buf, count) {
  const frames = []
  for (let i = 0; i < count; i++) {
    if (i % 2 === 0) {
      frames.push(buf)
    } else {
      // Desplazar 1px verticalmente para simular respiración
      const shifted = await sharp(buf)
        .extract({ left: 0, top: 1, width: FRAME_W, height: FRAME_H - 1 })
        .extend({ bottom: 1, background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
      frames.push(shifted)
    }
  }
  return frames
}

/** Alterna entre sprite y su espejo horizontal para simular ciclo de caminar */
async function walkFrames(buf, count) {
  const flipped = await sharp(buf).flop().png().toBuffer()
  return Array.from({ length: count }, (_, i) => i % 2 === 0 ? buf : flipped)
}

async function buildSpritesheet(rows) {
  const totalCols = Math.max(...rows.map((r) => r.length))
  const sheetW = totalCols * FRAME_W
  const sheetH = rows.length * FRAME_H

  const composites = []
  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < rows[row].length; col++) {
      composites.push({ input: rows[row][col], left: col * FRAME_W, top: row * FRAME_H })
    }
  }

  return sharp({
    create: { width: sheetW, height: sheetH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite(composites).png().toBuffer()
}

// ─────────────────────────────────────────────────────────
// PIPELINES POR PERSONAJE
// ─────────────────────────────────────────────────────────

async function extractAll(sources) {
  const result = {}
  for (const [, sheet] of Object.entries(sources)) {
    for (const [name, region] of Object.entries(sheet.poses)) {
      process.stdout.write(`  Extrayendo ${name}... `)
      try {
        result[name] = await extractPose(sheet.file, region, sheet.bg)
        console.log('✓')
      } catch (err) {
        console.log(`✗ ${err.message.slice(0,80)}`)
        result[name] = await transparentFrame()
      }
    }
  }
  return result
}

async function buildPibble() {
  console.log('\n── PIBBLE ──────────────────────────────────')
  const p = await extractAll(PIBBLE_SOURCES)

  const rows = [
    // row 0: sleep (2 frames)
    await breatheFrames(p.dormir, 2),
    // row 1: wake (4 frames)
    [p.despertar, p.despertar, p.reposo, p.reposo],
    // row 2: idle (4 frames)
    await breatheFrames(p.reposo, 4),
    // row 3: walk (4 frames)
    await walkFrames(p.caminar, 4),
    // row 4: run (4 frames)
    await walkFrames(p.correr, 4),
    // row 5: sit (2 frames)
    await breatheFrames(p.sentarse, 2),
    // row 6: lie (2 frames)
    await breatheFrames(p.tumbarse, 2),
    // row 7: play (4 frames)
    await walkFrames(p.jugar, 4),
    // row 8: scratch (4 frames) — bocaarriba como variante de rascarse
    await walkFrames(p.bocaarriba, 4),
    // row 9: pet (3 frames)
    [p.caricias, p.feliz, p.caricias],
    // row 10: happy (4 frames)
    await breatheFrames(p.feliz, 4),
    // row 11: bark (4 frames)
    await walkFrames(p.ladrar, 4),
    // row 12: growl (3 frames)
    [p.grunir, p.grunir, p.grunir],
    // row 13: playful_growl (4 frames)
    await walkFrames(p.grunir_jugando, 4),
    // row 14: greet (4 frames)
    [p.saludar, p.feliz, p.saludar, p.reposo],
    // row 15: pibblino_intro (6 frames)
    [p.jugar, p.feliz, p.saludar, p.feliz, p.saludar, p.feliz],
    // row 16: pibblino_idle (4 frames)
    await breatheFrames(p.feliz, 4),
  ]

  const cols = Math.max(...rows.map((r) => r.length))
  console.log(`  Ensamblando ${cols}×${rows.length}...`)
  const sheet = await buildSpritesheet(rows)
  fs.writeFileSync(path.join(OUT, 'pibble.png'), sheet)
  console.log(`  ✓ pibble.png (${cols}×${rows.length} frames, ${(sheet.length/1024).toFixed(1)}KB)`)
  return { columns: cols, rows: rows.length }
}

async function buildCapilampara() {
  console.log('\n── CAPILÁMPARA (normal) ────────────────────')
  const c = await extractAll(CAPI_SOURCES)

  const rows = [
    // row 0: idle (4)
    await breatheFrames(c.reposo, 4),
    // row 1: walk (4)
    await walkFrames(c.caminar, 4),
    // row 2: sit (2)
    await breatheFrames(c.sentarse, 2),
    // row 3: lie (2)
    await breatheFrames(c.tumbarse, 2),
    // row 4: read (4)
    await breatheFrames(c.leer, 4),
    // row 5: study (4)
    await breatheFrames(c.estudiar, 4),
    // row 6: sleep (2)
    await breatheFrames(c.dormir, 2),
    // row 7: wake (4)
    [c.despertar, c.despertar, c.reposo, c.reposo],
    // row 8: pet (3)
    [c.caricias, c.feliz, c.caricias],
    // row 9: greet (4)
    [c.saludar, c.saludar2, c.saludar, c.reposo],
    // row 10: dress (4) — transición normal↔uni con bocaarriba de celebración
    await breatheFrames(c.feliz, 4),
  ]

  const cols = Math.max(...rows.map((r) => r.length))
  const sheet = await buildSpritesheet(rows)
  fs.writeFileSync(path.join(OUT, 'capilampara.png'), sheet)
  console.log(`  ✓ capilampara.png (${cols}×${rows.length} frames)`)
  return { columns: cols, rows: rows.length }
}

async function buildCapilamparaOutfit() {
  console.log('\n── CAPILÁMPARA OUTFIT ──────────────────────')
  const u = await extractAll(CAPI_UNI_SOURCES)

  const buildRows = async (p) => [
    await breatheFrames(p.reposo_uni, 4),
    await walkFrames(p.caminar_uni, 4),
    await breatheFrames(p.reposo_uni, 2),
    await breatheFrames(p.estudiar_uni, 2),
    await breatheFrames(p.estudiar_uni, 4),
    await breatheFrames(p.estudiar_uni, 4),
    await breatheFrames(p.reposo_uni, 2),
    [p.reposo_uni, p.reposo_uni, p.caminar_uni, p.reposo_uni],
    [p.reposo_uni, p.caminar_uni, p.reposo_uni],
    [p.caminar_uni, p.reposo_uni, p.caminar_uni, p.reposo_uni],
    await breatheFrames(p.caminar_uni, 4),
  ]

  const rows = await buildRows(u)
  const cols = Math.max(...rows.map((r) => r.length))

  const sheetO = await buildSpritesheet(rows)
  fs.writeFileSync(path.join(OUT, 'capilampara-outfit.png'), sheetO)
  console.log(`  ✓ capilampara-outfit.png`)

  // Glasses: misma sheet (en esta versión ambas son iguales;
  // si hay diferencia, se extrae de otra lámina)
  const sheetG = await buildSpritesheet(rows)
  fs.writeFileSync(path.join(OUT, 'capilampara-outfit-glasses.png'), sheetG)
  console.log(`  ✓ capilampara-outfit-glasses.png`)

  return { columns: cols, rows: rows.length }
}

// ─────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════')
  console.log(' build-mascot-sprites v2 — Agenda Sami')
  console.log('═══════════════════════════════════════════')

  const pInfo = await buildPibble()
  const cInfo = await buildCapilampara()
  await buildCapilamparaOutfit()

  console.log('\n── RESUMEN ─────────────────────────────────')
  console.log(`  pibble.png:        ${pInfo.columns}×${pInfo.rows}`)
  console.log(`  capilampara.png:   ${cInfo.columns}×${cInfo.rows}`)
  console.log('  COMPLETADO ✓')
}

main().catch((err) => { console.error('\n✗ Error:', err); process.exit(1) })
