import { writeFileSync } from 'node:fs'
import { openPage } from './lib/cdp.mjs'

const page = await openPage({ url: 'http://127.0.0.1:5199/', width: 1440, height: 1000 })
await page.evaluate(`localStorage.clear()`)
await page.send('Page.reload')
await page.sleep(1800)

const result = {}
const read = () => page.evaluate(`(() => ({
  pibble: document.querySelector('[data-testid="stage-pet-pibble"]')?.dataset.action,
  pibbleFrame: document.querySelector('[data-testid="stage-pet-pibble"] .pixel-sprite')?.dataset.frame,
  capi: document.querySelector('[data-testid="stage-pet-capilampara"]')?.dataset.action,
  capiFrame: document.querySelector('[data-testid="stage-pet-capilampara"] .pixel-sprite')?.dataset.frame,
  capiBg: document.querySelector('[data-testid="stage-pet-capilampara"] .pixel-sprite')?.style.backgroundImage,
  outfit: document.querySelector('[data-testid="capilampara-outfit"]')?.getAttribute('aria-pressed'),
  lamp: document.querySelector('[data-testid="stage-pet-capilampara"] [data-testid="capilampara-lamp"]')?.getAttribute('aria-pressed'),
  light: document.querySelector('[data-testid="lamp-light"]')?.dataset.on,
  lampRect: (() => { const r = document.querySelector('[data-testid="stage-pet-capilampara"] [data-testid="capilampara-lamp"]')?.getBoundingClientRect(); return r ? {x:r.x,y:r.y,w:r.width,h:r.height} : null })(),
}))()`)

result.initial = await read()

// Capi sin atuendo: naranja + cuerpo natural
await page.click('[data-testid="capilampara-outfit"]')
await page.sleep(450)
result.outfitOff = await read()
await page.screenshot('art-capi-normal.png')

// Capi universitaria: cap + mochila
await page.click('[data-testid="capilampara-outfit"]')
await page.sleep(450)
result.outfitOn = await read()
await page.screenshot('art-capi-ucm.png')

// Capi leyendo: debe usar la hoja con gafas
await page.evaluate(`window.__SAMI_STAGE__?.force('capilampara','read',2600)`)
await page.sleep(400)
result.capiRead = await read()
await page.screenshot('art-capi-read.png')

// Despertar a Pibble antes de forzar sus estados
const pibbleRect = await page.rect('[data-testid="pibble-pet"]')
await page.clickAt(pibbleRect.centerX, pibbleRect.centerY)
await page.sleep(1500)

// Nuevos estados de Pibble
for (const action of ['run', 'play', 'growl', 'playful_growl']) {
  await page.evaluate(`window.__SAMI_STAGE__?.force('pibble', ${JSON.stringify(action)}, 2600)`)
  await page.sleep(350)
  result[`pibble_${action}`] = await read()
  await page.screenshot(`art-pibble-${action}.png`)
}

// Despertar de Capi desde dormido
await page.evaluate(`window.__SAMI_STAGE__?.force('capilampara','sleep',900)`)
await page.sleep(1200)
result.capiAfterSleep = await read()
await page.sleep(700)
result.capiWake = await read()

// Lámpara directa y luz
const rect = await page.rect('[data-testid="stage-pet-capilampara"] [data-testid="capilampara-lamp"]')
await page.clickAt(rect.centerX, rect.centerY)
await page.sleep(500)
result.lamp = await read()
await page.screenshot('art-lamp-on.png')

result.console = page.consoleLines.filter((line) => line.type === 'error' || line.type === 'exception')
await page.close()
writeFileSync('art-report.json', JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
