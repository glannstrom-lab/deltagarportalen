#!/usr/bin/env node
/**
 * Rättar datafelen i tabellen `articles` i prod.  (spår K, 2026-08-05)
 *
 * Tre fel, alla hittade av `node scripts/audit-articles.cjs`:
 *
 *   1. Döda länkar. `related_tools` och `actions[].href` pekar på sökvägar
 *      som inte finns som <Route> i App.tsx. React Routers catch-all
 *      (`path="*"` -> <Navigate to="/">) gör att den som klickar
 *      "📝 Öppna CV-generatorn" hamnar på översikten. Ingen 404, ingen logg —
 *      bara en användare som tappar tråden.
 *   2. Dubblerad rubrik. 13 artiklar inleds med en `# `-rubrik, och i 12 av
 *      dem är den ordagrant lika med `title`. Sidan visar rubriken två gånger
 *      (Article.tsx renderar `title` som h1, och innehållets `#` blir h2).
 *      Den trettonde (`latt-svenska-avslag`) har en RIKTIG sektionsrubrik som
 *      skiljer sig från titeln — den rörs inte.
 *   3. Energimärkning som inte håller. Fyra artiklar är märkta `low` men tar
 *      5-6 minuter. Märkningen är ett löfte till användare med begränsad ork.
 *
 * VARFÖR MOT DATABASEN och inte bara mot snapshoten: tabellen `articles` är
 * sanningen — appen läser den, och guidesidorna byggs ur en snapshot av den.
 * Rättar man bara snapshoten får deltagarna i portalen kvar de döda länkarna
 * medan den publika sidan har de rätta. Två versioner som glider isär.
 *
 * Säkerhet (samma modell som apply-expansions.cjs):
 *   - Torrkörning som default. --skriv krävs för att röra prod.
 *   - Originalvärdena sparas i content/_backup-article-corrections.json INNAN
 *     något skrivs. Backupen SLÅS IHOP: en slug som redan finns rörs aldrig,
 *     så originalet bevaras även om skriptet körs om. (Skrevs den över hade
 *     rollbacken tyst återställt fel version — det har hänt i projektet förr.)
 *   - Drift-kontroll: prod läses FÖRE skrivning och jämförs mot snapshoten.
 *     Har någon ändrat artikeln under tiden avbryts hela körningen.
 *   - SQL:en dollar-citeras och taggen kontrolleras mot varje sträng.
 *   - Utfallet verifieras genom att läsa tillbaka raderna ur databasen.
 *
 * Kör:
 *   node scripts/apply-article-corrections.cjs             # visar vad som skulle ändras
 *   node scripts/apply-article-corrections.cjs --skriv     # skriver till prod
 *   node scripts/apply-article-corrections.cjs --rollback --skriv
 */

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execSync } = require('node:child_process')
const { markdownToPlain } = require('./lib/markdown.cjs')

const REPO_ROOT = path.join(__dirname, '..', '..')
const SNAPSHOT = path.join(__dirname, '..', 'content', 'articles.snapshot.json')
const APP_TSX = path.join(__dirname, '..', 'src', 'App.tsx')
const BACKUP = path.join(__dirname, '..', 'content', '_backup-article-corrections.json')

const DOLLAR_TAG = '$jobin_korr$'
const ORD_PER_MINUT = 200 // samma som fix-reading-time.cjs — lästiderna får inte spreta

// ---------------------------------------------------------------------------
// Rättningsreglerna. Explicita och läsbara — inga heuristiker som kan gissa fel.
// ---------------------------------------------------------------------------

/**
 * Sökvägar som bytt namn. Samma karta som scripts/lib/guides.cjs använder för
 * att lappa hrefs vid prerendering; här rättas källan i stället, så lappen kan
 * på sikt tas bort.
 */
const HREF_FIXAR = {
  '/cv-builder': '/cv',
  '/jobs': '/job-search',
  '/interview': '/interview-simulator',
  '/linkedin': '/linkedin-optimizer',
  '/skills-gap': '/skills-gap-analysis',
}

