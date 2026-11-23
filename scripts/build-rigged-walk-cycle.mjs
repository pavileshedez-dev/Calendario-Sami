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

// Build proper anatomical layers for Pibble
async function buildPibbleRig() {
  const masterPath = path.join(MASTER_DIR, 'pibble_master.png')
  const { data: master, info } = await sharp(masterPath).raw().toBuffer({ resolveWithObject: true })

  // 1. Torso: contains the entire body and head, with underbody belly filled between legs
  const torso = Buffer.from(master)
  
  // Fill underbody belly line across y=43..47 so there are NO transparent holes behind the legs
  for (let x = 7; x <= 56; x++) {
    for (let y = 41; y <= 48; y++) {
      const idx = (y * 64 + x) * 4
      // Sample nearby belly color (light warm cream)
      torso[idx] = 234     // R
      torso[idx + 1] = 215 // G
      torso[idx + 2] = 187 // B
      torso[idx + 3] = 255
    }
    // Bottom edge outline of belly at y=48
    if (x >= 12 && x <= 50) {
      const bIdx = (48 * 64 + x) * 4
      torso[bIdx] = 24
      torso[bIdx + 1] = 18
      torso[bIdx + 2] = 15
      torso[bIdx + 3] = 255
    }
  }
  // Clear the original legs from the torso layer below y=48
  for (let y = 49; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      torso[(y * 64 + x) * 4 + 3] = 0
    }
  }

  // 2. Extract 4 separate legs with upper joint caps
  // Near Front Leg (NFL): x: 42..52, y: 39..60
  const legNF = createEmptyBuffer(64, 64)
  for (let y = 39; y <= 60; y++) {
    for (let x = 41; x <= 52; x++) {
      const idx = (y * 64 + x) * 4
      if (master[idx + 3] > 50) {
        legNF[idx] = master[idx]
        legNF[idx + 1] = master[idx + 1]
        legNF[idx + 2] = master[idx + 2]
        legNF[idx + 3] = master[idx + 3]
      }
    }
  }

  // Far Front Leg (FFL): x: 48..58, y: 38..58
  const legFF = createEmptyBuffer(64, 64)
  for (let y = 38; y <= 58; y++) {
    for (let x = 48; x <= 58; x++) {
      const idx = (y * 64 + x) * 4
      if (master[idx + 3] > 50) {
        legFF[idx] = Math.round(master[idx] * 0.85) // depth shading
        legFF[idx + 1] = Math.round(master[idx + 1] * 0.85)
        legFF[idx + 2] = Math.round(master[idx + 2] * 0.85)
        legFF[idx + 3] = master[idx + 3]
      }
    }
  }

  // Near Hind Leg (NHL): x: 8..20, y: 38..60
  const legNB = createEmptyBuffer(64, 64)
  for (let y = 38; y <= 60; y++) {
    for (let x = 8; x <= 20; x++) {
      const idx = (y * 64 + x) * 4
      if (master[idx + 3] > 50) {
        legNB[idx] = master[idx]
        legNB[idx + 1] = master[idx + 1]
        legNB[idx + 2] = master[idx + 2]
        legNB[idx + 3] = master[idx + 3]
      }
    }
  }

  // Far Hind Leg (FHL): x: 19..30, y: 38..58
  const legFB = createEmptyBuffer(64, 64)
  for (let y = 38; y <= 58; y++) {
    for (let x = 19; x <= 30; x++) {
      const idx = (y * 64 + x) * 4
      if (master[idx + 3] > 50) {
        legFB[idx] = Math.round(master[idx] * 0.85)
        legFB[idx + 1] = Math.round(master[idx + 1] * 0.85)
        legFB[idx + 2] = Math.round(master[idx + 2] * 0.85)
        legFB[idx + 3] = master[idx + 3]
      }
    }
  }

  // Save isolated layers to production/layers/pibble/
  const pibbleLayerDir = path.join(LAYERS_DIR, 'pibble')
  await sharp(torso, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(pibbleLayerDir, 'torso.png'))
  await sharp(legNF, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(pibbleLayerDir, 'leg_front_near.png'))
  await sharp(legFF, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(pibbleLayerDir, 'leg_front_far.png'))
  await sharp(legNB, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(pibbleLayerDir, 'leg_hind_near.png'))
  await sharp(legFB, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(pibbleLayerDir, 'leg_hind_far.png'))

  console.log('Pibble layers saved with continuous filled underbody.')

  return { torso, legNF, legFF, legNB, legFB }
}

