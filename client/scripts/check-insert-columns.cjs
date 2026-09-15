/**
 * Letar kolumnnycklar i .insert()/.update()/.upsert() som inte finns i
 * prod-schemat.
 *
 * Luckan är dokumenterad i check-schema-drift.cjs egen huvudkommentar:
 * "Kolumner i .insert()/.update()-objekt kontrolleras inte (kräver riktig
 * AST-parsning)". Förra gången någon kontrollerade just det för hand gav det
 * fyra skarpa buggar på en eftermiddag — bland dem att AI-teamets
 * kalenderuppgift skickade fem obefintliga kolumner och utelämnade NOT NULL-
 * fältet `date`, så insertet strukturellt aldrig kunde lyckas. Felet sväljs av
 * `if (!error)`: deltagaren klickar och inget händer.
 *
 * Konservativ med flit — hellre tyst om det osäkra än varg:
 *   · bara objektliteraler direkt i anropet
 *   · nycklar som är identifierare eller strängliteraler på toppnivå
 *   · hoppar över objekt med spread (...) — då är formen okänd
 *   · hoppar över dynamiska tabellnamn och testfiler
 */
const fs = require('node:fs')
const path = require('node:path')

const ROT = process.argv[2] || path.join(__dirname, '..')
const snapshot = JSON.parse(fs.readFileSync(path.join(ROT, '../supabase/schema-snapshot.json'), 'utf8'))
const TABELLER = snapshot.tables

const filer = []
const gaIgenom = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (/node_modules|dist|\.git|archive|__tests__/.test(p)) continue
      gaIgenom(p)
    } else if (/\.(ts|tsx|js|mjs)$/.test(e.name) && !/\.(test|spec)\./.test(e.name)) {
      filer.push(p)
    }
  }
}
gaIgenom(path.join(ROT, 'src'))
gaIgenom(path.join(ROT, 'api'))
gaIgenom(path.join(ROT, '../supabase/functions'))

/** Klipper ut den balanserade objektliteralen som börjar vid `start` ({). */
function objektVid(text, start) {
  let djup = 0
  let iStrang = null
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (iStrang) {
      if (c === '\\') i++
      else if (c === iStrang) iStrang = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') { iStrang = c; continue }
    if (c === '{') djup++
    else if (c === '}') {
      djup--
      if (djup === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

/** Toppnivånycklar i en objektliteral. null när formen är osäker. */
function toppnycklar(obj) {
  const inre = obj.slice(1, -1)
  if (/\.\.\./.test(inre)) return null // spread — formen är okänd
  const nycklar = []
  let djup = 0
  let iStrang = null
  let radStart = 0
  const bitar = []
  for (let i = 0; i < inre.length; i++) {
    const c = inre[i]
    if (iStrang) {
      if (c === '\\') i++
      else if (c === iStrang) iStrang = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') { iStrang = c; continue }
    if ('{[('.includes(c)) djup++
    else if ('}])'.includes(c)) djup--
    else if (c === ',' && djup === 0) { bitar.push(inre.slice(radStart, i)); radStart = i + 1 }
  }
  bitar.push(inre.slice(radStart))
  for (let bit of bitar) {
    bit = bit.replace(/\/\/[^\n]*/g, '').trim()
    if (!bit) continue
    const m = bit.match(/^(?:\[[^\]]+\]|'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$]*))\s*:/)
    if (!m) {
      // Kortform { foo } är också en kolumn.
      const kort = bit.match(/^([A-Za-z_$][\w$]*)\s*$/)
      if (kort) { nycklar.push(kort[1]); continue }
      return null // något vi inte förstår — var tyst
    }
    if (bit.startsWith('[')) return null // beräknad nyckel
    nycklar.push(m[1] || m[2] || m[3])
  }
  return nycklar
}

const fynd = []
const hoppade = []

for (const fil of filer) {
  const text = fs.readFileSync(fil, 'utf8')
  // Varje .from('x') och det som följer fram till nästa .from(
  const re = /\.from\(\s*['"]([a-z0-9_]+)['"]\s*\)/g
  let m
  while ((m = re.exec(text))) {
    const tabell = m[1]
    const kolumner = TABELLER[tabell]
    const nastaFrom = text.indexOf('.from(', m.index + 6)
    const kedja = text.slice(m.index, nastaFrom > 0 ? nastaFrom : Math.min(text.length, m.index + 4000))
    if (!kolumner) continue // check-schema-drift äger den kontrollen

    for (const op of ['insert', 'update', 'upsert']) {
      const opRe = new RegExp(`\\.${op}\\(\\s*`, 'g')
      let om
      while ((om = opRe.exec(kedja))) {
        let i = om.index + om[0].length
        if (kedja[i] === '[') i = kedja.indexOf('{', i) // .insert([{…}])
        if (kedja[i] !== '{') continue
        const obj = objektVid(kedja, i)
        if (!obj) continue
        const nycklar = toppnycklar(obj)
        if (!nycklar) { hoppade.push(`${fil}: ${tabell}.${op} (osäker form)`); continue }
        const saknade = nycklar.filter((k) => !kolumner.includes(k))
        if (saknade.length) {
          const rad = text.slice(0, m.index).split('\n').length
          fynd.push({ fil: path.relative(ROT, fil).replace(/\\/g, '/'), rad, tabell, op, saknade, nycklar })
        }
      }
    }
  }
}

console.log(`Genomsökt ${filer.length} filer mot ${Object.keys(TABELLER).length} tabeller.`)
console.log(`Hoppade över ${hoppade.length} anrop med osäker form (spread/beräknade nycklar).\n`)

if (!fynd.length) {
  console.log('Inga kolumner utanför schemat.')
} else {
  console.log(`=== ${fynd.length} anrop skriver kolumner som inte finns ===\n`)
  for (const f of fynd) {
    console.log(`${f.fil}:${f.rad}`)
    console.log(`  ${f.tabell}.${f.op}() → SAKNAS: ${f.saknade.join(', ')}`)
    console.log(`  skickar: ${f.nycklar.join(', ')}`)
    console.log(`  finns:   ${TABELLER[f.tabell].join(', ')}\n`)
  }
}

process.exit(fynd.length ? 1 : 0)
