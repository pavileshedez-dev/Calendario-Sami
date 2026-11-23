/**
 * analyze-sprites.mjs — Detecta automáticamente los bounding boxes de cada
 * sprite en las láminas fuente usando análisis de proyección.
 */
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dir, '..')
const ART = path.join(ROOT, 'mascots-art')

const SHEETS = [
  { file: path.join(ART, 'pibble', '01-reposo-caminar-correr-dormir-despertar.jpg'), bg: { r: 216, g: 226, b: 235 }, name: 'pibble01' },
  { file: path.join(ART, 'pibble', '02-sentarse-tumbarse-bocaarriba-caricias-feliz.jpg'), bg: { r: 193, g: 193, b: 193 }, name: 'pibble02' },
  { file: path.join(ART, 'pibble', '03-jugar-ladrar-grunir-grunir-jugando-saludar.jpg'), bg: { r: 217, g: 207, b: 195 }, name: 'pibble03' },
  { file: path.join(ART, 'capilampara', '01-reposo-caminar-dormir-despertar-sentarse.jpg'), bg: { r: 214, g: 215, b: 210 }, name: 'capi01' },
  { file: path.join(ART, 'capilampara', '02-tumbarse-bocaarriba-leer-estudiar-caricias.jpg'), bg: { r: 193, g: 177, b: 151 }, name: 'capi02' },
  { file: path.join(ART, 'capilampara', '03-feliz-saludar-saludar2.jpg'), bg: { r: 227, g: 221, b: 205 }, name: 'capi03' },
  { file: path.join(ART, 'capilampara-uni', '01-reposo-estudiar-caminar-uni.jpg'), bg: { r: 227, g: 219, b: 206 }, name: 'uni01' },
]

function colorDist(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2)
}

function findRuns(projection, threshold = 3) {
  const runs = []
  let inRun = false, start = 0
  for (let i = 0; i < projection.length; i++) {
    if (projection[i] > threshold && !inRun) { inRun = true; start = i }
    else if (projection[i] <= threshold && inRun) {
      inRun = false
      if (i - start > 20) runs.push({ start, end: i })
    }
  }
  if (inRun && projection.length - start > 20) runs.push({ start, end: projection.length })
  return runs
}

async function analyzeSheet({ file, bg, name }) {
  console.log(`\n── ${name} ──`)
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const TOL = 38

  // Proyección horizontal (suma por columna) y vertical (suma por fila)
  const colProj = new Float32Array(width)
  const rowProj = new Float32Array(height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * channels
      const dist = colorDist(data[o], data[o+1], data[o+2], bg.r, bg.g, bg.b)
      if (dist > TOL) {
        colProj[x]++
        rowProj[y]++
      }
    }
  }

  const colRuns = findRuns(colProj, 2)
  const rowRuns = findRuns(rowProj, 2)

  console.log('  Zonas X (columnas):')
  colRuns.forEach((r, i) => console.log(`    [${i}] x=${r.start}..${r.end} (w=${r.end-r.start})`))
  console.log('  Zonas Y (filas):')
  rowRuns.forEach((r, i) => console.log(`    [${i}] y=${r.start}..${r.end} (h=${r.end-r.start})`))

  // Para cada combinación de zona X e Y, extraer bounding box real
  console.log('\n  Bounding boxes de poses:')
  let poseIdx = 0
  for (const rowRun of rowRuns) {
    for (const colRun of colRuns) {
      // Verificar que esta celda tiene contenido real
      let hasContent = false
      for (let y = rowRun.start; y < rowRun.end && !hasContent; y++) {
        for (let x = colRun.start; x < colRun.end && !hasContent; x++) {
          const o = (y * width + x) * channels
          const dist = colorDist(data[o], data[o+1], data[o+2], bg.r, bg.g, bg.b)
          if (dist > TOL) hasContent = true
        }
      }
      if (hasContent) {
        // Tight bbox dentro de la celda
        let minX = colRun.end, maxX = colRun.start, minY = rowRun.end, maxY = rowRun.start
        for (let y = rowRun.start; y < rowRun.end; y++) {
          for (let x = colRun.start; x < colRun.end; x++) {
            const o = (y * width + x) * channels
            const dist = colorDist(data[o], data[o+1], data[o+2], bg.r, bg.g, bg.b)
            if (dist > TOL) {
              if (x < minX) minX = x
              if (x > maxX) maxX = x
              if (y < minY) minY = y
              if (y > maxY) maxY = y
            }
          }
        }
        const pad = 6
        console.log(`    pose${poseIdx++}: { x: ${Math.max(0,minX-pad)}, y: ${Math.max(0,minY-pad)}, w: ${maxX-minX+pad*2}, h: ${maxY-minY+pad*2} }`)
      }
    }
  }
}

for (const sheet of SHEETS) {
  await analyzeSheet(sheet)
}