// Build proper anatomical layers for Capilampara
async function buildCapilamparaRig() {
  const masterPath = path.join(MASTER_DIR, 'capilampara_master.png')
  const { data: master, info } = await sharp(masterPath).raw().toBuffer({ resolveWithObject: true })

  // 1. Mandarin is already extracted, but let's have clean torso without holes
  const torso = Buffer.from(master)

  // Remove mandarin on top (y < 19, x: 36..52)
  for (let y = 0; y < 19; y++) {
    for (let x = 36; x < 53; x++) {
      torso[(y * 64 + x) * 4 + 3] = 0
    }
  }
  // Skull crown outline at y=19
  for (let x = 38; x <= 48; x++) {
    const idx = (19 * 64 + x) * 4
    if (torso[idx + 3] > 0) {
      torso[idx] = 27; torso[idx + 1] = 20; torso[idx + 2] = 15; torso[idx + 3] = 255
    }
  }

  // Fill underbody belly line across y=48..53 so there are NO transparent holes behind the legs
  for (let x = 8; x <= 52; x++) {
    for (let y = 47; y <= 53; y++) {
      const idx = (y * 64 + x) * 4
      torso[idx] = 240     // R
      torso[idx + 1] = 215 // G
      torso[idx + 2] = 176 // B (cream belly)
      torso[idx + 3] = 255
    }
    // Bottom outline of belly at y=53
    if (x >= 12 && x <= 47) {
      const bIdx = (53 * 64 + x) * 4
      torso[bIdx] = 27
      torso[bIdx + 1] = 20
      torso[bIdx + 2] = 15
      torso[bIdx + 3] = 255
    }
  }
  // Clear legs below y=53
  for (let y = 54; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      torso[(y * 64 + x) * 4 + 3] = 0
    }
  }

  // Extract legs
  // Near Front: x: 36..46, y: 44..60
  const legNF = createEmptyBuffer(64, 64)
  for (let y = 44; y <= 60; y++) {
    for (let x = 36; x <= 46; x++) {
      const idx = (y * 64 + x) * 4
      if (master[idx + 3] > 50) {
        legNF[idx] = master[idx]
        legNF[idx + 1] = master[idx + 1]
        legNF[idx + 2] = master[idx + 2]
        legNF[idx + 3] = master[idx + 3]
      }
    }
  }

  // Far Front: x: 44..52, y: 42..58
  const legFF = createEmptyBuffer(64, 64)
  for (let y = 42; y <= 58; y++) {
    for (let x = 44; x <= 52; x++) {
      const idx = (y * 64 + x) * 4
      if (master[idx + 3] > 50) {
        legFF[idx] = Math.round(master[idx] * 0.85)
        legFF[idx + 1] = Math.round(master[idx + 1] * 0.85)
        legFF[idx + 2] = Math.round(master[idx + 2] * 0.85)
        legFF[idx + 3] = master[idx + 3]
      }
    }
  }

  // Near Hind: x: 8..20, y: 44..60
  const legNB = createEmptyBuffer(64, 64)
  for (let y = 44; y <= 60; y++) {
    for (let x = 8; x <= 20; x++) {
      const idx = (y * 64 + x) * 4
      if (master[idx + 3] > 50) {
        legNB[idx] = master[idx]
        legNB[idx + 1] = master[idx + 1]
        legNB[idx + 2] = master[idx + 2]
        legNB[idx + 3] = master[idx + 3]
      }
    }
  }

  // Far Hind: x: 19..28, y: 42..58
  const legFB = createEmptyBuffer(64, 64)
  for (let y = 42; y <= 58; y++) {
    for (let x = 19; x <= 28; x++) {
      const idx = (y * 64 + x) * 4
      if (master[idx + 3] > 50) {
        legFB[idx] = Math.round(master[idx] * 0.85)
        legFB[idx + 1] = Math.round(master[idx + 1] * 0.85)
        legFB[idx + 2] = Math.round(master[idx + 2] * 0.85)
        legFB[idx + 3] = master[idx + 3]
      }
    }
  }

  // Mandarin buffer
  const mandarinPath = path.join(LAYERS_DIR, 'capilampara', 'mandarin.png')
  const { data: mandarin } = await sharp(mandarinPath).raw().toBuffer({ resolveWithObject: true })

  const capiLayerDir = path.join(LAYERS_DIR, 'capilampara')
  await sharp(torso, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(capiLayerDir, 'torso.png'))
  await sharp(legNF, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(capiLayerDir, 'leg_front_near.png'))
  await sharp(legFF, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(capiLayerDir, 'leg_front_far.png'))
  await sharp(legNB, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(capiLayerDir, 'leg_hind_near.png'))
  await sharp(legFB, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(capiLayerDir, 'leg_hind_far.png'))

  console.log('Capilampara layers saved with continuous filled underbody.')

  return { torso, legNF, legFF, legNB, legFB, mandarin }
}

