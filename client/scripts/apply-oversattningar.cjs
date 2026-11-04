#!/usr/bin/env node
/**
 * Skriver engelska artikeltexter (title_en, summary_en, content_en) till prod.
 * (OM11-1, 2026-11-04)
 *
 * Varför ett eget skript: apply-expansions rör bara svenskan. Slipas en sida
 * står den engelska kvar med gamla regeltal, och ingen grind ser content_en.
 *
 * Läser <katalog>/en/<slug>.md med formatet:
 *   TITLE: ...
 *   SUMMARY: ...
 *   (tom rad)
 *   brödtext
 *
 * Säkerhet:
 *   - Torrkörning som default. --skriv krävs för att röra prod.
 *   - Prods nuvarande engelska sparas i <katalog>/_backup.json INNAN något skrivs.
 *     Återställ med --rollback --skriv.
 *   - Skriptet fäller på saknad källa, för lång titel/summary, H1, ändrade
 *     länkmål, tillkomna siffror och skadade krisnummer.
 *   - Utfallet kontrolleras i databasen efteråt.
 *
 * Kör:
 *   node scripts/apply-oversattningar.cjs content/oversattning-2026-11
 *   node scripts/apply-oversattningar.cjs content/oversattning-2026-11 --skriv --yes
 */

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execSync } = require('node:child_process')

const REPO_ROOT = path.join(__dirname, '..', '..')
const katalog = process.argv.slice(2).find((a) => !a.startsWith('--'))
const skriv = process.argv.includes('--skriv')
const rollback = process.argv.includes('--rollback')
const ja = process.argv.includes('--yes')
const TAG = '$jobin_oversattning$'

if (!katalog) {
  console.error('Ange katalog, till exempel content/oversattning-2026-11')
  process.exit(1)
}
const ROT = path.resolve(katalog)
const BACKUP = path.join(ROT, '_backup.json')

function kor(sql, lasning) {
  const tmp = path.join(os.tmpdir(), `apply-oversattningar-${process.pid}.sql`)
  fs.writeFileSync(tmp, sql, 'utf8')
  const flagga = lasning ? ' --read-only' : ja ? ' --yes' : ''
  try {
    return execSync(`npx supabase db query --linked${flagga} --output json -f "${tmp}"`, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } finally {
    try { fs.unlinkSync(tmp) } catch { /* temp-filen är inte kritisk */ }
  }
}

const rader = (utdata) => JSON.parse(utdata.slice(utdata.indexOf('{'))).rows
const citera = (s) => {
  if (s === null) return 'NULL'
  if (s.includes(TAG)) throw new Error('Text innehåller dollar-taggen')
  return `${TAG}${s}${TAG}`
}
const uppdatera = (a) =>
  `UPDATE articles SET title_en = ${citera(a.title_en)}, summary_en = ${citera(a.summary_en)}, ` +
  `content_en = ${citera(a.content_en)}, updated_at = now() WHERE slug = ${citera(a.slug)};`

if (rollback) {
  const b = JSON.parse(fs.readFileSync(BACKUP, 'utf8'))
  if (!skriv) {
    console.log(`Torrkörning: skulle återställa ${b.length} artiklar. Lägg till --skriv.`)
    process.exit(0)
  }
  kor(b.map(uppdatera).join('\n'))
  console.log(`Återställde ${b.length} artiklar.`)
  process.exit(0)
}

/** Siffror som står i texten, utom listnumrering. */
function siffror(t) {
  const utanLankar = t.replace(/\]\([^)]*\)/g, ']').replace(/^\s*\d+\.\s/gm, '')
  return (utanLankar.match(/\d[\d\s.,]*\d|\d/g) || []).map((s) => s.replace(/[\s.,]/g, '').replace(/^0+(?=\d)/, ''))
}
const lankar = (t) => [...t.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]).sort()

const fel = []
const artiklar = []
const filer = fs.readdirSync(path.join(ROT, 'kalla')).filter((f) => f.endsWith('.md'))
for (const fil of filer) {
  const slug = fil.replace(/\.md$/, '')
  const en = path.join(ROT, 'en', fil)
  if (!fs.existsSync(en)) {
    fel.push(`${slug}: engelsk fil saknas`)
    continue
  }
  const m = fs.readFileSync(en, 'utf8').replace(/\r\n/g, '\n').match(/^TITLE: (.+)\nSUMMARY: (.+)\n\n([\s\S]+)$/)
  if (!m) {
    fel.push(`${slug}: fel format`)
    continue
  }
  const [, title_en, summary_en, content_en] = m
  const sv = fs.readFileSync(path.join(ROT, 'kalla', fil), 'utf8').replace(/\r\n/g, '\n').split('\n').slice(3).join('\n')
  if (title_en.length > 60) fel.push(`${slug}: titel ${title_en.length} tecken`)
  if (summary_en.length > 155) fel.push(`${slug}: summary ${summary_en.length} tecken`)
  if (/^# /m.test(content_en)) fel.push(`${slug}: H1`)
  if (JSON.stringify(lankar(sv)) !== JSON.stringify(lankar(content_en))) {
    const a = lankar(sv), b = lankar(content_en)
    fel.push(`${slug}: länkmål skiljer, saknas [${a.filter((x) => !b.includes(x))}] nya [${b.filter((x) => !a.includes(x))}]`)
  }
  const nyaSiffror = siffror(content_en).filter((s) => !siffror(sv).includes(s))
  if (nyaSiffror.length) fel.push(`${slug}: nya siffror ${[...new Set(nyaSiffror)].join(', ')}`)
  for (const kris of ['90101', '112', '1177']) {
    if (sv.includes(kris) && !content_en.includes(kris)) fel.push(`${slug}: ${kris} saknas`)
  }
  const orddelta = content_en.split(/\s+/).length / sv.split(/\s+/).length
  if (orddelta < 0.75 || orddelta > 1.5) fel.push(`${slug}: längd ${orddelta.toFixed(2)} × svenskan`)
  artiklar.push({ slug, title_en, summary_en, content_en })
}

console.log(`${artiklar.length} av ${filer.length} översättningar lästa.`)
if (fel.length) {
  console.error(`\n${fel.length} fel:\n  ` + fel.join('\n  '))
  process.exit(1)
}
if (!skriv) {
  console.log('Torrkörning, inget skrivet. Lägg till --skriv.')
  process.exit(0)
}

const slugs = artiklar.map((a) => citera(a.slug)).join(',')
const fore = rader(kor(`SELECT slug, title_en, summary_en, content_en FROM articles WHERE slug IN (${slugs});`, true))
if (fore.length !== artiklar.length) {
  console.error(`Prod har ${fore.length} av ${artiklar.length} sluggar. Avbryter.`)
  process.exit(1)
}
if (!fs.existsSync(BACKUP)) fs.writeFileSync(BACKUP, JSON.stringify(fore, null, 2) + '\n', 'utf8')

kor(artiklar.map(uppdatera).join('\n'))

const efter = rader(kor(`SELECT slug, content_en, title_en FROM articles WHERE slug IN (${slugs});`, true))
const fel2 = artiklar.filter((a) => {
  const e = efter.find((x) => x.slug === a.slug)
  return !e || e.content_en !== a.content_en || e.title_en !== a.title_en
})
console.log(`Prod: ${efter.length - fel2.length} av ${artiklar.length} stämmer exakt.`)
if (fel2.length) {
  console.error('Avviker: ' + fel2.map((a) => a.slug).join(', '))
  process.exit(1)
}
