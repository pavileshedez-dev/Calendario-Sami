import { openPage } from './lib/cdp.mjs'

const page = await openPage({ url: 'http://127.0.0.1:5199/', width: 1440, height: 1000 })
await page.sleep(2500)
await page.screenshot('audit-baseline-desktop.png')
console.log('title:', await page.evaluate('document.title'))
console.log('errors:', page.consoleLines.filter((l) => l.type === 'error' || l.type === 'exception'))
await page.close()
