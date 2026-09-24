#!/usr/bin/env node
/**
 * Sätter `related_tools` på utvalda artiklar i prod-tabellen `articles`.
 * (ROADMAP TR3, 2026-09-24)
 *
 * Varför: `related_tools` styr hjältens knapp och verktygskorten på de publika
 * guidesidorna (verktygFor() i scripts/lib/guides.cjs — första posten blir
 * huvudknappen). De mest klickade guiderna pekade fel: lönebidrag mot jobbsök,
 * a-kassan mot kalendern. Dessutom filtreras allt som inte står i TOOLS bort
 * tyst, så `/calendar`, `/diary`, `/applications` och `/education` har aldrig
 * visats — sidan föll tillbaka på kategorins verktyg utan att någon märkte det.
 *
 * Indata: content/related-tools.json (slug → related_tools + varför).
 *
 * Säkerhet: torrkörning som default. Med --skriv: värdena läses ur PROD (inte
 * ur snapshoten), sparas i content/_backup-related-tools.json, skrivs, och
 * läses tillbaka ur prod för att kontrollera att det blev som avsett.
 * `--rollback --skriv` återställer ur backupen.
 *
 * Kör:
 *   node scripts/apply-related-tools.cjs                 # visar vad som ändras
 *   node scripts/apply-related-tools.cjs --skriv
 *   node scripts/apply-related-tools.cjs --rollback --skriv
 * Efteråt: npm run content:refresh (snapshoten), sedan bygget.
 */

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execSync } = require('node:child_process')
const { TOOLS, verktygFor } = require('./lib/guides.cjs')

const REPO_ROOT = path.join(__dirname, '..', '..')
const INDATA = path.join(__dirname, '..', 'content', 'related-tools.json')
const SNAPSHOT = path.join(__dirname, '..', 'content', 'articles.snapshot.json')
const BACKUP = path.join(__dirname, '..', 'content', '_backup-related-tools.json')
const APP_TSX = path.join(__dirname, '..', 'src', 'App.tsx')
const DOLLAR_TAG = '$jobin_verktyg$'

const skriv = process.argv.includes('--skriv')
const rollback = process.argv.includes('--rollback')

function kor(sql, json = false) {
  const tmp = path.join(os.tmpdir(), `apply-related-tools-${process.pid}.sql`)
  fs.writeFileSync(tmp, sql, 'utf8')
  try {
    const raw = execSync(`npx supabase db query --linked -f "${tmp}"${json ? ' --output json' : ''}`, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    if (!json) return raw
    const start = raw.indexOf('{')
    if (start === -1) throw new Error(`Oväntat CLI-svar:\n${raw.slice(0, 400)}`)
    return JSON.parse(raw.slice(start)).rows
  } finally {
    try { fs.unlinkSync(tmp) } catch { /* temp-filen är inte kritisk */ }
  }
}

const citera = (s) => {
  if (String(s).includes(DOLLAR_TAG)) {
    console.error('Text innehåller dollar-taggen — kan inte citeras säkert. Avbryter.')
    process.exit(1)
  }
  return `${DOLLAR_TAG}${s}${DOLLAR_TAG}`
}
const arrayLiteral = (lista) =>
  lista && lista.length ? `ARRAY[${lista.map(citera).join(',')}]::text[]` : 'ARRAY[]::text[]'
const lika = (a, b) => JSON.stringify(a ?? []) === JSON.stringify(b ?? [])

function lasProd(slugs) {
  return kor(
    `SELECT slug, related_tools FROM articles WHERE slug IN (${slugs.map(citera).join(',')}) ORDER BY slug;`,
    true
  )
}

// ---------------------------------------------------------------------------
// Rollback
// ---------------------------------------------------------------------------
if (rollback) {
  if (!fs.existsSync(BACKUP)) {
    console.error('Ingen backup att återställa från.')
    process.exit(1)
  }
  const backup = JSON.parse(fs.readFileSync(BACKUP, 'utf8'))
  const satser = backup.artiklar.map(
    (a) => `UPDATE articles SET related_tools = ${a.related_tools === null ? 'NULL' : arrayLiteral(a.related_tools)} WHERE slug = ${citera(a.slug)};`
  )
  if (!skriv) {
    console.log(`Torrkörning: skulle återställa related_tools på ${satser.length} artiklar. Lägg till --skriv.`)
    process.exit(0)
  }
  kor(`BEGIN;\n${satser.join('\n')}\nCOMMIT;`)
  const efter = new Map(lasProd(backup.artiklar.map((a) => a.slug)).map((r) => [r.slug, r.related_tools]))
  const fel = backup.artiklar.filter((a) => !lika(efter.get(a.slug), a.related_tools))
  if (fel.length) {
    console.error(`Återställningen stämmer inte för: ${fel.map((a) => a.slug).join(', ')}`)
    process.exit(1)
  }
  console.log(`Återställde related_tools på ${satser.length} artiklar. Kör npm run content:refresh.`)
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Validera indata
// ---------------------------------------------------------------------------
const indata = JSON.parse(fs.readFileSync(INDATA, 'utf8')).artiklar
const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))
const perSlug = new Map(snapshot.articles.map((a) => [a.slug, a]))
const routes = new Set(
  [...fs.readFileSync(APP_TSX, 'utf8').matchAll(/<Route\s+path="([^"]+)"/g)].map(
    (m) => '/' + m[1].replace(/^\//, '').replace(/\/\*$/, '')
  )
)

