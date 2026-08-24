// Skriver ut sv/en sida vid sida för angivna toppnamnrymder.
// Användning: node .i18n-review/extract.cjs cv coverLetter applications
const fs = require('fs')
const b = 'client/src/i18n/locales/'
const sv = JSON.parse(fs.readFileSync(b + 'sv.json', 'utf8'))
const en = JSON.parse(fs.readFileSync(b + 'en.json', 'utf8'))
function flat(o, p = '', out = {}) {
  for (const k in o) {
    const v = o[k], key = p ? p + '.' + k : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, key, out)
    else out[key] = v
  }
  return out
}
const fsv = flat(sv), fen = flat(en)
const ns = process.argv.slice(2)
let n = 0
for (const k of Object.keys(fsv)) {
  if (!ns.some(x => k === x || k.startsWith(x + '.'))) continue
  n++
  console.log('### ' + k)
  console.log('SV: ' + JSON.stringify(fsv[k]))
  console.log('EN: ' + JSON.stringify(fen[k]))
}
console.error('nycklar: ' + n)
