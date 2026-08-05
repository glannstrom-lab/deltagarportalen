#!/usr/bin/env node
/**
 * Rättar `reading_time` på artiklarna i prod.  (spår K3, 2026-08-05)
 *
 * FYNDET: 128 av 133 artiklar hade en lästid som inte stämde med texten.
 * Medianen var 3,7 gånger för hög och värsta fallet 22 gånger — 22 minuter
 * angivet för en artikel på 189 ord, som tar ungefär en minut att läsa.
 *
 * Varför det spelar roll här mer än på en vanlig sajt: portalen vänder sig
 * till människor som ofta har begränsad ork, och lästiden visas som ett
 * beslutsunderlag ("orkar jag det här nu?"). En uppblåst siffra får någon
 * att hoppa över en text som hade tagit en minut. Felet gör alltså precis
 * det som portalens energianpassning ska motverka.
 *
 * Beräkning: 200 ord i minuten, avrundat, minst 1 minut. Markdown-syntax,
 * tabeller och kodblock räknas inte som lästext. Checklistor räknas med,
 * eftersom de visas på sidan.
 *
 * Kör:
 *   node scripts/fix-reading-time.cjs            # torrkörning
 *   node scripts/fix-reading-time.cjs --skriv    # skriver till prod
 *   node scripts/fix-reading-time.cjs --rollback --skriv
 */

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execSync } = require('node:child_process')
const { markdownToPlain } = require('./lib/markdown.cjs')

const REPO_ROOT = path.join(__dirname, '..', '..')
const SNAPSHOT = path.join(__dirname, '..', 'content', 'articles.snapshot.json')
const BACKUP = path.join(__dirname, '..', 'content', 'expansions', '_backup-reading-time.json')

const ORD_PER_MINUT = 200

function kor(sql) {
  const tmp = path.join(os.tmpdir(), `fix-reading-time-${process.pid}.sql`)
  fs.writeFileSync(tmp, sql, 'utf8')
  try {
    return execSync(`npx supabase db query --linked -f "${tmp}"`, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } finally {
    try { fs.unlinkSync(tmp) } catch { /* temp-filen är inte kritisk */ }
  }
}

const skriv = process.argv.includes('--skriv')

if (process.argv.includes('--rollback')) {
  if (!fs.existsSync(BACKUP)) {
    console.error('Ingen backup att återställa från.')
    process.exit(1)
  }
  const b = JSON.parse(fs.readFileSync(BACKUP, 'utf8'))
  const satser = b.artiklar.map(
    (a) =>
      `UPDATE articles SET reading_time = ${a.reading_time === null ? 'NULL' : a.reading_time} WHERE slug = '${a.slug}';`
  )
  if (!skriv) {
    console.log(`Torrkörning: skulle återställa lästid på ${satser.length} artiklar.`)
    process.exit(0)
  }
  kor(satser.join('\n'))
  console.log(`Återställde lästid på ${satser.length} artiklar.`)
  process.exit(0)
}

const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))

const andringar = []
for (const a of snapshot.articles) {
  const checklistOrd = Array.isArray(a.checklist)
    ? a.checklist.map((c) => String(c.text || c)).join(' ').split(/\s+/).filter(Boolean).length
    : 0
  const ord = markdownToPlain(a.content).split(/\s+/).filter(Boolean).length + checklistOrd
  const ny = Math.max(1, Math.round(ord / ORD_PER_MINUT))
  if (ny !== a.reading_time) {
    andringar.push({ slug: a.slug, ord, fore: a.reading_time ?? null, efter: ny })
  }
}

if (!andringar.length) {
  console.log('Alla lästider stämmer redan.')
  process.exit(0)
}

const sank = andringar.filter((a) => a.fore !== null && a.efter < a.fore).length
const hoj = andringar.filter((a) => a.fore !== null && a.efter > a.fore).length
console.log(`${andringar.length} artiklar får ny lästid (${sank} sänks, ${hoj} höjs).`)
console.log('\nStörsta avvikelserna:')
andringar
  .filter((a) => a.fore)
  .sort((x, y) => y.fore / y.efter - x.fore / x.efter)
  .slice(0, 8)
  .forEach((a) =>
    console.log(`  ${a.slug.padEnd(30)} ${String(a.ord).padStart(4)} ord  ${a.fore} -> ${a.efter} min`)
  )

if (!skriv) {
  console.log('\nTorrkörning. Lägg till --skriv för att uppdatera prod.')
  process.exit(0)
}

fs.writeFileSync(
  BACKUP,
  JSON.stringify(
    {
      _kommentar:
        'Lästider före rättningen (K3, 2026-08-05). Återställ med `node scripts/fix-reading-time.cjs --rollback --skriv`.',
      skapad: new Date().toISOString().slice(0, 10),
      artiklar: andringar.map((a) => ({ slug: a.slug, reading_time: a.fore })),
    },
    null,
    2
  ) + '\n',
  'utf8'
)

kor(andringar.map((a) => `UPDATE articles SET reading_time = ${a.efter} WHERE slug = '${a.slug}';`).join('\n'))
console.log(`\nUppdaterade ${andringar.length} artiklar. Backup: ${path.relative(REPO_ROOT, BACKUP)}`)