const fel = []
for (const [slug, post] of Object.entries(indata)) {
  if (!perSlug.has(slug)) fel.push(`${slug}: finns inte i snapshoten`)
  const lista = post.related_tools
  if (!Array.isArray(lista) || !lista.length) { fel.push(`${slug}: related_tools saknas eller är tom`); continue }
  if (new Set(lista).size !== lista.length) fel.push(`${slug}: dubbletter i related_tools`)
  if (lista.length > 3) fel.push(`${slug}: fler än tre verktyg — verktygFor() visar bara tre`)
  if (lista[0] === '/knowledge-base') fel.push(`${slug}: /knowledge-base får inte vara huvudknapp`)
  if (!post.varfor) fel.push(`${slug}: motivering (varfor) saknas`)
  for (const t of lista) {
    if (!routes.has(t)) fel.push(`${slug}: "${t}" har ingen route i App.tsx`)
    // Allt utanför TOOLS filtreras bort tyst på guidesidan — då är valet osynligt.
    if (!TOOLS[t]) fel.push(`${slug}: "${t}" står inte i TOOLS i scripts/lib/guides.cjs och skulle aldrig visas`)
  }
}
if (fel.length) {
  console.error(`Indata är fel (${fel.length}):`)
  fel.forEach((f) => console.error(`  ${f}`))
  process.exit(1)
}

const slugs = Object.keys(indata)
const namn = (lista) => lista.map((t) => t.replace(/^\//, '')).join(', ') || '—'

console.log(`${slugs.length} artiklar i indata. Före = lagrat värde; "syns" = vad guidesidan visar (verktygFor).\n`)
for (const slug of slugs) {
  const a = perSlug.get(slug)
  const nytt = indata[slug].related_tools
  const synsFore = verktygFor(a)
  const synsEfter = verktygFor({ ...a, related_tools: nytt })
  const markering = lika(a.related_tools, nytt) ? '  (oförändrad)' : ''
  console.log(`${slug}${markering}`)
  console.log(`  lagrat: [${namn(a.related_tools || [])}]  →  [${namn(nytt)}]`)
  console.log(`  syns:   [${namn(synsFore)}]  →  [${namn(synsEfter)}]`)
}

if (!skriv) {
  console.log('\nTorrkörning. Lägg till --skriv för att skriva till prod.')
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Skriv: läs prod, backup, uppdatera, läs tillbaka
// ---------------------------------------------------------------------------
const fore = lasProd(slugs)
if (fore.length !== slugs.length) {
  console.error(`Avbryter: ${slugs.length} slugs i indata men prod gav ${fore.length} rader.`)
  process.exit(1)
}
const drift = fore.filter((r) => !lika(r.related_tools, perSlug.get(r.slug).related_tools))
if (drift.length) {
  console.error('Avbryter — snapshoten är inte i fas med prod för:')
  drift.forEach((r) => console.error(`  ${r.slug}: prod ${JSON.stringify(r.related_tools)}`))
  console.error('Kör npm run content:refresh och granska diffen innan du kör igen.')
  process.exit(1)
}

// Backupen skrivs över bara om den inte redan finns — annars skulle en andra
// körning spara de NYA värdena som "gamla" och rollbacken bli en no-op.
if (fs.existsSync(BACKUP)) {
  console.log(`Backup finns redan (${path.basename(BACKUP)}) — lämnas orörd.`)
} else {
  fs.writeFileSync(
    BACKUP,
    JSON.stringify(
      {
        _kommentar: 'Värdena i prod före apply-related-tools.cjs --skriv. Återställs med --rollback --skriv.',
        tagen: new Date().toISOString(),
        artiklar: fore.map((r) => ({ slug: r.slug, related_tools: r.related_tools ?? null })),
      },
      null,
      2
    ) + '\n',
    'utf8'
  )
  console.log(`Backup skriven: ${path.basename(BACKUP)}`)
}

const satser = slugs.map(
  (slug) => `UPDATE articles SET related_tools = ${arrayLiteral(indata[slug].related_tools)} WHERE slug = ${citera(slug)};`
)
kor(`BEGIN;\n${satser.join('\n')}\nCOMMIT;`)

const efter = new Map(lasProd(slugs).map((r) => [r.slug, r.related_tools]))
const avvikelser = slugs.filter((s) => !lika(efter.get(s), indata[s].related_tools))
if (avvikelser.length) {
  console.error('Tillbakaläsningen stämmer INTE för:')
  avvikelser.forEach((s) => console.error(`  ${s}: prod ${JSON.stringify(efter.get(s))}`))
  process.exit(1)
}
console.log(`\nSkrev related_tools på ${slugs.length} artiklar; tillbakaläst ur prod och verifierat.`)
console.log('Nästa steg: npm run content:refresh')