/**
 * Länkar som saknar rimlig motsvarighet och därför tas bort i stället för att
 * gissas om. Varje post kräver ett skäl — inget raderas tyst.
 *
 * De fem övningslänkarna: sökvägen `/exercises/<slug>` finns inte som route
 * (Exercises ligger på `path="exercises"` utan wildcard), så de faller till
 * catch-all. Och den namngivna övningen finns varken i prod (`exercises` har
 * 0 rader, mätt 2026-08-05) eller i mock-fallbacken `src/data/exercises.ts`.
 * Det finns alltså ingen korrekt adress att peka om dem till. Deep-linkning
 * till en övning sker dessutom via `/exercises?id=<slug>`, inte via en
 * sökvägssegment. Samtliga fem artiklar behåller minst en annan action.
 */
const TA_BORT = {
  '/exercises/digital-cleanup':
    'Övningen "digital-cleanup" finns varken i prod eller i mock-datat, och /exercises/<slug> är ingen route.',
  '/exercises/remote-work-prep':
    'Övningen "remote-work-prep" finns varken i prod eller i mock-datat, och /exercises/<slug> är ingen route.',
  '/exercises/feedback-request':
    'Övningen "feedback-request" finns varken i prod eller i mock-datat, och /exercises/<slug> är ingen route.',
  '/exercises/salary-negotiation-practice':
    'Övningen "salary-negotiation-practice" finns varken i prod eller i mock-datat, och /exercises/<slug> är ingen route.',
  '/exercises/work-life-balance-plan':
    'Övningen "work-life-balance-plan" finns varken i prod eller i mock-datat, och /exercises/<slug> är ingen route.',
}

/**
 * Energimärkning som inte håller. Alla fyra är märkta `low` men ligger på
 * 5-6 minuter, medan 40 av de 47 låg-energi-artiklarna ligger på 1-3.
 *
 * `low` är ett löfte om en text man orkar med när orken är slut — inte en
 * beskrivning av ämnet. Tre av de fyra kräver aktivt arbete (övningar,
 * handlingsplaner, regelverk), och för de två wellness-artiklarna finns redan
 * en kort låg-energi-variant med samma innehåll, så ingen blir utan.
 */
const ENERGI_RATTELSER = {
  'hantera-avslag': {
    till: 'medium',
    skal:
      '926 ord/5 min med checklista, mejlmall och avsnitt om varningstecken. ' +
      'Den korta varianten finns kvar som låg energi: hantera-avslag-motivation (3 min) och lattsvenska-avslag (1 min).',
  },
  'motivation-jobbsokning': {
    till: 'medium',
    skal:
      '1 110 ord/6 min över 24 rubriker med veckoöversikt och handlingsplan. ' +
      'Låg-energi-motsvarigheten finns: motivation-langsiktig (3 min).',
  },
  'nystartsjobb-guide': {
    till: 'medium',
    skal:
      'Bevisligen inaktuell märkning: artikeln var 2 min när den märktes low och byggdes ut till 1 004 ord/5 min ' +
      '(se content/expansions/_backup.json). Regelverk med takbelopp och steg-för-steg — kräver koncentration.',
  },
  'upptack-dina-styrkor': {
    till: 'medium',
    skal:
      '1 146 ord/6 min med fyra övningar, STAR-metoden och karriärmatchning. Det är arbete, inte läsning.',
  },
}

const GILTIG_ENERGI = new Set(['low', 'medium', 'high'])

// ---------------------------------------------------------------------------
// Verktyg
// ---------------------------------------------------------------------------

