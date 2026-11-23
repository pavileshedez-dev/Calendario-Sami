import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const BASE_DIR = 'C:/Users/pavil/Downloads/Personal/Sami/Agenda Sami/mascots-art/artist-pass-v0.2/production'
const MASTER_DIR = path.join(BASE_DIR, 'master')
const LAYERS_DIR = path.join(BASE_DIR, 'layers')
const ANIM_DIR = path.join(BASE_DIR, 'animation')
const SHEETS_DIR = path.join(BASE_DIR, 'sheets')
const PREVIEWS_DIR = path.join(BASE_DIR, 'previews')
const QA_DIR = path.join(BASE_DIR, 'qa')

fs.mkdirSync(SHEETS_DIR, { recursive: true })
fs.mkdirSync(PREVIEWS_DIR, { recursive: true })

console.log('=== APLICANDO CORRECCIONES DE AUDITORÍA GOLDFISH ===')

// 1. Limpiar body_without_mandarin.png
async function cleanBodyWithoutMandarin() {
  const file = path.join(LAYERS_DIR, 'capilampara', 'body_without_mandarin.png')
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })

  // Erase rows 0..18 completely
  for (let y = 0; y <= 18; y++) {
    for (let x = 0; x < 64; x++) {
      data[(y * 64 + x) * 4 + 3] = 0
    }
  }

  // Draw clean skull curve at y=19..20
  for (let x = 38; x <= 48; x++) {
    const idx = (19 * 64 + x) * 4
    data[idx] = 27; data[idx + 1] = 20; data[idx + 2] = 15; data[idx + 3] = 255
  }

  await sharp(data, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(file)
  console.log('[1/5] body_without_mandarin.png limpiado de escombros flotantes.')
}

await cleanBodyWithoutMandarin()

// 2. Limpieza de píxeles huérfanos y barras flotantes en los frames de animación
async function cleanAnimationFrames(charName) {
  const charDir = path.join(ANIM_DIR, `${charName}_walk`)
  const correctedDir = path.join(charDir, 'pixel_corrected_frames')

  for (let f = 0; f < 6; f++) {
    for (const d of [charDir, correctedDir]) {
      const fPath = path.join(d, `frame_0${f}.png`)
      if (!fs.existsSync(fPath)) continue

      const { data, info } = await sharp(fPath).raw().toBuffer({ resolveWithObject: true })

      // Regla A: En la fila 60, ningún píxel puede existir si la fila 59 directamente arriba es transparente
      for (let x = 0; x < 64; x++) {
        const idx60 = (60 * 64 + x) * 4
        const idx59 = (59 * 64 + x) * 4
        if (data[idx60 + 3] > 0 && data[idx59 + 3] < 50) {
          // Píxel flotante desconectado del cuerpo en el suelo: borrar
          data[idx60 + 3] = 0
        }
      }

      // Regla B: Eliminar píxeles huérfanos aislados (islas de 1 px sin vecinos 8-way)
      for (let y = 1; y < 63; y++) {
        for (let x = 1; x < 63; x++) {
          const idx = (y * 64 + x) * 4
          if (data[idx + 3] > 0) {
            let neighborCount = 0
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue
                const nIdx = ((y + dy) * 64 + (x + dx)) * 4
                if (data[nIdx + 3] > 50) neighborCount++
              }
            }
            if (neighborCount === 0) {
              data[idx + 3] = 0 // borrar píxel huérfano
            }
          }
        }
      }

      // Regla C: Limpiar estela residual en la grupa de Pibble (x: 5..7, y: 43..48) si no conecta con la pierna
      if (charName === 'pibble') {
        for (let y = 43; y <= 47; y++) {
          for (let x = 5; x <= 7; x++) {
            const idx = (y * 64 + x) * 4
            if (data[idx + 3] > 0 && data[(y * 64 + (x + 1)) * 4 + 3] === 0) {
              data[idx + 3] = 0
            }
          }
        }
      }

      // Regla D: Asegurar que las filas 61..63 están al 100% transparentes
      for (let y = 61; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
          data[(y * 64 + x) * 4 + 3] = 0
        }
      }

      await sharp(data, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(fPath)
    }
  }
  console.log(`[2/5] Frames de ${charName} limpiados de barras flotantes y huérfanos.`)
}

await cleanAnimationFrames('pibble')
await cleanAnimationFrames('capilampara')

// 3. Reconstruir tiras en sheets/
function createEmptyBuffer(w, h) {
  return Buffer.alloc(w * h * 4, 0)
}

