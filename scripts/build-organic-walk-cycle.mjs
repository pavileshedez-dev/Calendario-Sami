import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const BASE_DIR = 'C:/Users/pavil/Downloads/Personal/Sami/Agenda Sami/mascots-art/artist-pass-v0.2/production'
const MASTER_DIR = path.join(BASE_DIR, 'master')
const LAYERS_DIR = path.join(BASE_DIR, 'layers')
const ANIM_DIR = path.join(BASE_DIR, 'animation')
const QA_DIR = path.join(BASE_DIR, 'qa')

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

// Generate organic walk cycle for Pibble
async function generateOrganicPibbleWalk() {
  const masterPath = path.join(MASTER_DIR, 'pibble_master.png')
  const { data: master } = await sharp(masterPath).raw().toBuffer({ resolveWithObject: true })

  const pibbleAnimDir = path.join(ANIM_DIR, 'pibble_walk')
  const puppetDir = path.join(pibbleAnimDir, 'puppet_frames')
  const correctedDir = path.join(pibbleAnimDir, 'pixel_corrected_frames')

  // In Pibble master (64x64):
  // Legs coordinates:
  // Rear near leg (RNB): x: 6..18, y: 44..60
  // Rear far leg (RFB): x: 19..28, y: 44..58
  // Front near leg (FNB): x: 40..50, y: 46..60
  // Front far leg (FFB): x: 50..58, y: 44..58
  // Torso & head: all rows y <= 45, plus belly between x: 18 and 42 down to row 50.

  // 6 gait phases:
  // F0: Contact A (FN fwd +2px, FF back -2px, RN back -2px, RF fwd +2px) - bodyDy: 0
  // F1: Recoil A (Down) - bodyDy: +1, FN planted dx: +1, FF lift dy: -2, RN lift dy: -2, RF planted dx: +1
  // F2: Passing A - bodyDy: 0, FN planted dx: 0, FF pass fwd dx: +1 dy: -2, RN pass fwd dx: 0 dy: -2, RF planted dx: 0
  // F3: Contact B (FN back -2px, FF fwd +2px, RN fwd +2px, RF back -2px) - bodyDy: 0
  // F4: Recoil B (Down) - bodyDy: +1, FN lift dy: -2, FF planted dx: +1, RN planted dx: +1, RF lift dy: -2
  // F5: Passing B - bodyDy: 0, FN pass fwd dx: +1 dy: -2, FF planted dx: 0, RN planted dx: 0, RF pass fwd dx: 0 dy: -2

  const gaitConfigs = [
    { fn: { dx: 2, dy: 0 }, ff: { dx: -2, dy: 0 }, rn: { dx: -2, dy: 0 }, rf: { dx: 2, dy: 0 }, bodyDy: 0 },
    { fn: { dx: 1, dy: 0 }, ff: { dx: -1, dy: -2 }, rn: { dx: -1, dy: -2 }, rf: { dx: 1, dy: 0 }, bodyDy: 1 },
    { fn: { dx: 0, dy: 0 }, ff: { dx: 1, dy: -2 }, rn: { dx: 0, dy: -2 }, rf: { dx: 0, dy: 0 }, bodyDy: 0 },
    { fn: { dx: -2, dy: 0 }, ff: { dx: 2, dy: 0 }, rn: { dx: 2, dy: 0 }, rf: { dx: -2, dy: 0 }, bodyDy: 0 },
    { fn: { dx: -1, dy: -2 }, ff: { dx: 1, dy: 0 }, rn: { dx: 1, dy: 0 }, rf: { dx: -1, dy: -2 }, bodyDy: 1 },
    { fn: { dx: 1, dy: -2 }, ff: { dx: 0, dy: 0 }, rn: { dx: 0, dy: 0 }, rf: { dx: 1, dy: -2 }, bodyDy: 0 }
  ]

  const pFrames = []
  const cFrames = []

  for (let f = 0; f < 6; f++) {
    const cfg = gaitConfigs[f]

    // 1. Puppet frame (rigid segmented transformation)
    const pBuf = createEmptyBuffer(64, 64)
    
    // Copy pixels from master according to anatomical zones
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const idx = (y * 64 + x) * 4
        if (master[idx + 3] < 30) continue

        let dx = 0
        let dy = cfg.bodyDy

        // Determine which zone pixel belongs to:
        if (y >= 46 && x >= 40 && x <= 50) {
          // Front Near Leg
          dx = cfg.fn.dx
          dy = cfg.fn.dy + (cfg.fn.dy === 0 ? cfg.bodyDy : 0)
        } else if (y >= 44 && x >= 50 && x <= 58) {
          // Front Far Leg
          dx = cfg.ff.dx
          dy = cfg.ff.dy + (cfg.ff.dy === 0 ? cfg.bodyDy : 0)
        } else if (y >= 44 && x >= 6 && x <= 18) {
          // Rear Near Leg
          dx = cfg.rn.dx
          dy = cfg.rn.dy + (cfg.rn.dy === 0 ? cfg.bodyDy : 0)
        } else if (y >= 44 && x >= 19 && x <= 28) {
          // Rear Far Leg
          dx = cfg.rf.dx
          dy = cfg.rf.dy + (cfg.rf.dy === 0 ? cfg.bodyDy : 0)
        } else {
          // Torso / Head / Tail / Back
          dx = 0
          dy = cfg.bodyDy
        }

        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < 64 && ny >= 0 && ny <= 60) {
          const nIdx = (ny * 64 + nx) * 4
          pBuf[nIdx] = master[idx]
          pBuf[nIdx + 1] = master[idx + 1]
          pBuf[nIdx + 2] = master[idx + 2]
          pBuf[nIdx + 3] = master[idx + 3]
        }
      }
    }

    // Save puppet frame
    await sharp(pBuf, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(puppetDir, `frame_0${f}.png`))
    pFrames.push(pBuf)

    // 2. Pixel-Corrected frame (Healed seams, clean outline, locked paws)
    const cBuf = Buffer.from(pBuf)

    // Inpaint any gaps created by limb shift around joints (y: 44..50, x: 6..58)
    for (let y = 43; y <= 50; y++) {
      for (let x = 7; x <= 56; x++) {
        const idx = (y * 64 + x) * 4
        if (cBuf[idx + 3] === 0) {
          // Check if surrounded by solid pixels
          let solidNeighbors = 0
          let sumR = 0, sumG = 0, sumB = 0
          for (const [ox, oy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1]]) {
            const tx = x + ox, ty = y + oy
            if (tx >= 0 && tx < 64 && ty >= 0 && ty < 64) {
              const tidx = (ty * 64 + tx) * 4
              if (cBuf[tidx + 3] > 100) {
                solidNeighbors++
                sumR += cBuf[tidx]
                sumG += cBuf[tidx + 1]
                sumB += cBuf[tidx + 2]
              }
            }
          }
          if (solidNeighbors >= 3) {
            cBuf[idx] = Math.round(sumR / solidNeighbors)
            cBuf[idx + 1] = Math.round(sumG / solidNeighbors)
            cBuf[idx + 2] = Math.round(sumB / solidNeighbors)
            cBuf[idx + 3] = 255
          }
        }
      }
    }

    // Solidify planted paw contacts at baseline y=60
    // Check which legs are planted (dy === 0)
    if (cfg.fn.dy === 0) {
      const baseFn = 46 + cfg.fn.dx
      for (let px = baseFn - 2; px <= baseFn + 3; px++) {
        const idx = (60 * 64 + px) * 4
        cBuf[idx] = 24; cBuf[idx+1] = 18; cBuf[idx+2] = 15; cBuf[idx+3] = 255
      }
    }
    if (cfg.ff.dy === 0) {
      const baseFf = 53 + cfg.ff.dx
      for (let px = baseFf - 2; px <= baseFf + 2; px++) {
        const idx = (60 * 64 + px) * 4
        cBuf[idx] = 24; cBuf[idx+1] = 18; cBuf[idx+2] = 15; cBuf[idx+3] = 255
      }
    }
    if (cfg.rn.dy === 0) {
      const baseRn = 12 + cfg.rn.dx
      for (let px = baseRn - 2; px <= baseRn + 2; px++) {
        const idx = (60 * 64 + px) * 4
        cBuf[idx] = 24; cBuf[idx+1] = 18; cBuf[idx+2] = 15; cBuf[idx+3] = 255
      }
    }
    if (cfg.rf.dy === 0) {
      const baseRf = 23 + cfg.rf.dx
      for (let px = baseRf - 2; px <= baseRf + 2; px++) {
        const idx = (60 * 64 + px) * 4
        cBuf[idx] = 24; cBuf[idx+1] = 18; cBuf[idx+2] = 15; cBuf[idx+3] = 255
      }
    }

    // Enforce crisp 1px exterior outline
    for (let y = 1; y < 61; y++) {
      for (let x = 1; x < 63; x++) {
        const idx = (y * 64 + x) * 4
        if (cBuf[idx + 3] > 0) {
          const isEdge = (
            cBuf[(y * 64 + (x - 1)) * 4 + 3] === 0 ||
            cBuf[(y * 64 + (x + 1)) * 4 + 3] === 0 ||
            cBuf[((y - 1) * 64 + x) * 4 + 3] === 0 ||
            cBuf[((y + 1) * 64 + x) * 4 + 3] === 0
          )
          if (isEdge) {
            const r = cBuf[idx], g = cBuf[idx + 1], b = cBuf[idx + 2]
            if (r > 75 || g > 65 || b > 55) {
              cBuf[idx] = 24; cBuf[idx + 1] = 18; cBuf[idx + 2] = 15; cBuf[idx + 3] = 255
            }
          }
        }
      }
    }

    // Zero out below row 60
    for (let x = 0; x < 64; x++) {
      for (let y = 61; y < 64; y++) {
        cBuf[(y * 64 + x) * 4 + 3] = 0
      }
    }

    await sharp(cBuf, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(correctedDir, `frame_0${f}.png`))
    await sharp(cBuf, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(pibbleAnimDir, `frame_0${f}.png`))
    cFrames.push(cBuf)
  }

  // Horizontal strips
  const stripW = 384, stripH = 64
  const pStrip = createEmptyBuffer(stripW, stripH)
  const cStrip = createEmptyBuffer(stripW, stripH)
  for (let f = 0; f < 6; f++) {
    blit(pStrip, stripW, stripH, pFrames[f], 64, 64, f * 64, 0)
    blit(cStrip, stripW, stripH, cFrames[f], 64, 64, f * 64, 0)
  }

  await sharp(pStrip, { raw: { width: stripW, height: stripH, channels: 4 } }).png().toFile(path.join(pibbleAnimDir, 'pibble_walk_puppet_strip.png'))
  await sharp(cStrip, { raw: { width: stripW, height: stripH, channels: 4 } }).png().toFile(path.join(pibbleAnimDir, 'pibble_walk_strip.png'))

  console.log('Organic Pibble walk cycle generated without rectangular boxes.')
}

