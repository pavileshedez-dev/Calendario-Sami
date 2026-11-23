import { openPage } from './lib/cdp.mjs'

const page = await openPage({ url: 'http://127.0.0.1:5199/ia', width: 1440, height: 1000 })
await page.evaluate(`(() => {
  localStorage.setItem('agenda-chat-pibble', JSON.stringify([
    { id: 'u1', role: 'user', content: 'Hola \\u{1F43E}', timestamp: new Date().toISOString() },
    { id: 'a1', role: 'assistant', content: 'Soy Pibble \\u{1F4A1} y te ayudo \\u2764\\uFE0F', timestamp: new Date().toISOString() },
  ]))
})()`)
await page.send('Page.reload')
await page.sleep(1500)
const result = await page.evaluate(`(() => {
  const content = document.body.innerText;
  const emojis = content.match(/[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}]/gu) || [];
  return { emojis, cleanedAssistant: content.includes('Soy Pibble y te ayudo'), cleanedUser: content.includes('Hola') };
})()`)
await page.evaluate(`localStorage.removeItem('agenda-chat-pibble')`)
result.console = page.consoleLines.filter((line) => line.type === 'error' || line.type === 'exception')
console.log(JSON.stringify(result, null, 2))
await page.close()