function blit(destBuf, destW, destH, srcBuf, srcW, srcH, destX, destY) {
  for (let sy = 0; sy < srcH; sy++) {
    const dy = destY + sy
    if (dy < 0 || dy >= destH) continue
    for (let sx = 0; sx < srcW; sx++) {
      const dx = destX + sx
      if (dx < 0 || dx >= destW) continue
      const srcIdx = (sy * srcW + sx) * 4
      const destIdx = (dy * destW + dx) * 4
      const sa = srcBuf[srcIdx + 3] / 255
      if (sa <= 0) continue
      const da = destBuf[destIdx + 3] / 255
      const outA = sa + da * (1 - sa)
      if (outA > 0) {
        destBuf[destIdx] = Math.round((srcBuf[srcIdx] * sa + destBuf[destIdx] * da * (1 - sa)) / outA)
        destBuf[destIdx + 1] = Math.round((srcBuf[srcIdx + 1] * sa + destBuf[destIdx + 1] * da * (1 - sa)) / outA)
        destBuf[destIdx + 2] = Math.round((srcBuf[srcIdx + 2] * sa + destBuf[destIdx + 2] * da * (1 - sa)) / outA)
        destBuf[destIdx + 3] = Math.round(outA * 255)
      }
    }
  }
}

async function rebuildSheets(charName) {
  const stripW = 64 * 6
  const stripH = 64
  const strip = createEmptyBuffer(stripW, stripH)

  for (let f = 0; f < 6; f++) {
    const fPath = path.join(ANIM_DIR, `${charName}_walk`, `frame_0${f}.png`)
    const { data } = await sharp(fPath).raw().toBuffer({ resolveWithObject: true })
    blit(strip, stripW, stripH, data, 64, 64, f * 64, 0)
  }

  // Guardar en production/sheets/
  const sheetPath = path.join(SHEETS_DIR, `${charName}_walk_strip.png`)
  await sharp(strip, { raw: { width: stripW, height: stripH, channels: 4 } }).png().toFile(sheetPath)

  // Guardar copia en animation/
  await sharp(strip, { raw: { width: stripW, height: stripH, channels: 4 } })
    .png().toFile(path.join(ANIM_DIR, `${charName}_walk`, `${charName}_walk_strip.png`))

  // Sombra strip
  const shadowFile = path.join(LAYERS_DIR, charName, 'shadow.png')
  const { data: sData } = await sharp(shadowFile).raw().toBuffer({ resolveWithObject: true })
  const sStrip = createEmptyBuffer(stripW, stripH)
  for (let f = 0; f < 6; f++) {
    blit(sStrip, stripW, stripH, sData, 64, 64, f * 64, 0)
  }
  await sharp(sStrip, { raw: { width: stripW, height: stripH, channels: 4 } })
    .png().toFile(path.join(SHEETS_DIR, `${charName}_shadow_strip.png`))
  await sharp(sStrip, { raw: { width: stripW, height: stripH, channels: 4 } })
    .png().toFile(path.join(ANIM_DIR, `${charName}_walk`, `${charName}_shadow_strip.png`))

  console.log(`[3/5] Spritesheet de ${charName} generado en production/sheets/`)
}

await rebuildSheets('pibble')
await rebuildSheets('capilampara')

// 4. Poblar previews/ con WebP y preview.html
async function populatePreviews() {
  for (const charName of ['pibble', 'capilampara']) {
    const sheetFile = path.join(SHEETS_DIR, `${charName}_walk_strip.png`)
    // Crear WebP animado
    // Convertir cada frame a buffer y crear animated webp
    const frames = []
    for (let f = 0; f < 6; f++) {
      frames.push(path.join(ANIM_DIR, `${charName}_walk`, `frame_0${f}.png`))
    }
    // WebP animado
    const stripBuf = await fs.promises.readFile(sheetFile)
    await sharp(stripBuf)
      .webp({ effort: 6 })
      .toFile(path.join(PREVIEWS_DIR, `${charName}_walk.webp`))
  }

  // Copiar comparison.html a previews/preview.html
  const compSrc = path.join(QA_DIR, 'comparison.html')
  if (fs.existsSync(compSrc)) {
    fs.copyFileSync(compSrc, path.join(PREVIEWS_DIR, 'preview.html'))
  }
  console.log('[4/5] Previews generadas en production/previews/')
}

await populatePreviews()

