import { writeFileSync } from 'node:fs'
import { openPage } from './lib/cdp.mjs'

const page = await openPage({ url: 'http://127.0.0.1:5199/dashboard', width: 390, height: 844, mobile: true })
await page.evaluate(`localStorage.clear()`)
await page.send('Page.reload')
await page.sleep(2200)

const result = {}
result.layout = await page.evaluate(`(() => {
  const dock = document.querySelector('[data-testid="mascot-dock"]')?.getBoundingClientRect();
  const rail = document.querySelector('.mascot-dock__rail');
  const railRect = rail?.getBoundingClientRect();
  const nav = document.querySelector('nav[class*="lg:hidden"]')?.getBoundingClientRect();
  const pibble = document.querySelector('[data-testid="stage-pet-pibble"]')?.getBoundingClientRect();
  const capi = document.querySelector('[data-testid="stage-pet-capilampara"]')?.getBoundingClientRect();
  const inline = document.querySelector('[data-testid="mascots-inline"]')?.getBoundingClientRect();
  const fab = [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === 'Acciones rápidas')?.getBoundingClientRect();
  return {
    viewport: { w: innerWidth, h: innerHeight },
    scrollWidth: document.documentElement.scrollWidth,
    dock: dock ? { x: dock.x, y: dock.y, w: dock.width, h: dock.height, bottom: dock.bottom } : null,
    nav: nav ? { x: nav.x, y: nav.y, w: nav.width, h: nav.height } : null,
    rail: railRect ? { x: railRect.x, y: railRect.y, w: railRect.width, h: railRect.height, scrollWidth: rail.scrollWidth, clientWidth: rail.clientWidth } : null,
    pibble: pibble ? { x: pibble.x, y: pibble.y, w: pibble.width, h: pibble.height } : null,
    capi: capi ? { x: capi.x, y: capi.y, w: capi.width, h: capi.height } : null,
    inline: inline ? { x: inline.x, y: inline.y, w: inline.width, h: inline.height } : null,
    fab: fab ? { x: fab.x, y: fab.y, w: fab.width, h: fab.height } : null,
    dockAboveNav: dock && nav ? Math.abs(dock.bottom - nav.top) < 2 : null,
    petsAboveRail: railRect && pibble && capi ? (pibble.y + pibble.height <= railRect.y + 1 && capi.y + capi.height <= railRect.y + 1) : null,
    inlineWithinViewport: inline ? inline.x >= 0 && inline.x + inline.width <= innerWidth : null,
  };
})()`)

await page.screenshot('audit-mobile-01-dashboard.png')

// Acariciar y comprobar bocadillo sin desbordar.
await page.click('[data-testid="pibble-inline-pet"]')
await page.sleep(300)
await page.click('[data-testid="pibble-inline-pet"]')
await page.sleep(300)
result.bubble = await page.evaluate(`(() => {
  const b = document.querySelector('[data-testid="mascot-bubble"]');
  const r = b?.getBoundingClientRect();
  return { text: b?.textContent.trim(), rect: r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null, insideViewport: r ? r.x >= 0 && r.x + r.width <= innerWidth : null };
})()`)
await page.screenshot('audit-mobile-02-bocadillo.png')

// Lámpara del hábitat en móvil: área táctil y capa de luz.
const lampRect = await page.rect('[data-testid="stage-pet-capilampara"] [data-testid="capilampara-lamp"]')
result.lampHit = await page.evaluate(`(() => {
  const r = document.querySelector('[data-testid="stage-pet-capilampara"] [data-testid="capilampara-lamp"]')?.getBoundingClientRect();
  const el = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2);
  return { w: r.width, h: r.height, top: el?.closest('[data-testid="capilampara-lamp"]') ? 'lamp' : el?.tagName };
})()`)
await page.clickAt(lampRect.centerX, lampRect.centerY)
await page.sleep(450)
result.lampAfter = await page.evaluate(`({ on: document.querySelector('[data-testid="lamp-light"]')?.dataset.on, pressed: document.querySelector('[data-testid="stage-pet-capilampara"] [data-testid="capilampara-lamp"]')?.getAttribute('aria-pressed') })`)
await page.screenshot('audit-mobile-03-lampara.png')

// Contenido inferior: al hacer scroll completo, la última tarjeta no queda bajo el hábitat.
await page.evaluate(`window.scrollTo(0, document.documentElement.scrollHeight)`)
await page.sleep(500)
result.bottomContent = await page.evaluate(`(() => {
  const cards = [...document.querySelectorAll('main .glass-card, main section, main section > div')].filter(el => el.getBoundingClientRect().height > 30);
  const last = cards[cards.length - 1]?.getBoundingClientRect();
  const dock = document.querySelector('[data-testid="mascot-dock"]')?.getBoundingClientRect();
  return { last: last ? { y: last.y, bottom: last.bottom } : null, dockTop: dock?.top, contentAboveDock: last && dock ? last.bottom <= dock.top + 1 : null };
})()`)

result.emojis = await page.evaluate(`(() => {
  const emojis = (document.body.innerText.match(/[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}]/gu) || []);
  return { emojis, count: emojis.length };
})()`)
result.console = page.consoleLines.filter((line) => line.type === 'error' || line.type === 'exception')

await page.close()
writeFileSync('audit-mobile-report.json', JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
