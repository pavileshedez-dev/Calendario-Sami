import { writeFileSync } from 'node:fs'
import { openPage } from './lib/cdp.mjs'

const initScript = `(() => {
  window.__NOW__ = new Date('2026-11-14T01:00:00Z').getTime(); // 02:00 Madrid
  const NativeDate = Date;
  class FakeDate extends NativeDate {
    constructor(...args) { if (args.length === 0) super(window.__NOW__); else super(...args); }
    static now() { return window.__NOW__; }
  }
  window.Date = FakeDate;
  const nativeSetInterval = window.setInterval;
  window.setInterval = (fn, ms, ...rest) => nativeSetInterval(fn, Math.min(ms, 100), ...rest);
})();`

const page = await openPage({ url: 'http://127.0.0.1:5199/', width: 1440, height: 1000, initScript })
await page.evaluate(`localStorage.clear()`)
await page.send('Page.reload')
await page.sleep(1600)

const read = () => page.evaluate(`({
  lamp: document.querySelector('[data-testid="stage-pet-capilampara"] [data-testid="capilampara-lamp"]')?.getAttribute('aria-pressed'),
  light: document.querySelector('[data-testid="lamp-light"]')?.dataset.on,
  status: document.querySelector('[data-testid="capilampara-inline-status"]')?.textContent.trim(),
})`)

const result = {}
result.night = await read()

// 06:30 en Madrid: debe apagarse automáticamente.
await page.evaluate(`window.__NOW__ = new Date('2026-11-14T05:30:00Z').getTime()`)
await page.sleep(500)
result.morning = await read()

// 00:15 del día siguiente en Madrid: debe volver a encenderse.
await page.evaluate(`window.__NOW__ = new Date('2026-11-14T23:15:00Z').getTime()`)
await page.sleep(500)
result.nextNight = await read()
result.console = page.consoleLines.filter((line) => line.type === 'error' || line.type === 'exception')

await page.close()
writeFileSync('audit-lamp-transition-report.json', JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