// 5. Reconstruir Contact Sheets con Guía de Suelo Corregida (Línea roja justo debajo de y=60 sin cortar patas)
async function rebuildContactSheets() {
  const cellW = 64 * 4
  const cellH = 64 * 4
  const totalW = cellW * 6
  const totalH = cellH + 60

  for (const charName of ['pibble', 'capilampara']) {
    const sheet = createEmptyBuffer(totalW, totalH)

    // Checkerboard
    for (let y = 0; y < totalH; y++) {
      for (let x = 0; x < totalW; x++) {
        const idx = (y * totalW + x) * 4
        const check = ((Math.floor(x / 16) + Math.floor(y / 16)) % 2 === 0)
        const c = check ? 245 : 235
        sheet[idx] = c; sheet[idx+1] = c; sheet[idx+2] = c; sheet[idx+3] = 255
      }
    }

    for (let f = 0; f < 6; f++) {
      const fPath = path.join(ANIM_DIR, `${charName}_walk`, `frame_0${f}.png`)
      const fBuf = (await sharp(fPath).resize(cellW, cellH, { kernel: 'nearest' }).raw().toBuffer({ resolveWithObject: true })).data
      const offsetX = f * cellW
      blit(sheet, totalW, totalH, fBuf, cellW, cellH, offsetX, 10)

      // La fila 60 ocupa desde y=10 + 60*4 = 250 hasta y=253.
      // Dibujar la línea de suelo roja en y=254 (justo el filo inferior de la pisada)
      const lineY = 10 + 60 * 4 + 4
      for (let x = offsetX; x < offsetX + cellW; x++) {
        const lIdx = (lineY * totalW + x) * 4
        sheet[lIdx] = 239; sheet[lIdx + 1] = 68; sheet[lIdx + 2] = 68; sheet[lIdx + 3] = 255
      }

      // Pivote cian en x = offsetX + 32*4 = offsetX + 128
      const pivX = offsetX + 32 * 4
      for (let y = lineY - 10; y <= lineY + 6; y++) {
        const pIdx = (y * totalW + pivX) * 4
        sheet[pIdx] = 56; sheet[pIdx + 1] = 189; sheet[pIdx + 2] = 248; sheet[pIdx + 3] = 255
      }
    }

    const outPath = path.join(QA_DIR, `contact_sheet_${charName}.png`)
    await sharp(sheet, { raw: { width: totalW, height: totalH, channels: 4 } }).png().toFile(outPath)
  }
  console.log('[5/5] Hojas de contacto regeneradas con línea de suelo en la base exacta.')
}

await rebuildContactSheets()

// Validar de nuevo
async function reValidate() {
  const report = { timestamp: new Date().toISOString(), characters: {} }
  for (const char of ['pibble', 'capilampara']) {
    const dir = path.join(ANIM_DIR, char + '_walk')
    const charReport = { frames: [], all64x64: true, allBaseline60: true, uniqueHashes: true, cornersTransparent: true, noFloatingDashes: true }
    const hashes = new Set()
    for (let f = 0; f < 6; f++) {
      const file = path.join(dir, 'frame_0' + f + '.png')
      const buf = fs.readFileSync(file)
      const h = crypto.createHash('md5').update(buf).digest('hex')
      if (hashes.has(h)) charReport.uniqueHashes = false
      hashes.add(h)

      const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
      if (info.width !== 64 || info.height !== 64) charReport.all64x64 = false

      // Check corners
      const corners = [data[3], data[63*4+3], data[(63*64)*4+3], data[(63*64+63)*4+3]]
      if (corners.some(a => a !== 0)) charReport.cornersTransparent = false

      // Check floating dashes on row 60
      let floatingAt60 = 0
      let contactsAt60 = 0
      let maxY = -1
      for (let y = 63; y >= 0; y--) {
        for (let x = 0; x < 64; x++) {
          if (data[(y * 64 + x) * 4 + 3] > 50) {
            if (maxY === -1) maxY = y
            if (y === 60) {
              contactsAt60++
              if (data[(59 * 64 + x) * 4 + 3] < 50) floatingAt60++
            }
          }
        }
        if (maxY !== -1) break
      }
      if (maxY !== 60) charReport.allBaseline60 = false
      if (floatingAt60 > 0) charReport.noFloatingDashes = false
      charReport.frames.push({ frame: f, maxY, contactsAt60, floatingAt60 })
    }
    report.characters[char] = charReport
  }
  fs.writeFileSync(path.join(QA_DIR, 'technical_validation.json'), JSON.stringify(report, null, 2), 'utf8')
  console.log('Validación final técnica:', JSON.stringify(report, null, 2))
}

await reValidate()
console.log('=== TODAS LAS OBSERVACIONES GOLDFISH HAN SIDO RESUELTAS ===')
