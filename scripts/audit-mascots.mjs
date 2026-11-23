import { writeFileSync } from 'node:fs'
import { openPage } from './lib/cdp.mjs'

const URL = 'http://127.0.0.1:5199/'
const page = await openPage({ url: URL, width: 1440, height: 1000 })
await page.sleep(2200)
const report = {}

const readState = () => page.evaluate(`(() => {
  const sprite = document.querySelector('[data-testid="stage-pet-pibble"] .pixel-sprite');
  const capi = document.querySelector('[data-testid="stage-pet-capilampara"]');
  const bubble = document.querySelector('[data-testid="mascot-bubble"]');
  const name = document.querySelector('[data-testid="pibble-inline-name"]');
  const stageName = document.querySelector('[data-testid="pibble-name"]');
  return {
    pibbleAction: document.querySelector('[data-testid="stage-pet-pibble"]')?.dataset.action,
    pibbleSpriteState: sprite?.dataset.state,
    pibbleSpriteFrame: sprite?.dataset.frame,
    capiAction: capi?.dataset.action,
    capiLeft: capi?.style.left,
    bubble: bubble?.textContent.trim(),
    inlineName: name?.textContent.trim(),
    stageName: stageName?.textContent.trim(),
    pibblino: document.querySelector('[data-testid="stage-pet-pibble"]')?.dataset.pibblino,
    lampOn: document.querySelector('[data-testid="lamp-light"]')?.dataset.on,
    lampPressed: document.querySelector('[data-testid="capilampara-lamp"]')?.getAttribute('aria-pressed'),
    outfitPressed: document.querySelector('[data-testid="capilampara-outfit"]')?.getAttribute('aria-pressed'),
    capiBg: document.querySelector('[data-testid="stage-pet-capilampara"] .pixel-sprite')?.style.backgroundImage,
    dockRect: (() => { const r = document.querySelector('[data-testid="mascot-dock"]')?.getBoundingClientRect(); return r ? {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom} : null })(),
    railRect: (() => { const r = document.querySelector('.mascot-dock__rail')?.getBoundingClientRect(); return r ? {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,scrollWidth:document.querySelector('.mascot-dock__rail').scrollWidth,clientWidth:document.querySelector('.mascot-dock__rail').clientWidth} : null })(),
    pibbleRect: (() => { const r = document.querySelector('[data-testid="stage-pet-pibble"]')?.getBoundingClientRect(); return r ? {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom} : null })(),
    capiRect: (() => { const r = document.querySelector('[data-testid="stage-pet-capilampara"]')?.getBoundingClientRect(); return r ? {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom} : null })(),
    fabRect: (() => { const el = [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === 'Acciones rápidas'); const r = el?.getBoundingClientRect(); return r ? {x:r.x,y:r.y,w:r.width,h:r.height} : null })(),
    navRect: (() => { const r = document.querySelector('nav[class*="lg:hidden"]')?.getBoundingClientRect(); return r ? {x:r.x,y:r.y,w:r.width,h:r.height} : null })(),
  };
})()`)

report.initial = await readState()
report.initialFrameA = await page.evaluate(`document.querySelector('[data-testid="stage-pet-pibble"] .pixel-sprite')?.dataset.frame`)

await page.screenshot('audit-01-inicial.png')

// Despertar.
await page.click('[data-testid="pibble-inline-pet"]')
await page.sleep(350)
report.afterWake = await readState()
await page.screenshot('audit-02-despertar.png')

// Cuatro caricias: debe aparecer el mensaje de amor.
for (let i = 0; i < 4; i += 1) {
  await page.click('[data-testid="pibble-inline-pet"]')
  await page.sleep(260)
}
report.afterFourPats = await readState()
report.afterFourEmojis = await page.evaluate(`(() => {
  const text = document.body.innerText;
  const emojis = text.match(/[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}]/gu) || [];
  return { emojis, count: emojis.length };
})()`)
await page.screenshot('audit-03-te-quiero.png')

// Quinta caricia: Pibblino + mensaje exacto.
await page.click('[data-testid="pibble-inline-pet"]')
await page.sleep(500)
report.pibblino = await readState()
await page.screenshot('audit-04-pibblino.png')

// La lámpara se enciende y debe existir la capa de luz.
await page.click('[data-testid="capilampara-lamp"]')
await page.sleep(450)
report.lampOn = await readState()
await page.screenshot('audit-05-lampara.png')

// Atuendo.
await page.click('[data-testid="capilampara-outfit"]')
await page.sleep(350)
report.outfitOff = await readState()
await page.screenshot('audit-06-atuendo.png')

// Movimiento real del sprite de Capilámpara.
const capiA = await page.evaluate(`document.querySelector('[data-testid="stage-pet-capilampara"]')?.style.left`)
await page.sleep(1800)
const capiB = await page.evaluate(`document.querySelector('[data-testid="stage-pet-capilampara"]')?.style.left`)
report.movement = { capiA, capiB, changed: capiA !== capiB }

// Frame de animación: debería cambiar con el tiempo.
const frameA = await page.evaluate(`document.querySelector('[data-testid="stage-pet-capilampara"] .pixel-sprite')?.dataset.frame`)
await page.sleep(500)
const frameB = await page.evaluate(`document.querySelector('[data-testid="stage-pet-capilampara"] .pixel-sprite')?.dataset.frame`)
report.frameAnimation = { frameA, frameB, changed: frameA !== frameB }

// Emojis visibles: solo ❤️ en el mensaje de amor de Pibble.
report.emojis = await page.evaluate(`(() => {
  const text = document.body.innerText;
  const emojis = text.match(/[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}]/gu) || [];
  return { emojis, hasHeart: emojis.includes('❤'), count: emojis.length };
})()`)

await page.close()
writeFileSync('audit-mascots-report.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
