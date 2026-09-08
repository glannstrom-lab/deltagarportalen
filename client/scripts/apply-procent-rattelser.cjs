#!/usr/bin/env node
/**
 * Rättar ospårbara procentpåståenden i prod-tabellen `articles`.
 * (ROADMAP KG2, projektgenomgången 2026-09-07 — utfört 2026-09-08)
 *
 * Fyndet: guiderna påstod "upp till 75 % av alla CV:n ses aldrig av en
 * människa" (fem artiklar), "70 % av alla jobb tillsätts via kontakter" (fem),
 * "87 % av rekryterare använder LinkedIn" (två), "65 % av dagens barn kommer
 * arbeta i yrken som inte finns" — utan källa, utan år, ofta under rubriken
 * "Statistik". Samma felklass som lärdomen "Ett påhittat värde har alltid
 * föredragits framför ett tomt fält": en siffra ser trovärdigare ut än
 * "många", och just därför står den kvar i åratal utan att någon frågar var
 * den kommer ifrån. Räknat 2026-09-08 med samma regel som grinden
 * `src/test/guides-pastaenden.test.ts`: 27 stycken i 25 publicerade artiklar.
 *
 * Rättelserna ligger i `content/procent-rattelser.json` — exakta strängar
 * `fore -> efter` per slug, för svenska (`content`/`summary`) och engelska
 * (`content_en`/`summary_en`). Regeln bakom varje rättelse: en siffra får bara
 * stå kvar med namngiven källa och år i samma sektion; annars formuleras
 * meningen utan siffra ("många", "en del") eller stryks.
 *
 * VARFÖR MOT DATABASEN: tabellen `articles` är sanningen. Appen läser den,
 * och guidesidorna byggs ur en snapshot av den. Rättar man bara snapshoten
 * har deltagarna kvar påståendet i portalen medan den publika sidan är rättad.
 *
 * Säkerhet (samma modell som apply-article-corrections.cjs):
 *   - Torrkörning som default. --skriv krävs för att röra prod.
 *   - Varje `fore` måste förekomma EXAKT en gång i sitt fält, annars avbryts
 *     hela körningen — en sträng som matchar två gånger eller noll gånger är
 *     ett tecken på att texten ändrats sedan rättelsen skrevs.
 *   - Drift-kontroll: prod läses FÖRE skrivning och `content`/`summary`
 *     jämförs mot snapshoten. Har någon ändrat artikeln under tiden avbryts
 *     körningen. (`content_en`/`summary_en` finns inte i snapshoten — de läses
 *     ur prod även vid torrkörning och valideras mot `en.fore` direkt.)
 *   - Originalvärdena sparas i content/_backup-procent-rattelser.json INNAN
 *     något skrivs. Backupen SLÅS IHOP: en slug som redan finns rörs aldrig,
 *     så originalet bevaras även om skriptet körs om.
 *   - SQL:en dollar-citeras och taggen kontrolleras mot varje sträng.
 *   - Utfallet verifieras genom att läsa tillbaka raderna ur databasen.
 *   - Lästiden räknas om när `content` ändrats, med samma formel som
 *     fix-reading-time.cjs och apply-article-corrections.cjs.
 *
 * Kör:
 *   node scripts/apply-procent-rattelser.cjs             # visar diffen
 *   node scripts/apply-procent-rattelser.cjs --skriv     # skriver till prod
 *   node scripts/apply-procent-rattelser.cjs --rollback --skriv
 *   node scripts/apply-procent-rattelser.cjs --bara=<slug> [--skriv]   # en enda slug
 *
 * `--bara` finns för att filen är en logg över ALLA rättelser: en post som
 * redan skrivits till prod matchar 0 gånger nästa körning och fäller
 * driftkontrollen. En ny rättelse i efterhand körs därför ensam.
 *
 * Efteråt: `npm run content:refresh` så snapshoten speglar prod, och
 * `npx vitest run src/test/guides-pastaenden.test.ts` som ska vara grön.
 */

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execSync } = require('node:child_process')
const { markdownToPlain } = require('./lib/markdown.cjs')

const REPO_ROOT = path.join(__dirname, '..', '..')
const SNAPSHOT = path.join(__dirname, '..', 'content', 'articles.snapshot.json')
const RATTELSER = path.join(__dirname, '..', 'content', 'procent-rattelser.json')
const BACKUP = path.join(__dirname, '..', 'content', '_backup-procent-rattelser.json')

