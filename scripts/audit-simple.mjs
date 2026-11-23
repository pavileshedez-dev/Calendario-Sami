import { writeFileSync } from 'node:fs'
import { openPage } from './lib/cdp.mjs'

const page = await openPage({ url: 'http://127.0.0.1:5199/', width: 1440, height: 1000 })
await page.evaluate(`localStorage.clear()`)
await page.send('Page.reload')
await page.sleep(1800)

const result = {}
const read = () => page.evaluate(`(() => ({
  pibbleAction: document.querySelector('[data-testid="stage-pet-pibble"]')?.dataset.action,
  pibbleFrame: document.querySelector('[data-testid="stage-pet-pibble"] .pixel-sprite')?.dataset.frame,
  bubble: document.querySelector('[data-testid="mascot-bubble"]')?.textContent.trim(),
  outfit: document.querySelector('[data-testid="capilampara-outfit"]')?.getAttribute('aria-pressed'),
  capiBg: document.querySelector('[data-testid="stage-pet-capilampara"] .pixel-sprite')?.style.backgroundImage,
  barkDisabled: document.querySelector('[data-testid="pibble-bark"]')?.disabled,
}))()`)

result.initial = await read()

// Despertar desde el hábitat y comprobar la animación de despertar.
const pibbleRect = await page.rect('[data-testid="pibble-pet"]')
await page.clickAt(pibbleRect.centerX, pibbleRect.centerY)
await page.sleep(180)
result.wake180ms = await read()
await page.sleep(900)
result.awake = await read()

// Ladrar desde el control del hábitat.
await page.click('[data-testid="pibble-bark"]')
await page.sleep(250)
result.bark = await read()
await page.screenshot('audit-simple-bark.png')

// Atuendo: on -> off -> on con archivos y aria-pressed verificables.
result.outfitStart = await read()
await page.click('[data-testid="capilampara-outfit"]')
await page.sleep(300)
result.outfitOff = await read()
await page.click('[data-testid="capilampara-outfit"]')
await page.sleep(300)
result.outfitOn = await read()
await page.screenshot('audit-simple-outfit.png')

// Avatares de Mi Semana.
await page.click('a[href="/semana"]')
await page.sleep(1600)
result.miSemana = await page.evaluate(`({
  avatars: [...document.querySelectorAll('[data-testid^="mascot-avatar-"]')].map(el => ({ testid: el.dataset.testid, state: el.dataset.state })),
  errors: [...document.querySelectorAll('.text-red-700')].map(el => el.textContent.trim()).slice(0, 3),
})`)
await page.screenshot('audit-simple-semana.png')

// Avatares de Asesor IA y animación por frames.
await page.click('a[href="/ia"]')
await page.sleep(1200)
const frameA = await page.evaluate(`document.querySelector('[data-testid="mascot-avatar-pibble"] .pixel-sprite')?.dataset.frame`)
await page.sleep(500)
const frameB = await page.evaluate(`document.querySelector('[data-testid="mascot-avatar-pibble"] .pixel-sprite')?.dataset.frame`)
result.asesor = await page.evaluate(`({
  avatars: document.querySelectorAll('[data-testid^="mascot-avatar-"]').length,
  nestedButtons: document.querySelectorAll('button button').length,
})`)
result.asesor.frameAnimation = { frameA, frameB, changed: frameA !== frameB }
await page.screenshot('audit-simple-asesor.png')

result.emojis = await page.evaluate(`(() => {
  const emojis = (document.body.innerText.match(/[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}]/gu) || []);
  return { emojis, count: emojis.length };
})()`)
result.console = page.consoleLines.filter((line) => line.type === 'error' || line.type === 'exception')

await page.close()
writeFileSync('audit-simple-report.json', JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