// Assemble Animation with Strict Baseline and Zero Foot Sliding
async function assembleWalkCycles() {
  const pibbleRig = await buildPibbleRig()
  const capiRig = await buildCapilamparaRig()

  // Frame definitions: 6 phases
  // Contact A, Recoil A, Passing A, Contact B, Recoil B, Passing B
  const walkGait = [
    // Frame 0: Contact A
    { bodyDy: 0, headDy: 0,
      nf: { dx: 2, dy: 0 }, ff: { dx: -2, dy: 0 },
      nb: { dx: -2, dy: 0 }, fb: { dx: 2, dy: 0 },
      supportPaws: ['nf', 'fb'] },
    // Frame 1: Recoil A (Body drops 1px, weight absorption)
    { bodyDy: 1, headDy: 1,
      nf: { dx: 1, dy: 0 }, ff: { dx: -1, dy: -2 }, // ff lifted 2px
      nb: { dx: -1, dy: -2 }, fb: { dx: 1, dy: 0 }, // nb lifted 2px
      supportPaws: ['nf', 'fb'] },
    // Frame 2: Passing A (Body neutral)
    { bodyDy: 0, headDy: 0,
      nf: { dx: 0, dy: 0 }, ff: { dx: 1, dy: -2 },
      nb: { dx: 1, dy: -2 }, fb: { dx: 0, dy: 0 },
      supportPaws: ['nf', 'fb'] },
    // Frame 3: Contact B (Opposite diagonal)
    { bodyDy: 0, headDy: 0,
      nf: { dx: -2, dy: 0 }, ff: { dx: 2, dy: 0 },
      nb: { dx: 2, dy: 0 }, fb: { dx: -2, dy: 0 },
      supportPaws: ['ff', 'nb'] },
    // Frame 4: Recoil B (Body drops 1px)
    { bodyDy: 1, headDy: 1,
      nf: { dx: -1, dy: -2 }, ff: { dx: 1, dy: 0 }, // nf lifted 2px
      nb: { dx: 1, dy: 0 }, fb: { dx: -1, dy: -2 }, // fb lifted 2px
      supportPaws: ['ff', 'nb'] },
    // Frame 5: Passing B
    { bodyDy: 0, headDy: 0,
      nf: { dx: 1, dy: -2 }, ff: { dx: 0, dy: 0 },
      nb: { dx: 0, dy: 0 }, fb: { dx: 1, dy: -2 },
      supportPaws: ['ff', 'nb'] }
  ]

  for (const [charName, rig] of [['pibble', pibbleRig], ['capilampara', capiRig]]) {
    const isPibble = charName === 'pibble'
    const animDir = path.join(ANIM_DIR, `${charName}_walk`)
    const puppetDir = path.join(animDir, 'puppet_frames')
    const correctedDir = path.join(animDir, 'pixel_corrected_frames')

    const pFrames = []
    const cFrames = []

    for (let f = 0; f < 6; f++) {
      const g = walkGait[f]

      // 1. Puppet assembly (Cutout)
      const pBuf = createEmptyBuffer(64, 64)

      // Layer 1: Far legs (behind torso)
      blit(pBuf, 64, 64, rig.legFF, 64, 64, g.ff.dx, g.ff.dy + (g.ff.dy === 0 ? g.bodyDy : 0))
      blit(pBuf, 64, 64, rig.legFB, 64, 64, g.fb.dx, g.fb.dy + (g.fb.dy === 0 ? g.bodyDy : 0))

      // Layer 2: Torso (with continuous underbody!)
      blit(pBuf, 64, 64, rig.torso, 64, 64, 0, g.bodyDy)

      // Mandarin for Capilampara
      if (!isPibble && rig.mandarin) {
        blit(pBuf, 64, 64, rig.mandarin, 64, 64, 0, g.headDy)
      }

      // Layer 3: Near legs (in front of torso)
      blit(pBuf, 64, 64, rig.legNF, 64, 64, g.nf.dx, g.nf.dy + (g.nf.dy === 0 ? g.bodyDy : 0))
      blit(pBuf, 64, 64, rig.legNB, 64, 64, g.nb.dx, g.nb.dy + (g.nb.dy === 0 ? g.bodyDy : 0))

      // Hard clamp baseline at y=60
      for (let x = 0; x < 64; x++) {
        for (let y = 61; y < 64; y++) {
          pBuf[(y * 64 + x) * 4 + 3] = 0
        }
      }

      await sharp(pBuf, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(puppetDir, `frame_0${f}.png`))
      pFrames.push(pBuf)

      // 2. Pixel-Corrected Assembly (Seamless pixel-art refinement)
      const cBuf = Buffer.from(pBuf)

      // A. Heal shoulder/hip joint transitions:
      // Remove double outlines inside the body where limb meets flank
      for (let y = 38; y <= 48; y++) {
        for (let x = 8; x <= 55; x++) {
          const idx = (y * 64 + x) * 4
          // If a dark outline pixel is completely surrounded by solid body/leg pixels, dissolve to body color
          if (cBuf[idx + 3] === 255 && cBuf[idx] < 60 && cBuf[idx + 1] < 50) {
            const upA = cBuf[((y - 1) * 64 + x) * 4 + 3]
            const dnA = cBuf[((y + 1) * 64 + x) * 4 + 3]
            const ltA = cBuf[(y * 64 + (x - 1)) * 4 + 3]
            const rtA = cBuf[(y * 64 + (x + 1)) * 4 + 3]
            if (upA > 0 && dnA > 0 && ltA > 0 && rtA > 0) {
              // interior seam: convert to body fur color
              cBuf[idx] = isPibble ? 234 : 166
              cBuf[idx + 1] = isPibble ? 215 : 108
              cBuf[idx + 2] = isPibble ? 187 : 66
            }
          }
        }
      }

      // B. Ensure continuous crisp 1px outline on exterior silhouette
      for (let y = 1; y < 61; y++) {
        for (let x = 1; x < 63; x++) {
          const idx = (y * 64 + x) * 4
          if (cBuf[idx + 3] > 0) {
            const hasEmptyNeighbor = (
              cBuf[(y * 64 + (x - 1)) * 4 + 3] === 0 ||
              cBuf[(y * 64 + (x + 1)) * 4 + 3] === 0 ||
              cBuf[((y - 1) * 64 + x) * 4 + 3] === 0 ||
              cBuf[((y + 1) * 64 + x) * 4 + 3] === 0
            )
            if (hasEmptyNeighbor) {
              const r = cBuf[idx], g = cBuf[idx + 1], b = cBuf[idx + 2]
              // If outer edge pixel is light, paint 1px outline
              if (r > 70 || g > 60 || b > 50) {
                cBuf[idx] = isPibble ? 24 : 27
                cBuf[idx + 1] = isPibble ? 18 : 20
                cBuf[idx + 2] = isPibble ? 15 : 15
                cBuf[idx + 3] = 255
              }
            }
          }
        }
      }

      // C. Solid contact planted at baseline row y=60
      // For each supporting paw in this frame, ensure its bottom contact line is solidly planted at y=60
      const pawRanges = isPibble ? {
        nf: { x1: 44, x2: 48 },
        ff: { x1: 51, x2: 55 },
        nb: { x1: 12, x2: 16 },
        fb: { x1: 22, x2: 26 }
      } : {
        nf: { x1: 38, x2: 42 },
        ff: { x1: 46, x2: 50 },
        nb: { x1: 11, x2: 15 },
        fb: { x1: 21, x2: 25 }
      }

      for (const pKey of g.supportPaws) {
        const rng = pawRanges[pKey]
        const dx = g[pKey].dx
        for (let x = rng.x1 + dx; x <= rng.x2 + dx; x++) {
          if (x >= 0 && x < 64) {
            const idx = (60 * 64 + x) * 4
            cBuf[idx] = isPibble ? 24 : 27
            cBuf[idx + 1] = isPibble ? 18 : 20
            cBuf[idx + 2] = isPibble ? 15 : 15
            cBuf[idx + 3] = 255
          }
        }
      }

      // Hard clear rows below 60
      for (let x = 0; x < 64; x++) {
        for (let y = 61; y < 64; y++) {
          cBuf[(y * 64 + x) * 4 + 3] = 0
        }
      }

      await sharp(cBuf, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(correctedDir, `frame_0${f}.png`))
      await sharp(cBuf, { raw: { width: 64, height: 64, channels: 4 } }).png().toFile(path.join(animDir, `frame_0${f}.png`))
      cFrames.push(cBuf)
    }

    // Build strips
    const stripW = 64 * 6
    const stripH = 64
    const puppetStrip = createEmptyBuffer(stripW, stripH)
    const correctedStrip = createEmptyBuffer(stripW, stripH)

    for (let f = 0; f < 6; f++) {
      blit(puppetStrip, stripW, stripH, pFrames[f], 64, 64, f * 64, 0)
      blit(correctedStrip, stripW, stripH, cFrames[f], 64, 64, f * 64, 0)
    }

    await sharp(puppetStrip, { raw: { width: stripW, height: stripH, channels: 4 } })
      .png().toFile(path.join(animDir, `${charName}_walk_puppet_strip.png`))
    await sharp(correctedStrip, { raw: { width: stripW, height: stripH, channels: 4 } })
      .png().toFile(path.join(animDir, `${charName}_walk_strip.png`))

    console.log(`[${charName}] Walk cycle rebuilt with underbody fill and pixel-correction.`)
  }

  // Re-generate contact sheets
  await buildContactSheet('pibble', path.join(ANIM_DIR, 'pibble_walk', 'pixel_corrected_frames'), path.join(QA_DIR, 'contact_sheet_pibble.png'))
  await buildContactSheet('capilampara', path.join(ANIM_DIR, 'capilampara_walk', 'pixel_corrected_frames'), path.join(QA_DIR, 'contact_sheet_capilampara.png'))
  
  // Also build puppet contact sheets for direct side-by-side comparison
  await buildContactSheet('pibble_puppet', path.join(ANIM_DIR, 'pibble_walk', 'puppet_frames'), path.join(QA_DIR, 'contact_sheet_pibble_puppet.png'))
  await buildContactSheet('capilampara_puppet', path.join(ANIM_DIR, 'capilampara_walk', 'puppet_frames'), path.join(QA_DIR, 'contact_sheet_capilampara_puppet.png'))
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

await assembleWalkCycles()
console.log('Rigged walk cycle execution complete!')