function kor(sql, json = false) {
  const tmp = path.join(os.tmpdir(), `article-corrections-${process.pid}.sql`)
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

/**
 * Matchar en sökväg mot App.tsx på samma sätt som React Router gör.
 *
 * Att bara jämföra mot en mängd strängar (som audit-articles.cjs gör) räcker
 * inte: `path="exercises"` matchar INTE `/exercises/digital-cleanup`, medan
 * `path="cv/*"` matchar `/cv/vad-som-helst`. Skillnaden är precis den som
 * avgör om användaren hamnar rätt eller på översikten.
 */
function byggRouteMatchare(appTsxPath) {
  const src = fs.readFileSync(appTsxPath, 'utf8')
  const patterns = [...src.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1])
  if (patterns.length < 20) {
    throw new Error(`Hittade bara ${patterns.length} routes i App.tsx — filen ser inte ut som väntat.`)
  }
  const regexar = patterns
    .filter((p) => p !== '*') // catch-all matchar allt; den är felet, inte målet
    .map((p) => {
      const segment = ('/' + p.replace(/^\//, '')).split('/').filter(Boolean)
      // `cv/*` matchar både `/cv` och `/cv/mall/2` — splatten är valfri.
      const splat = segment[segment.length - 1] === '*'
      if (splat) segment.pop()
      const kropp = segment
        .map((seg) => (seg.startsWith(':') ? '[^/]+' : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
        .join('/')
      const svans = splat ? '(?:/.*)?' : ''
      return new RegExp(kropp ? `^/${kropp}${svans}/?$` : '^/$')
    })
  return {
    antal: patterns.length,
    matchar(href) {
      const ren = href.split(/[?#]/)[0] || '/'
      return regexar.some((r) => r.test(ren))
    },
  }
}

/** Rättar en href. Returnerar null om länken ska tas bort. */
function normaliseraHref(href) {
  if (typeof href !== 'string') return href
  const h = href.trim()
  if (!h.startsWith('/')) return h // externa länkar, tel:, ankare — rörs inte
  if (TA_BORT[h]) return null
  if (HREF_FIXAR[h]) return HREF_FIXAR[h]
  if (h.startsWith('/knowledge/')) return `/knowledge-base/article/${h.slice('/knowledge/'.length)}`
  return h
}

const lastidFor = (content, checklist) => {
  const checklistOrd = Array.isArray(checklist)
    ? checklist.map((c) => String(c.text || c)).join(' ').split(/\s+/).filter(Boolean).length
    : 0
  const ord = markdownToPlain(content).split(/\s+/).filter(Boolean).length + checklistOrd
  return Math.max(1, Math.round(ord / ORD_PER_MINUT))
}

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
    const satt = [
      `content = ${citera(a.content)}`,
      `related_tools = ${a.related_tools === null ? 'NULL' : `ARRAY[${a.related_tools.map(citera).join(',')}]::text[]`}`,
      `actions = ${a.actions === null ? 'NULL' : `${citera(JSON.stringify(a.actions))}::jsonb`}`,
      `energy_level = ${a.energy_level === null ? 'NULL' : citera(a.energy_level)}`,
      `reading_time = ${a.reading_time === null ? 'NULL' : a.reading_time}`,
    ]
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
// Räkna ut ändringarna
// ---------------------------------------------------------------------------

const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))
const slugs = new Set(snapshot.articles.map((a) => a.slug))
const rutter = byggRouteMatchare(APP_TSX)

const problem = []
const andringar = []

for (const a of snapshot.articles) {
  const satt = {}
  const logg = []

  // --- 1a. related_tools ---------------------------------------------------
  const verktygFore = a.related_tools || []
  const verktygEfter = [...new Set(verktygFore.map(normaliseraHref).filter((h) => h !== null))]
  if (JSON.stringify(verktygFore) !== JSON.stringify(verktygEfter)) {
    satt.related_tools = verktygEfter
    verktygFore.forEach((f, i) => {
      const e = normaliseraHref(f)
      if (e !== f) logg.push(`related_tools[${i}] ${f} -> ${e === null ? '(borttagen)' : e}`)
    })
  }

  // --- 1b. actions[].href --------------------------------------------------
  const actionsFore = Array.isArray(a.actions) ? a.actions : null
  if (actionsFore) {
    const actionsEfter = []
    let rort = false
    for (const act of actionsFore) {
      const ny = normaliseraHref(act.href)
      if (ny === null) {
        rort = true
        logg.push(`actions "${act.label}" (${act.href}) -> borttagen: ${TA_BORT[act.href.trim()]}`)
        continue
      }
      if (ny !== act.href) {
        rort = true
        logg.push(`actions "${act.label}" ${act.href} -> ${ny}`)
      }
      actionsEfter.push({ ...act, href: ny })
    }
    if (rort) satt.actions = actionsEfter
  }

  // --- 2. Dubblerad rubrik -------------------------------------------------
  const trimmad = a.content.trim()
  if (/^#\s+/.test(trimmad)) {
    const forsta = trimmad.split('\n')[0].replace(/^#\s+/, '').trim()
    if (forsta.toLowerCase() === a.title.trim().toLowerCase()) {
      // Ta bort rubrikraden och de tomrader som följer på den.
      const nyContent = trimmad.replace(/^#\s+.*\n+/, '')
      if (!nyContent.trim()) {
        problem.push(`${a.slug}: hela innehållet är rubriken — rör den inte.`)
      } else if (/^#\s+/.test(nyContent)) {
        problem.push(`${a.slug}: nästa rad är också en # -rubrik — oväntad form, hoppar över.`)
      } else {
        satt.content = nyContent
        logg.push(`content: tog bort inledande "# ${forsta}" (identisk med title)`)
      }
    }
  }

  // --- 3. Energimärkning ---------------------------------------------------
  const rattelse = ENERGI_RATTELSER[a.slug]
  if (rattelse) {
    if (a.energy_level === rattelse.till) {
      // Redan rättad — skriptet ska gå att köra om utan att larma.
    } else if (a.energy_level !== 'low') {
      problem.push(`${a.slug}: väntade energy_level="low", fann "${a.energy_level}" — premissen har ändrats.`)
    } else if (!GILTIG_ENERGI.has(rattelse.till)) {
      problem.push(`${a.slug}: "${rattelse.till}" är inget giltigt energy_level.`)
    } else {
      satt.energy_level = rattelse.till
      logg.push(`energy_level: low -> ${rattelse.till}`)
    }
  }

  if (!Object.keys(satt).length) continue

  // Lästiden räknas om när texten ändrats — samma formel som fix-reading-time.cjs.
  if (satt.content !== undefined) {
    const ny = lastidFor(satt.content, a.checklist)
    if (ny !== a.reading_time) {
      satt.reading_time = ny
      logg.push(`reading_time: ${a.reading_time} -> ${ny}`)
    }
  }

  andringar.push({ slug: a.slug, satt, logg, original: a })
}

// ---------------------------------------------------------------------------
// Validering — inget skrivs om något mål fortfarande är dött
// ---------------------------------------------------------------------------

for (const { slug, satt } of andringar) {
  const maal = [
    ...(satt.related_tools || []),
    ...((satt.actions || []).map((x) => x.href)),
  ]
  for (const h of maal) {
    if (typeof h !== 'string' || !h.startsWith('/')) continue
    if (!rutter.matchar(h)) problem.push(`${slug}: "${h}" matchar ingen route i App.tsx.`)
    const m = h.match(/^\/knowledge-base\/article\/([^/?#]+)/)
    if (m && !slugs.has(m[1])) problem.push(`${slug}: artikeln "${m[1]}" finns inte i snapshoten.`)
  }
}

// Kontrollera också att inget kvarvarande mål — även oförändrat — är dött.
const kvarstaende = []
for (const a of snapshot.articles) {
  const andring = andringar.find((x) => x.slug === a.slug)
  const verktyg = andring?.satt.related_tools ?? a.related_tools ?? []
  const acts = andring?.satt.actions ?? (Array.isArray(a.actions) ? a.actions : [])
  for (const h of [...verktyg, ...acts.map((x) => x.href)]) {
    if (typeof h === 'string' && h.startsWith('/') && !rutter.matchar(h)) {
      kvarstaende.push(`${a.slug} -> ${h}`)
    }
  }
}

if (problem.length) {
  console.error(`Avbryter — ${problem.length} problem:`)
  problem.forEach((p) => console.error(`  ${p}`))
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Utskrift
// ---------------------------------------------------------------------------

console.log(`${andringar.length} artiklar får ändringar (av ${snapshot.articles.length}).\n`)
for (const a of andringar) {
  console.log(a.slug)
  a.logg.forEach((r) => console.log(`    ${r}`))
}

const rakna = (nyckel) => andringar.filter((a) => a.satt[nyckel] !== undefined).length
console.log(
  `\nrelated_tools: ${rakna('related_tools')}   actions: ${rakna('actions')}   ` +
    `content: ${rakna('content')}   energy_level: ${rakna('energy_level')}   reading_time: ${rakna('reading_time')}`
)
console.log(
  kvarstaende.length
    ? `\n⚠ ${kvarstaende.length} interna länkar är fortfarande döda:\n  ${kvarstaende.join('\n  ')}`
    : `\nAlla interna länkar i korpusen matchar en route i App.tsx (${rutter.antal} routes lästa).`
)

if (!skriv) {
  console.log('\nTorrkörning. Lägg till --skriv för att skriva till prod.')
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Drift-kontroll: snapshoten måste stämma med prod innan vi skriver över
// ---------------------------------------------------------------------------

const slugLista = andringar.map((a) => citera(a.slug)).join(',')
const prodRader = kor(
  `SELECT slug, content, related_tools, actions, energy_level, reading_time
   FROM articles WHERE slug IN (${slugLista}) ORDER BY slug;`,
  true
)

if (prodRader.length !== andringar.length) {
  console.error(
    `Avbryter: ${andringar.length} artiklar skulle ändras men prod gav ${prodRader.length} rader tillbaka.`
  )
  process.exit(1)
}

const prodPerSlug = new Map(prodRader.map((r) => [r.slug, r]))
const drift = []
for (const a of andringar) {
  const p = prodPerSlug.get(a.slug)
  const o = a.original
  if (!p) { drift.push(`${a.slug}: finns inte i prod`); continue }
  if (p.content !== o.content) drift.push(`${a.slug}: content skiljer sig mot snapshoten`)
  if (JSON.stringify(p.related_tools ?? []) !== JSON.stringify(o.related_tools ?? []))
    drift.push(`${a.slug}: related_tools skiljer sig`)
  if (JSON.stringify(p.actions ?? []) !== JSON.stringify(o.actions ?? []))
    drift.push(`${a.slug}: actions skiljer sig`)
  if ((p.energy_level ?? null) !== (o.energy_level ?? null)) drift.push(`${a.slug}: energy_level skiljer sig`)
}
if (drift.length) {
  console.error(`Avbryter — snapshoten är inte i fas med prod (${drift.length}):`)
  drift.forEach((d) => console.error(`  ${d}`))
  console.error('Kör `npm run content:refresh` och läs diffen innan du kör igen.')
  process.exit(1)
}
console.log('\nDrift-kontroll: prod stämmer med snapshoten för samtliga berörda artiklar.')

// ---------------------------------------------------------------------------
// Backup — slås ihop, första posten per slug vinner
// ---------------------------------------------------------------------------

const befintlig = fs.existsSync(BACKUP) ? JSON.parse(fs.readFileSync(BACKUP, 'utf8')) : { artiklar: [] }
const backupPerSlug = new Map(befintlig.artiklar.map((a) => [a.slug, a]))
let nya = 0
for (const a of andringar) {
  if (backupPerSlug.has(a.slug)) continue
  backupPerSlug.set(a.slug, {
    slug: a.slug,
    content: a.original.content,
    related_tools: a.original.related_tools ?? null,
    actions: Array.isArray(a.original.actions) ? a.original.actions : null,
    energy_level: a.original.energy_level ?? null,
    reading_time: a.original.reading_time ?? null,
  })
  nya++
}
fs.writeFileSync(
  BACKUP,
  JSON.stringify(
    {
      _kommentar:
        'Originalvärden FÖRE länk-, rubrik- och energirättningen (2026-08-05). Posterna slås ihop vid varje ' +
        'körning — en slug som redan finns rörs aldrig, så originalet bevaras även om skriptet körs om. ' +
        'Återställ med `node scripts/apply-article-corrections.cjs --rollback --skriv`.',
      uppdaterad: new Date().toISOString().slice(0, 10),
      artiklar: [...backupPerSlug.values()],
    },
    null,
    2
  ) + '\n',
  'utf8'
)
console.log(`Backup: ${nya} nya poster, ${backupPerSlug.size} totalt (befintliga orörda) -> ${path.relative(REPO_ROOT, BACKUP)}`)

// ---------------------------------------------------------------------------
// Skriv
// ---------------------------------------------------------------------------

const satser = andringar.map((a) => {
  const satt = ['updated_at = now()']
  if (a.satt.content !== undefined) satt.push(`content = ${citera(a.satt.content)}`)
  if (a.satt.related_tools !== undefined) {
    satt.push(
      `related_tools = ${a.satt.related_tools.length ? `ARRAY[${a.satt.related_tools.map(citera).join(',')}]::text[]` : `ARRAY[]::text[]`}`
    )
  }
  if (a.satt.actions !== undefined) satt.push(`actions = ${citera(JSON.stringify(a.satt.actions))}::jsonb`)
  if (a.satt.energy_level !== undefined) satt.push(`energy_level = ${citera(a.satt.energy_level)}`)
  if (a.satt.reading_time !== undefined) satt.push(`reading_time = ${a.satt.reading_time}`)
  return `UPDATE articles SET ${satt.join(', ')} WHERE slug = ${citera(a.slug)};`
})
kor(satser.join('\n'))

// ---------------------------------------------------------------------------
// Verifiera utfallet i databasen, inte bara att kommandot gick igenom
// ---------------------------------------------------------------------------

const efter = kor(
  `SELECT slug, content, related_tools, actions, energy_level, reading_time
   FROM articles WHERE slug IN (${slugLista}) ORDER BY slug;`,
  true
)
const efterPerSlug = new Map(efter.map((r) => [r.slug, r]))

const avvikelser = []
for (const a of andringar) {
  const r = efterPerSlug.get(a.slug)
  if (!r) { avvikelser.push(`${a.slug}: saknas i prod efter skrivning`); continue }
  const vantat = {
    content: a.satt.content ?? a.original.content,
    related_tools: a.satt.related_tools ?? a.original.related_tools ?? [],
    actions: a.satt.actions ?? (Array.isArray(a.original.actions) ? a.original.actions : []),
    energy_level: a.satt.energy_level ?? a.original.energy_level ?? null,
    reading_time: a.satt.reading_time ?? a.original.reading_time ?? null,
  }
  if (r.content !== vantat.content) avvikelser.push(`${a.slug}: content stämmer inte`)
  if (JSON.stringify(r.related_tools ?? []) !== JSON.stringify(vantat.related_tools))
    avvikelser.push(`${a.slug}: related_tools = ${JSON.stringify(r.related_tools)}, väntade ${JSON.stringify(vantat.related_tools)}`)
  if (JSON.stringify(r.actions ?? []) !== JSON.stringify(vantat.actions))
    avvikelser.push(`${a.slug}: actions stämmer inte`)
  if ((r.energy_level ?? null) !== vantat.energy_level)
    avvikelser.push(`${a.slug}: energy_level = ${r.energy_level}, väntade ${vantat.energy_level}`)
  if ((r.reading_time ?? null) !== vantat.reading_time)
    avvikelser.push(`${a.slug}: reading_time = ${r.reading_time}, väntade ${vantat.reading_time}`)
}

if (avvikelser.length) {
  console.error(`\nSKRIVNINGEN GICK INTE IGENOM SOM TÄNKT (${avvikelser.length}):`)
  avvikelser.forEach((d) => console.error(`  ${d}`))
  console.error('Rulla tillbaka med `node scripts/apply-article-corrections.cjs --rollback --skriv`.')
  process.exit(1)
}

console.log(`\nVerifierat mot prod: ${andringar.length} artiklar har exakt de värden som skulle skrivas.`)
console.log('Kör `npm run content:refresh` och sedan `node scripts/audit-articles.cjs`.')
