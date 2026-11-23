import { writeFileSync } from 'node:fs'
import { openPage } from './lib/cdp.mjs'

const page = await openPage({ url: 'http://127.0.0.1:5199/', width: 1440, height: 1000 })
await page.evaluate(`localStorage.clear()`)
await page.send('Page.reload')
await page.sleep(2200)

const result = {}
const state = () => page.evaluate(`(() => {
  const p = document.querySelector('[data-testid="stage-pet-pibble"]');
  const c = document.querySelector('[data-testid="stage-pet-capilampara"]');
  const ps = p?.querySelector('.pixel-sprite');
  const cs = c?.querySelector('.pixel-sprite');
  return {
    pibble: p?.dataset.action,
    pibbleFrame: ps?.dataset.frame,
    capi: c?.dataset.action,
    capiFrame: cs?.dataset.frame,
    pibbleLeft: p?.style.left,
    capiLeft: c?.style.left,
    pibbleName: document.querySelector('[data-testid="pibble-name"]')?.textContent.trim(),
    bubble: document.querySelector('[data-testid="mascot-bubble"]')?.textContent.trim(),
    lamp: document.querySelector('[data-testid="stage-pet-capilampara"] [data-testid="capilampara-lamp"]')?.getAttribute('aria-pressed'),
    light: document.querySelector('[data-testid="lamp-light"]')?.dataset.on,
    pibbleHit: (() => {
      const r = document.querySelector('[data-testid="pibble-pet"]')?.getBoundingClientRect();
      if (!r) return null;
      const el = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2);
      return el ? (el.closest('[data-testid="pibble-pet"]') ? 'pibble' : el.tagName) : null;
    })(),
    lampHit: (() => {
      const r = document.querySelector('[data-testid="stage-pet-capilampara"] [data-testid="capilampara-lamp"]')?.getBoundingClientRect();
      if (!r) return null;
      const el = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2);
      return el ? (el.closest('[data-testid="capilampara-lamp"]') ? 'lamp' : el.tagName) : null;
    })(),
  };
})()`)

result.initial = await state()

// Clic real sobre Pibble del hábitat (no sobre la tarjeta inline).
const pibbleRect = await page.rect('[data-testid="pibble-pet"]')
await page.clickAt(pibbleRect.centerX, pibbleRect.centerY)
await page.sleep(950)
result.afterStageWake = await state()
await page.screenshot('audit-stage-01-despierto.png')

// Cinco caricias sobre el actor del hábitat.
for (let i = 0; i < 5; i += 1) {
  await page.clickAt(pibbleRect.centerX, pibbleRect.centerY)
  await page.sleep(240)
}
await page.sleep(400)
result.pibblino = await state()
await page.screenshot('audit-stage-02-pibblino.png')

// Espera real de la vuelta automática (30 s).
await page.sleep(31000)
result.afterRevert = await state()
await page.screenshot('audit-stage-03-revertido.png')

// Fuerza estados para verificar que existen frames distintos y posturas reales.
const forced = {}
for (const action of ['walk', 'run', 'sit', 'lie', 'play', 'scratch', 'bark', 'growl', 'playful_growl', 'happy']) {
  await page.evaluate(`window.__SAMI_STAGE__?.force('pibble', ${JSON.stringify(action)}, 2600)`)
  await page.sleep(420)
  const current = await state()
  forced[`pibble:${action}`] = {
    action: current.pibble,
    frame: current.pibbleFrame,
  }
  if (action === 'scratch' || action === 'bark') {
    await page.screenshot(`audit-stage-pibble-${action}.png`)
  }
}
for (const action of ['walk', 'sit', 'lie', 'read', 'study', 'sleep', 'wake', 'pet', 'greet', 'dress']) {
  await page.evaluate(`window.__SAMI_STAGE__?.force('capilampara', ${JSON.stringify(action)}, 2600)`)
  await page.sleep(420)
  const current = await state()
  forced[`capilampara:${action}`] = {
    action: current.capi,
    frame: current.capiFrame,
  }
  if (action === 'read' || action === 'study' || action === 'sleep') {
    await page.screenshot(`audit-stage-capi-${action}.png`)
  }
}
result.forcedStates = forced

// Clic real en la lámpara del hábitat.
const lampRect = await page.rect('[data-testid="stage-pet-capilampara"] [data-testid="capilampara-lamp"]')
result.lampHitBefore = await state()
await page.clickAt(lampRect.centerX, lampRect.centerY)
await page.sleep(500)
result.lampAfter = await state()
await page.screenshot('audit-stage-04-lampara.png')

// Saludo entre mascotas forzado y observable.
await page.evaluate(`window.__SAMI_STAGE__?.force('pibble', 'idle', 1000)`)
await page.evaluate(`window.__SAMI_STAGE__?.force('capilampara', 'idle', 1000)`)
await page.sleep(1100)
result.greetStarted = await page.evaluate(`window.__SAMI_STAGE__?.greet()`)
await page.sleep(6200)
result.greetHold = await state()
await page.screenshot('audit-stage-05-saludo.png')

// Persistencia del hábitat al cambiar de pantalla.
const beforeRoute = await state()
await page.click('a[href="/semana"]')
await page.sleep(1800)
const afterRoute = await state()
result.routePersistence = {
  before: { pibble: beforeRoute.pibbleLeft, capi: beforeRoute.capiLeft },
  after: { pibble: afterRoute.pibbleLeft, capi: afterRoute.capiLeft },
  dockStillMounted: await page.evaluate(`Boolean(document.querySelector('[data-testid="mascot-dock"]'))`),
}
await page.screenshot('audit-stage-06-mi-semana.png')

// Asesor IA: avatares animados y ausencia de botones anidados.
await page.click('a[href="/ia"]')
await page.sleep(1200)
result.asesorIA = await page.evaluate(`(() => {
  const tabs = [...document.querySelectorAll('button')].filter(b => b.textContent.includes('Pibblino') || b.textContent.includes('Pibble') || b.textContent.includes('Capilámpara'));
  return {
    avatars: document.querySelectorAll('[data-testid^="mascot-avatar-"]').length,
    nestedButtons: document.querySelectorAll('button button').length,
    tabTexts: tabs.slice(0, 4).map(b => b.textContent.trim().slice(0, 40)),
  };
})()`)
await page.screenshot('audit-stage-07-asesor.png')

// Emojis visibles en toda la app (solo debe quedar el corazón del mensaje de amor).
result.emojis = await page.evaluate(`(() => {
  const emojis = (document.body.innerText.match(/[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}]/gu) || []);
  return { emojis, count: emojis.length };
})()`)

result.console = page.consoleLines.filter((line) => line.type === 'error' || line.type === 'exception')
await page.close()
writeFileSync('audit-stage-report.json', JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
