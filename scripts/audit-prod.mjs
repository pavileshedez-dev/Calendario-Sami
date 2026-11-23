import { writeFileSync } from 'node:fs'
import { openPage } from './lib/cdp.mjs'

const page = await openPage({ url: 'http://127.0.0.1:3001/', width: 1440, height: 1000 })
await page.sleep(2000)
const result = await page.evaluate(`(() => ({
  title: document.title,
  dock: Boolean(document.querySelector('[data-testid="mascot-dock"]')),
  pets: document.querySelectorAll('.stage-pet').length,
  inline: Boolean(document.querySelector('[data-testid="mascots-inline"]')),
  sprites: [...document.querySelectorAll('.pixel-sprite')].slice(0, 3).map(el => ({ state: el.dataset.state, frame: el.dataset.frame })),
  lamp: document.querySelector('[data-testid="stage-pet-capilampara"] [data-testid="capilampara-lamp"]')?.getAttribute('aria-pressed'),
  devApiPresent: Boolean(window.__SAMI_STAGE__ || window.__SAMI_MASCOTS__),
}))()`)
result.console = page.consoleLines.filter((line) => line.type === 'error' || line.type === 'exception')
await page.screenshot('audit-produccion.png')
await page.close()
writeFileSync('audit-prod-report.json', JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