// Generate organic walk cycle for Capilampara
async function generateOrganicCapilamparaWalk() {
  const masterPath = path.join(MASTER_DIR, 'capilampara_master.png')
  const { data: master } = await sharp(masterPath).raw().toBuffer({ resolveWithObject: true })

  const capiAnimDir = path.join(ANIM_DIR, 'capilampara_walk')
  const puppetDir = path.join(capiAnimDir, 'puppet_frames')
  const correctedDir = path.join(capiAnimDir, 'pixel_corrected_frames')

  // Capilampara coordinates:
  // Front near leg: x: 36..46, y: 46..60
  // Front far leg: x: 45..54, y: 44..58
  // Rear near leg: x: 8..19, y: 46..60
  // Rear far leg: x: 19..28, y: 44..58
  // Mandarin: y: 8..20, x: 37..50

  const gaitConfigs = [
    { fn: { dx: 2, dy: 0 }, ff: { dx: -2, dy: 0 }, rn: { dx: -2, dy: 0 }, rf: { dx: 2, dy: 0 }, bodyDy: 0, manDy: 0 },
    { fn: { dx: 1, dy: 0 }, ff: { dx: -1, dy: -2 }, rn: { dx: -1, dy: -2 }, rf: { dx: 1, dy: 0 }, bodyDy: 1, manDy: 1 },
    { fn: { dx: 0, dy: 0 }, ff: { dx: 1, dy: -2 }, rn: { dx: 0, dy: -2 }, rf: { dx: 0, dy: 0 }, bodyDy: 0, manDy: 0 },
    { fn: { dx: -2, dy: 0 }, ff: { dx: 2, dy: 0 }, rn: { dx: 2, dy: 0 }, rf: { dx: -2, dy: 0 }, bodyDy: 0, manDy: 0 },
    { fn: { dx: -1, dy: -2 }, ff: { dx: 1, dy: 0 }, rn: { dx: 1, dy: 0 }, rf: { dx: -1, dy: -2 }, bodyDy: 1, manDy: 1 },
    { fn: { dx: 1, dy: -2 }, ff: { dx: 0, dy: 0 }, rn: { dx: 0, dy: 0 }, rf: { dx: 1, dy: -2 }, bodyDy: 0, manDy: 0 }
  ]

  const pFrames = []
  const cFrames = []

  for (let f = 0; f < 6; f++) {
    const cfg = gaitConfigs[f]
    const pBuf = createEmptyBuffer(64, 64)

    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const idx = (y * 64 + x) * 4
        if (master[idx + 3] < 30) continue

        let dx = 0
        let dy = cfg.bodyDy

        if (y >= 46 && x >= 36 && x <= 46) {
          dx = cfg.fn.dx
          dy = cfg.fn.dy + (cfg.fn.dy === 0 ? cfg.bodyDy : 0)
        } else if (y >= 44 && x >= 47 && x <= 54) {
          dx = cfg.ff.dx
          dy = cfg.ff.dy + (cfg.ff.dy === 0 ? cfg.bodyDy : 0)
        } else if (y >= 46 && x >= 8 && x <= 19) {
          dx = cfg.rn.dx
          dy = cfg.rn.dy + (cfg.rn.dy === 0 ? cfg.bodyDy : 0)
        } else if (y >= 44 && x >= 20 && x <= 28) {
          dx = cfg.rf.dx
          dy = cfg.rf.dy + (cfg.rf.dy === 0 ? cfg.bodyDy : 0)
        } else if (y <= 20 && x >= 37 && x <= 50) {
          // Mandarin on head
          dx = 0
          dy = cfg.manDy
        } else {
          // Body & Head
          dx = 0
          dy = cfg.bodyDy
        }

        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < 64 && ny >= 0 && ny <= 60) {
          const nIdx = (ny * 64 + nx) * 4
          pBuf[nIdx] = master[idx]
          pBuf[nIdx + 1] = master[idx + 1]
          pBuf[nIdx + 2] = master[idx + 2]
          pBuf[nIdx + 3] = master[idx + 3]
        }
      }
    }

    await sharp(pBuf, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(puppetDir, `frame_0${f}.png`))
    pFrames.push(pBuf)

    // Pixel-corrected
    const cBuf = Buffer.from(pBuf)

    // Inpaint joint gaps
    for (let y = 44; y <= 52; y++) {
      for (let x = 8; x <= 54; x++) {
        const idx = (y * 64 + x) * 4
        if (cBuf[idx + 3] === 0) {
          let solidNeighbors = 0
          let sumR = 0, sumG = 0, sumB = 0
          for (const [ox, oy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1]]) {
            const tx = x + ox, ty = y + oy
            if (tx >= 0 && tx < 64 && ty >= 0 && ty < 64) {
              const tidx = (ty * 64 + tx) * 4
              if (cBuf[tidx + 3] > 100) {
                solidNeighbors++
                sumR += cBuf[tidx]
                sumG += cBuf[tidx + 1]
                sumB += cBuf[tidx + 2]
              }
            }
          }
          if (solidNeighbors >= 3) {
            cBuf[idx] = Math.round(sumR / solidNeighbors)
            cBuf[idx + 1] = Math.round(sumG / solidNeighbors)
            cBuf[idx + 2] = Math.round(sumB / solidNeighbors)
            cBuf[idx + 3] = 255
          }
        }
      }
    }

    // Solidify planted paws at baseline y=60
    if (cfg.fn.dy === 0) {
      const baseFn = 41 + cfg.fn.dx
      for (let px = baseFn - 2; px <= baseFn + 3; px++) {
        const idx = (60 * 64 + px) * 4
        cBuf[idx] = 27; cBuf[idx+1] = 20; cBuf[idx+2] = 15; cBuf[idx+3] = 255
      }
    }
    if (cfg.ff.dy === 0) {
      const baseFf = 50 + cfg.ff.dx
      for (let px = baseFf - 2; px <= baseFf + 2; px++) {
        const idx = (60 * 64 + px) * 4
        cBuf[idx] = 27; cBuf[idx+1] = 20; cBuf[idx+2] = 15; cBuf[idx+3] = 255
      }
    }
    if (cfg.rn.dy === 0) {
      const baseRn = 13 + cfg.rn.dx
      for (let px = baseRn - 2; px <= baseRn + 2; px++) {
        const idx = (60 * 64 + px) * 4
        cBuf[idx] = 27; cBuf[idx+1] = 20; cBuf[idx+2] = 15; cBuf[idx+3] = 255
      }
    }
    if (cfg.rf.dy === 0) {
      const baseRf = 23 + cfg.rf.dx
      for (let px = baseRf - 2; px <= baseRf + 2; px++) {
        const idx = (60 * 64 + px) * 4
        cBuf[idx] = 27; cBuf[idx+1] = 20; cBuf[idx+2] = 15; cBuf[idx+3] = 255
      }
    }

    // Outline pass
    for (let y = 1; y < 61; y++) {
      for (let x = 1; x < 63; x++) {
        const idx = (y * 64 + x) * 4
        if (cBuf[idx + 3] > 0) {
          const isEdge = (
            cBuf[(y * 64 + (x - 1)) * 4 + 3] === 0 ||
            cBuf[(y * 64 + (x + 1)) * 4 + 3] === 0 ||
            cBuf[((y - 1) * 64 + x) * 4 + 3] === 0 ||
            cBuf[((y + 1) * 64 + x) * 4 + 3] === 0
          )
          if (isEdge) {
            const r = cBuf[idx], g = cBuf[idx + 1], b = cBuf[idx + 2]
            if (r > 70 || g > 60 || b > 50) {
              cBuf[idx] = 27; cBuf[idx + 1] = 20; cBuf[idx + 2] = 15; cBuf[idx + 3] = 255
            }
          }
        }
      }
    }

    // Clear below 60
    for (let x = 0; x < 64; x++) {
      for (let y = 61; y < 64; y++) {
        cBuf[(y * 64 + x) * 4 + 3] = 0
      }
    }

    await sharp(cBuf, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(correctedDir, `frame_0${f}.png`))
    await sharp(cBuf, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(capiAnimDir, `frame_0${f}.png`))
    cFrames.push(cBuf)
  }

  // Horizontal strips
  const stripW = 384, stripH = 64
  const pStrip = createEmptyBuffer(stripW, stripH)
  const cStrip = createEmptyBuffer(stripW, stripH)
  for (let f = 0; f < 6; f++) {
    blit(pStrip, stripW, stripH, pFrames[f], 64, 64, f * 64, 0)
    blit(cStrip, stripW, stripH, cFrames[f], 64, 64, f * 64, 0)
  }

  await sharp(pStrip, { raw: { width: stripW, height: stripH, channels: 4 } }).png().toFile(path.join(capiAnimDir, 'capilampara_walk_puppet_strip.png'))
  await sharp(cStrip, { raw: { width: stripW, height: stripH, channels: 4 } }).png().toFile(path.join(capiAnimDir, 'capilampara_walk_strip.png'))

  console.log('Organic Capilampara walk cycle generated without rectangular boxes.')
}