const DOLLAR_TAG = '$jobin_procent$'
const ORD_PER_MINUT = 200 // samma som fix-reading-time.cjs — lästiderna får inte spreta

/** Fält som får rättas, och deras engelska motsvarighet. Inget annat rörs. */
const FALT = { content: 'content_en', summary: 'summary_en' }
const ALLA_FALT = ['content', 'summary', 'content_en', 'summary_en']

// ---------------------------------------------------------------------------
// Verktyg
// ---------------------------------------------------------------------------

function kor(sql, json = false) {
  const tmp = path.join(os.tmpdir(), `procent-rattelser-${process.pid}.sql`)
  fs.writeFileSync(tmp, sql, 'utf8')
  try {
    const raw = execSync(
      `npx supabase db query --linked -f "${tmp}"${json ? ' --output json' : ''}`,
      {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    )
    if (!json) return raw
    const start = raw.indexOf('{')
    if (start === -1) throw new Error(`Oväntat CLI-svar:\n${raw.slice(0, 400)}`)
    return JSON.parse(raw.slice(start)).rows
  } finally {
    try { fs.unlinkSync(tmp) } catch { /* temp-filen är inte kritisk */ }
  }
}

function citera(s) {
  if (String(s).includes(DOLLAR_TAG)) {
    console.error('Text innehåller dollar-taggen — kan inte citeras säkert. Avbryter.')
    process.exit(1)
  }
  return `${DOLLAR_TAG}${s}${DOLLAR_TAG}`
}

const sqlVarde = (v) => (v === null || v === undefined ? 'NULL' : citera(v))

const lastidFor = (content, checklist) => {
  const checklistOrd = Array.isArray(checklist)
    ? checklist.map((c) => String(c.text || c)).join(' ').split(/\s+/).filter(Boolean).length
    : 0
  const ord = markdownToPlain(content).split(/\s+/).filter(Boolean).length + checklistOrd
  return Math.max(1, Math.round(ord / ORD_PER_MINUT))
}

/** Antal förekomster av `sok` i `text` — inte regex, exakt sträng. */
const antalForekomster = (text, sok) => (text ? text.split(sok).length - 1 : 0)

/**
 * Prod bär CRLF i `content_en`/`summary_en` (uppmätt 2026-09-08: 24 av 24
 * berörda artiklar, noll rena LF) men LF i `content`/`summary`. Datafilen
 * skriver alltid `\n`; strängen anpassas till fältets egna radslut så att
 * en flerradig rättelse matchar — och så att vi inte byter radslut i fältet.
 */
const medFaltetsRadslut = (s, falt) => (falt && falt.includes('\r\n') ? s.replace(/\r?\n/g, '\r\n') : s)

const hamtaProd = (slugs) =>
  kor(
    `SELECT slug, content, summary, content_en, summary_en, reading_time
     FROM articles WHERE slug IN (${slugs.map(citera).join(',')}) ORDER BY slug;`,
    true
  )

// ---------------------------------------------------------------------------
// Rollback
// ---------------------------------------------------------------------------

const skriv = process.argv.includes('--skriv')

if (process.argv.includes('--rollback')) {
  if (!fs.existsSync(BACKUP)) {
    console.error('Ingen backup att återställa från.')
    process.exit(1)
  }
  const backup = JSON.parse(fs.readFileSync(BACKUP, 'utf8'))
  const satser = backup.artiklar.map((a) => {
    const satt = ALLA_FALT.map((f) => `${f} = ${sqlVarde(a[f])}`)
    satt.push(`reading_time = ${a.reading_time === null ? 'NULL' : a.reading_time}`)
    satt.push('updated_at = now()')
    return `UPDATE articles SET ${satt.join(', ')} WHERE slug = ${citera(a.slug)};`
  })
  if (!skriv) {
    console.log(`Torrkörning: skulle återställa ${satser.length} artiklar. Lägg till --skriv.`)
    process.exit(0)
  }
  kor(satser.join('\n'))
  console.log(`Återställde ${satser.length} artiklar ur backupen.`)
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Läs rättelserna och normalisera formen
// ---------------------------------------------------------------------------

const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))
const bySlug = new Map(snapshot.articles.map((a) => [a.slug, a]))
const rattelseFil = JSON.parse(fs.readFileSync(RATTELSER, 'utf8'))

const problem = []
const planer = [] // { slug, rattelser: [{ falt, fore, efter, en }] }

