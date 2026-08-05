#!/usr/bin/env node
/**
 * Skriver de utbyggda artikeltexterna i content/expansions/ till prod.
 * (spår K3, 2026-08-05)
 *
 * Varför mot databasen och inte bara mot snapshoten: tabellen `articles` är
 * sanningen. Appen läser den, och guidesidorna byggs ur en snapshot av den.
 * Skriver man bara snapshoten får deltagarna i portalen kvar den korta
 * texten medan den publika sidan har den långa — två versioner av samma
 * artikel, och drift som ingen upptäcker.
 *
 * Säkerhet:
 *   - Originaltexterna sparas i content/expansions/_backup.json INNAN något
 *     skrivs, så ändringen går att rulla tillbaka med --rollback.
 *   - SQL:en dollar-citeras och tagen kontrolleras mot innehållet, så
 *     citattecken och apostrofer i texten inte kan bryta ut.
 *   - Torrkörning som default. --skriv krävs för att röra prod.
 *
 * Kör:
 *   node scripts/apply-expansions.cjs            # visar vad som skulle ändras
 *   node scripts/apply-expansions.cjs --skriv    # skriver till prod
 *   node scripts/apply-expansions.cjs --rollback # återställer ur backupen
 */

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execSync } = require('node:child_process')
const { markdownToPlain } = require('./lib/markdown.cjs')

const REPO_ROOT = path.join(__dirname, '..', '..')
const EXPANSIONS = path.join(__dirname, '..', 'content', 'expansions')
const BACKUP = path.join(EXPANSIONS, '_backup.json')
const SNAPSHOT = path.join(__dirname, '..', 'content', 'articles.snapshot.json')

const DOLLAR_TAG = '$jobin_expansion$'
const ORD_PER_MINUT = 200

function kor(sql) {
  const tmp = path.join(os.tmpdir(), `apply-expansions-${process.pid}.sql`)
  fs.writeFileSync(tmp, sql, 'utf8')
  try {
    return execSync(`npx supabase db query --linked -f "${tmp}"`, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } finally {
    try { fs.unlinkSync(tmp) } catch { /* temp-filen är inte kritisk */ }
  }
}

const skriv = process.argv.includes('--skriv')
const rollback = process.argv.includes('--rollback')

// ---------- Rollback ----------
if (rollback) {
  if (!fs.existsSync(BACKUP)) {
    console.error('Ingen backup att återställa från.')
    process.exit(1)
  }
  const backup = JSON.parse(fs.readFileSync(BACKUP, 'utf8'))
  const satser = backup.artiklar.map(
    (a) =>
      `UPDATE articles SET content = ${DOLLAR_TAG}${a.content}${DOLLAR_TAG}, ` +
      `reading_time = ${a.reading_time === null ? 'NULL' : a.reading_time} ` +
      `WHERE slug = '${a.slug}';`
  )
  if (!skriv) {
    console.log(`Torrkörning: skulle återställa ${satser.length} artiklar. Lägg till --skriv.`)
    process.exit(0)
  }
  kor(satser.join('\n'))
  console.log(`Återställde ${satser.length} artiklar ur backupen.`)
  process.exit(0)
}

// ---------- Applicera ----------
const filer = fs.readdirSync(EXPANSIONS).filter((f) => f.endsWith('.md'))
if (!filer.length) {
  console.error('Inga .md-filer i content/expansions/.')
  process.exit(1)
}

const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))
const bySlug = new Map(snapshot.articles.map((a) => [a.slug, a]))

const andringar = []
for (const fil of filer.sort()) {
  const slug = fil.replace(/\.md$/, '')
  const original = bySlug.get(slug)
  if (!original) {
    console.error(`Ingen artikel med slug "${slug}" i snapshoten — avbryter.`)
    process.exit(1)
  }
  const nyText = fs.readFileSync(path.join(EXPANSIONS, fil), 'utf8').trim()

  if (nyText.includes(DOLLAR_TAG)) {
    console.error(`"${slug}" innehåller dollar-taggen — kan inte citeras säkert. Avbryter.`)
    process.exit(1)
  }

  const ord = markdownToPlain(nyText).split(/\s+/).filter(Boolean).length
  const lastid = Math.max(1, Math.round(ord / ORD_PER_MINUT))

  andringar.push({
    slug,
    fore: markdownToPlain(original.content).split(/\s+/).filter(Boolean).length,
    efter: ord,
    lastidFore: original.reading_time,
    lastidEfter: lastid,
    nyText,
    original: { slug, content: original.content, reading_time: original.reading_time ?? null },
  })
}

console.log('Artikel'.padEnd(28), 'ord', '        lästid')
for (const a of andringar) {
  console.log(
    a.slug.padEnd(28),
    `${String(a.fore).padStart(4)} -> ${String(a.efter).padStart(4)}`,
    `  ${String(a.lastidFore).padStart(3)} -> ${String(a.lastidEfter).padStart(3)} min`
  )
}

if (!skriv) {
  console.log(`\nTorrkörning. ${andringar.length} artiklar skulle uppdateras. Lägg till --skriv.`)
  process.exit(0)
}

// Backup FÖRE skrivning.
fs.writeFileSync(
  BACKUP,
  JSON.stringify(
    {
      _kommentar:
        'Originaltexter före utbyggnaden (K3, 2026-08-05). Återställ med `node scripts/apply-expansions.cjs --rollback --skriv`.',
      skapad: new Date().toISOString().slice(0, 10),
      artiklar: andringar.map((a) => a.original),
    },
    null,
    2
  ) + '\n',
  'utf8'
)
console.log(`\nBackup skriven: ${path.relative(REPO_ROOT, BACKUP)}`)

const satser = andringar.map(
  (a) =>
    `UPDATE articles SET content = ${DOLLAR_TAG}${a.nyText}${DOLLAR_TAG}, ` +
    `reading_time = ${a.lastidEfter}, updated_at = now() WHERE slug = '${a.slug}';`
)
kor(satser.join('\n'))

// Verifiera utfallet i databasen, inte bara att kommandot gick igenom.
const slugLista = andringar.map((a) => `'${a.slug}'`).join(',')
const kontroll = kor(
  `SELECT slug, length(content) AS tecken, reading_time FROM articles WHERE slug IN (${slugLista}) ORDER BY slug;`
)
console.log('\nUtfall i prod:')
console.log(kontroll)
