import fs from 'fs'
import path from 'path'

const baseDir = 'C:/Users/pavil/Downloads/Personal/Sami/Agenda Sami/mascots-art/artist-pass-v0.2'
const html = fs.readFileSync(path.join(baseDir, 'comparison.html'), 'utf8')

// Find all src strings
const regex = /src=["']([^"']+)["']/g
let m
const found = []
while ((m = regex.exec(html)) !== null) {
  found.push(m[1])
}

console.log('Total img src in comparison.html:', found.length)
for (const rel of found) {
  const full = path.resolve(baseDir, rel)
  const exists = fs.existsSync(full)
  console.log(exists ? '[EXISTS]' : '[MISSING]', rel, '->', full)
}

// Also check JS dynamic sources
const jsMatches = [...html.matchAll(/\.src\s*=\s*['"]([^'"]+)['"]/g)].map(x => x[1])
console.log('\nDynamic JS .src assignments:', jsMatches.length)
for (const rel of jsMatches) {
  const full = path.resolve(baseDir, rel)
  const exists = fs.existsSync(full)
  console.log(exists ? '[EXISTS]' : '[MISSING]', rel, '->', full)
}