const baraSlug = (process.argv.find(a => a.startsWith('--bara=')) || '').slice('--bara='.length) || null
if (baraSlug && !(rattelseFil.rattelser || {})[baraSlug]) {
  console.error(`--bara=${baraSlug}: ingen sådan slug i content/procent-rattelser.json.`)
  process.exit(1)
}

for (const [slug, post] of Object.entries(rattelseFil.rattelser || {})) {
  if (baraSlug && slug !== baraSlug) continue
  const lista = Array.isArray(post) ? post : [post]
  const rattelser = []
  for (const [i, r] of lista.entries()) {
    const falt = r.falt || 'content'
    const var_ = `${slug}[${i}]`
    if (!FALT[falt]) { problem.push(`${var_}: fältet "${falt}" får inte rättas (tillåtna: ${Object.keys(FALT).join(', ')}).`); continue }
    if (typeof r.fore !== 'string' || typeof r.efter !== 'string') { problem.push(`${var_}: fore/efter saknas eller är inte strängar.`); continue }
    if (r.fore === r.efter) { problem.push(`${var_}: fore och efter är identiska.`); continue }
    if (r.en !== undefined) {
      if (typeof r.en?.fore !== 'string' || typeof r.en?.efter !== 'string') { problem.push(`${var_}: en.fore/en.efter saknas eller är inte strängar.`); continue }
      if (r.en.fore === r.en.efter) { problem.push(`${var_}: en.fore och en.efter är identiska.`); continue }
    }
    for (const s of [r.fore, r.efter, r.en?.fore, r.en?.efter]) {
      if (typeof s === 'string' && s.includes(DOLLAR_TAG)) problem.push(`${var_}: strängen innehåller dollar-taggen.`)
    }
    rattelser.push({ falt, fore: r.fore, efter: r.efter, en: r.en ?? null })
  }
  if (!bySlug.has(slug)) { problem.push(`${slug}: finns inte i snapshoten.`); continue }
  planer.push({ slug, rattelser })
}

