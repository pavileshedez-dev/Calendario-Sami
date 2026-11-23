import { writeFileSync } from 'node:fs'
import { openPage } from './lib/cdp.mjs'

const fakeDate = `(() => {
  const fixed = new Date('2026-11-14T01:00:00Z').getTime(); // 02:00 en Madrid
  const NativeDate = Date;
  class FakeDate extends NativeDate {
    constructor(...args) {
      if (args.length === 0) super(fixed);
      else super(...args);
    }
    static now() { return fixed; }
  }
  window.Date = FakeDate;
})();`

const page = await openPage({
  url: 'http://127.0.0.1:5199/',
  width: 1440,
  height: 1000,
  initScript: fakeDate,
})
await page.evaluate(`localStorage.clear()`)
await page.send('Page.reload')
await page.sleep(2200)

const result = {}
result.initial = await page.evaluate(`(() => ({
  hour: new Date().getHours(),
  lamp: document.querySelector('[data-testid="stage-pet-capilampara"] [data-testid="capilampara-lamp"]')?.getAttribute('aria-pressed'),
  light: document.querySelector('[data-testid="lamp-light"]')?.dataset.on,
  status: document.querySelector('[data-testid="capilampara-inline"]')?.textContent.trim(),
}))()`)
await page.screenshot('audit-lamp-01-noche.png')

// Apagado manual: debe permanecer apagado dentro del tramo nocturno.
const lampRect = await page.rect('[data-testid="stage-pet-capilampara"] [data-testid="capilampara-lamp"]')
await page.clickAt(lampRect.centerX, lampRect.centerY)
await page.sleep(500)
result.afterManualOff = await page.evaluate(`({
  lamp: document.querySelector('[data-testid="stage-pet-capilampara"] [data-testid="capilampara-lamp"]')?.getAttribute('aria-pressed'),
  light: document.querySelector('[data-testid="lamp-light"]')?.dataset.on,
  bubble: document.querySelector('[data-testid="mascot-bubble"]')?.textContent.trim(),
})`)
await page.screenshot('audit-lamp-02-apagada.png')

await page.sleep(31000)
result.afterInterval = await page.evaluate(`({
  lamp: document.querySelector('[data-testid="stage-pet-capilampara"] [data-testid="capilampara-lamp"]')?.getAttribute('aria-pressed'),
  light: document.querySelector('[data-testid="lamp-light"]')?.dataset.on,
})`)
result.console = page.consoleLines.filter((line) => line.type === 'error' || line.type === 'exception')

await page.close()
writeFileSync('audit-lamp-report.json', JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