async function rebuildAll() {
  await generateOrganicPibbleWalk()
  await generateOrganicCapilamparaWalk()

  // Re-generate QA contact sheets
  await buildContactSheet('pibble', path.join(ANIM_DIR, 'pibble_walk', 'pixel_corrected_frames'), path.join(QA_DIR, 'contact_sheet_pibble.png'))
  await buildContactSheet('capilampara', path.join(ANIM_DIR, 'capilampara_walk', 'pixel_corrected_frames'), path.join(QA_DIR, 'contact_sheet_capilampara.png'))
  await buildContactSheet('pibble_puppet', path.join(ANIM_DIR, 'pibble_walk', 'puppet_frames'), path.join(QA_DIR, 'contact_sheet_pibble_puppet.png'))
  await buildContactSheet('capilampara_puppet', path.join(ANIM_DIR, 'capilampara_walk', 'puppet_frames'), path.join(QA_DIR, 'contact_sheet_capilampara_puppet.png'))

  console.log('All contact sheets updated successfully.')
}

async function buildContactSheet(name, framesDir, outPath) {
  const cellW = 64 * 4
  const cellH = 64 * 4
  const totalW = cellW * 6
  const totalH = cellH + 60
  const sheet = createEmptyBuffer(totalW, totalH)

  for (let y = 0; y < totalH; y++) {
    for (let x = 0; x < totalW; x++) {
      const idx = (y * totalW + x) * 4
      const check = ((Math.floor(x / 16) + Math.floor(y / 16)) % 2 === 0)
      const c = check ? 245 : 235
      sheet[idx] = c; sheet[idx+1] = c; sheet[idx+2] = c; sheet[idx+3] = 255
    }
  }

  for (let f = 0; f < 6; f++) {
    const fPath = path.join(framesDir, `frame_0${f}.png`)
    const fBuf = (await sharp(fPath).resize(cellW, cellH, { kernel: 'nearest' }).raw().toBuffer({ resolveWithObject: true })).data
    const offsetX = f * cellW
    blit(sheet, totalW, totalH, fBuf, cellW, cellH, offsetX, 10)

    const lineY = 10 + 60 * 4
    for (let x = offsetX; x < offsetX + cellW; x++) {
      const lIdx = (lineY * totalW + x) * 4
      sheet[lIdx] = 230; sheet[lIdx + 1] = 40; sheet[lIdx + 2] = 40; sheet[lIdx + 3] = 255
    }

    const pivX = offsetX + 32 * 4
    for (let y = lineY - 8; y <= lineY + 8; y++) {
      const pIdx = (y * totalW + pivX) * 4
      sheet[pIdx] = 0; sheet[pIdx + 1] = 180; sheet[pIdx + 2] = 220; sheet[pIdx + 3] = 255
    }
  }

  await sharp(sheet, { raw: { width: totalW, height: totalH, channels: 4 } }).png().toFile(outPath)
}

await rebuildAll()