if (!planer.length) {
  console.error('Inga rättelser i content/procent-rattelser.json.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Svenska: applicera mot snapshoten (sanningen för content/summary)
// ---------------------------------------------------------------------------

for (const plan of planer) {
  const original = bySlug.get(plan.slug)
  plan.original = original
  plan.nytt = { content: original.content, summary: original.summary ?? '' }
  for (const r of plan.rattelser) {
    const fore = medFaltetsRadslut(r.fore, plan.nytt[r.falt])
    const efter = medFaltetsRadslut(r.efter, plan.nytt[r.falt])
    const n = antalForekomster(plan.nytt[r.falt], fore)
    if (n !== 1) {
      problem.push(`${plan.slug} [${r.falt}]: "fore" förekommer ${n} gånger (kräver exakt 1): ${JSON.stringify(r.fore.slice(0, 80))}`)
      continue
    }
    plan.nytt[r.falt] = plan.nytt[r.falt].replace(fore, () => efter)
  }
}

if (problem.length) {
  console.error(`Avbryter — ${problem.length} problem i rättelsefilen:`)
  problem.forEach((p) => console.error(`  ${p}`))
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Prod: drift-kontroll för svenskan, och underlag för engelskan
// ---------------------------------------------------------------------------

const slugs = planer.map((p) => p.slug)
const prodRader = hamtaProd(slugs)
if (prodRader.length !== slugs.length) {
  console.error(`Avbryter: ${slugs.length} artiklar i rättelsefilen men prod gav ${prodRader.length} rader tillbaka.`)
  process.exit(1)
}
const prodPerSlug = new Map(prodRader.map((r) => [r.slug, r]))

const drift = []
for (const plan of planer) {
  const p = prodPerSlug.get(plan.slug)
  if (!p) { drift.push(`${plan.slug}: finns inte i prod`); continue }
  if (p.content !== plan.original.content) drift.push(`${plan.slug}: content skiljer sig mot snapshoten`)
  if ((p.summary ?? '') !== (plan.original.summary ?? '')) drift.push(`${plan.slug}: summary skiljer sig mot snapshoten`)
  plan.prod = p
}
if (drift.length) {
  console.error(`Avbryter — snapshoten är inte i fas med prod (${drift.length}):`)
  drift.forEach((d) => console.error(`  ${d}`))
  console.error('Kör `npm run content:refresh` och läs diffen innan du kör igen.')
  process.exit(1)
}

// Engelskan: `en.fore` måste finnas exakt en gång i prod-fältet.
for (const plan of planer) {
  plan.nytt.content_en = plan.prod.content_en
  plan.nytt.summary_en = plan.prod.summary_en
  for (const r of plan.rattelser) {
    if (!r.en) continue
    const faltEn = FALT[r.falt]
    const fore = medFaltetsRadslut(r.en.fore, plan.nytt[faltEn])
    const efter = medFaltetsRadslut(r.en.efter, plan.nytt[faltEn])
    const n = antalForekomster(plan.nytt[faltEn], fore)
    if (n !== 1) {
      problem.push(`${plan.slug} [${faltEn}]: "en.fore" förekommer ${n} gånger i prod (kräver exakt 1): ${JSON.stringify(r.en.fore.slice(0, 80))}`)
      continue
    }
    plan.nytt[faltEn] = plan.nytt[faltEn].replace(fore, () => efter)
  }
  // En rättelse i svenskan vars påstående också står i engelskan men saknar
  // `en` är en halv rättelse — engelskan är en översättning av samma text.
  for (const r of plan.rattelser) {
    if (r.en) continue
    const faltEn = FALT[r.falt]
    if (/\d[\d,.\-–]*\s?(?:%|percent)/i.test(plan.prod[faltEn] || '')) {
      problem.push(`${plan.slug} [${faltEn}]: rättelsen saknar "en" men det engelska fältet innehåller procentsatser — kontrollera att påståendet inte finns där också.`)
    }
  }
}

if (problem.length) {
  console.error(`Avbryter — ${problem.length} problem mot prod:`)
  problem.forEach((p) => console.error(`  ${p}`))
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Räkna ut vad som faktiskt ändras, och lästiden
// ---------------------------------------------------------------------------

for (const plan of planer) {
  plan.satt = {}
  for (const f of ALLA_FALT) {
    const fore = f.endsWith('_en') ? plan.prod[f] : (f === 'summary' ? plan.original.summary ?? '' : plan.original[f])
    if (plan.nytt[f] !== fore) plan.satt[f] = plan.nytt[f]
  }
  if (plan.satt.content !== undefined) {
    const ny = lastidFor(plan.satt.content, plan.original.checklist)
    if (ny !== plan.original.reading_time) plan.satt.reading_time = ny
  }
}

// ---------------------------------------------------------------------------
// Utskrift — diffen, rättelse för rättelse
// ---------------------------------------------------------------------------

const visa = (s) => s.replace(/\n/g, '\n        ')
console.log(`${planer.length} artiklar får ändringar (av ${snapshot.articles.length} i snapshoten).\n`)
for (const plan of planer) {
  console.log(plan.slug)
  for (const r of plan.rattelser) {
    console.log(`    [${r.falt}]`)
    console.log(`      - ${visa(r.fore)}`)
    console.log(`      + ${visa(r.efter)}`)
    if (r.en) {
      console.log(`    [${FALT[r.falt]}]`)
      console.log(`      - ${visa(r.en.fore)}`)
      console.log(`      + ${visa(r.en.efter)}`)
    }
  }
  if (plan.satt.reading_time !== undefined) console.log(`    reading_time: ${plan.original.reading_time} -> ${plan.satt.reading_time}`)
}

const rakna = (f) => planer.filter((p) => p.satt[f] !== undefined).length
console.log(
  `\ncontent: ${rakna('content')}   summary: ${rakna('summary')}   content_en: ${rakna('content_en')}   ` +
    `summary_en: ${rakna('summary_en')}   reading_time: ${rakna('reading_time')}`
)
console.log('Drift-kontroll: prod stämmer med snapshoten (content/summary) för samtliga berörda artiklar.')

if (!skriv) {
  console.log('\nTorrkörning. Lägg till --skriv för att skriva till prod.')
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Backup — slås ihop, första posten per slug vinner
// ---------------------------------------------------------------------------

const befintlig = fs.existsSync(BACKUP) ? JSON.parse(fs.readFileSync(BACKUP, 'utf8')) : { artiklar: [] }
const backupPerSlug = new Map(befintlig.artiklar.map((a) => [a.slug, a]))
let nya = 0
for (const plan of planer) {
  if (backupPerSlug.has(plan.slug)) continue
  backupPerSlug.set(plan.slug, {
    slug: plan.slug,
    content: plan.prod.content,
    summary: plan.prod.summary ?? null,
    content_en: plan.prod.content_en ?? null,
    summary_en: plan.prod.summary_en ?? null,
    reading_time: plan.prod.reading_time ?? null,
  })
  nya++
}
fs.writeFileSync(
  BACKUP,
  JSON.stringify(
    {
      _kommentar:
        'Originalvärden FÖRE procenträttelsen (KG2, 2026-09-08). Posterna slås ihop vid varje körning — en slug som ' +
        'redan finns rörs aldrig, så originalet bevaras även om skriptet körs om. ' +
        'Återställ med `node scripts/apply-procent-rattelser.cjs --rollback --skriv`.',
      uppdaterad: new Date().toISOString().slice(0, 10),
      artiklar: [...backupPerSlug.values()],
    },
    null,
    2
  ) + '\n',
  'utf8'
)
console.log(`\nBackup: ${nya} nya poster, ${backupPerSlug.size} totalt (befintliga orörda) -> ${path.relative(REPO_ROOT, BACKUP)}`)

// ---------------------------------------------------------------------------
// Skriv
// ---------------------------------------------------------------------------

const satser = planer
  .filter((p) => Object.keys(p.satt).length)
  .map((p) => {
    const satt = ['updated_at = now()']
    for (const f of ALLA_FALT) if (p.satt[f] !== undefined) satt.push(`${f} = ${citera(p.satt[f])}`)
    if (p.satt.reading_time !== undefined) satt.push(`reading_time = ${p.satt.reading_time}`)
    return `UPDATE articles SET ${satt.join(', ')} WHERE slug = ${citera(p.slug)};`
  })
kor(satser.join('\n'))

// ---------------------------------------------------------------------------
// Verifiera utfallet i databasen, inte bara att kommandot gick igenom
// ---------------------------------------------------------------------------

const efter = hamtaProd(slugs)
const efterPerSlug = new Map(efter.map((r) => [r.slug, r]))
const avvikelser = []
for (const plan of planer) {
  const r = efterPerSlug.get(plan.slug)
  if (!r) { avvikelser.push(`${plan.slug}: saknas i prod efter skrivning`); continue }
  for (const f of ALLA_FALT) {
    const vantat = plan.satt[f] ?? plan.prod[f] ?? null
    if ((r[f] ?? null) !== vantat) avvikelser.push(`${plan.slug}: ${f} stämmer inte`)
  }
  const vantadLastid = plan.satt.reading_time ?? plan.prod.reading_time ?? null
  if ((r.reading_time ?? null) !== vantadLastid) avvikelser.push(`${plan.slug}: reading_time = ${r.reading_time}, väntade ${vantadLastid}`)
  // Och det som var själva poängen: `fore` får inte finnas kvar, `efter` ska finnas.
  for (const rt of plan.rattelser) {
    const sv = r[rt.falt]
    if (antalForekomster(sv, medFaltetsRadslut(rt.fore, sv)) !== 0) avvikelser.push(`${plan.slug} [${rt.falt}]: "fore" finns kvar i prod`)
    if (antalForekomster(sv, medFaltetsRadslut(rt.efter, sv)) !== 1) avvikelser.push(`${plan.slug} [${rt.falt}]: "efter" finns inte exakt en gång i prod`)
    if (rt.en) {
      const fe = FALT[rt.falt]
      const en = r[fe]
      if (antalForekomster(en, medFaltetsRadslut(rt.en.fore, en)) !== 0) avvikelser.push(`${plan.slug} [${fe}]: "en.fore" finns kvar i prod`)
      if (antalForekomster(en, medFaltetsRadslut(rt.en.efter, en)) !== 1) avvikelser.push(`${plan.slug} [${fe}]: "en.efter" finns inte exakt en gång i prod`)
    }
  }
}

if (avvikelser.length) {
  console.error(`\nSKRIVNINGEN GICK INTE IGENOM SOM TÄNKT (${avvikelser.length}):`)
  avvikelser.forEach((d) => console.error(`  ${d}`))
  console.error('Rulla tillbaka med `node scripts/apply-procent-rattelser.cjs --rollback --skriv`.')
  process.exit(1)
}

console.log(`\nVerifierat mot prod: ${planer.length} artiklar har exakt de värden som skulle skrivas, ${satser.length} UPDATE-satser.`)
console.log('Kör `npm run content:refresh` och sedan `npx vitest run src/test/guides-pastaenden.test.ts`.')
