#!/usr/bin/env node
/**
 * Lägger in NYA artiklar ur content/new-articles/ i prod-tabellen `articles`.
 * (spår K, innehållsomgång 3)
 *
 * Varför ett eget skript: `apply-expansions.cjs` gör UPDATE och avbryter på en
 * slug som inte redan finns i snapshoten — den kan alltså aldrig publicera något
 * nytt. Det här är motsvarigheten åt andra hållet, med samma säkerhetsnät.
 *
 * Varför mot databasen: tabellen `articles` är sanningen. Appen läser den, och
 * guidesidorna byggs ur en snapshot av den. Skriver man bara snapshoten får
 * portalens användare aldrig se artikeln.
 *
 * Säkerhet:
 *   - Torrkörning som default. --skriv krävs för att röra prod.
 *   - VALIDERINGEN KÖRS ALLTID, och samlar ALLA fel innan den avbryter — inte
 *     bara det första. En halvpublicerad omgång är värre än en som inte gick.
 *   - Slugkrockar kontrolleras mot PROD, inte bara mot snapshoten. Snapshoten
 *     kan vara gammal; databasen kan det inte.
 *   - All text dollar-citeras och taggen kontrolleras mot innehållet.
 *   - --rollback --skriv raderar exakt de slugs som skriptet lade in.
 *
 * Kör:
 *   node scripts/apply-new-articles.cjs             # validerar + visar utfall
 *   node scripts/apply-new-articles.cjs --skriv     # skriver till prod
 *   node scripts/apply-new-articles.cjs --rollback --skriv
 */

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execSync } = require('node:child_process')
const { markdownToPlain } = require('./lib/markdown.cjs')

const REPO_ROOT = path.join(__dirname, '..', '..')
const NYA = path.join(__dirname, '..', 'content', 'new-articles')
const SNAPSHOT = path.join(__dirname, '..', 'content', 'articles.snapshot.json')
const APP_TSX = path.join(__dirname, '..', 'src', 'App.tsx')
const LOGG = path.join(NYA, '_inlagda.json')

const DOLLAR_TAG = '$jobin_ny$'
const ORD_PER_MINUT = 200
const FORFATTARE = 'Jobin-redaktionen'

// Kategorierna som redan finns i prod. En ny kategori kräver att
// KnowledgeBase-filtren och guideindexet uppdateras — alltså ett eget beslut.
const KATEGORIER = new Set([
  'job-search', 'interview', 'career-development', 'job-market', 'wellness',
  'self-awareness', 'networking', 'digital-presence', 'employment-law',
  'accessibility', 'tools', 'easy-swedish',
])
const SVARIGHET = new Set(['easy', 'medium', 'detailed', 'easy-swedish'])
const ENERGI = new Set(['low', 'medium', 'high'])

// Triagens gränser (scripts/triage-articles.cjs). En artikel under gränsen blir
// aldrig publicerad — då är det bättre att veta det här än efter skrivningen.
const GRANS_LATTLAST = 120
const GRANS_NORMAL = 350

function kor(sql) {
  const tmp = path.join(os.tmpdir(), `apply-new-articles-${process.pid}.sql`)
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
  if (!fs.existsSync(LOGG)) {
    console.error('Ingen logg över inlagda artiklar — inget att rulla tillbaka.')
    process.exit(1)
  }
  const logg = JSON.parse(fs.readFileSync(LOGG, 'utf8'))
  const slugs = logg.slugs.map((s) => `'${s}'`).join(',')
  if (!skriv) {
    console.log(`Torrkörning: skulle radera ${logg.slugs.length} artiklar ur prod. Lägg till --skriv.`)
    console.log(logg.slugs.join(', '))
    process.exit(0)
  }
  kor(`DELETE FROM articles WHERE slug IN (${slugs});`)
  const kvar = kor(`SELECT count(*) AS kvar FROM articles WHERE slug IN (${slugs});`)
  console.log(`Raderade ${logg.slugs.length} artiklar. Kvar i prod:\n${kvar}`)
  process.exit(0)
}

// ---------- Läs in ----------
if (!fs.existsSync(NYA)) {
  console.error(`Katalogen ${path.relative(REPO_ROOT, NYA)} finns inte.`)
  process.exit(1)
}

const metaFiler = fs.readdirSync(NYA).filter((f) => /^_meta\..*\.json$/.test(f)).sort()
if (!metaFiler.length) {
  console.error('Inga _meta.*.json i content/new-articles/.')
  process.exit(1)
}

const META = {}
const metaKalla = {}
for (const f of metaFiler) {
  const block = JSON.parse(fs.readFileSync(path.join(NYA, f), 'utf8'))
  for (const [slug, m] of Object.entries(block)) {
    if (slug.startsWith('_')) continue
    if (META[slug]) {
      console.error(`Sluggen "${slug}" står i både ${metaKalla[slug]} och ${f}. Avbryter.`)
      process.exit(1)
    }
    META[slug] = m
    metaKalla[slug] = f
  }
}

const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))
const befintliga = new Set(snapshot.articles.map((a) => a.slug))

// Routes ur App.tsx — samma källa som prerender-guides validerar mot.
const appSrc = fs.readFileSync(APP_TSX, 'utf8')
const routes = new Set(
  [...appSrc.matchAll(/<Route\s+path="([^"]+)"/g)]
    .map((m) => m[1])
    .map((p) => (p.startsWith('/') ? p : `/${p}`))
    .map((p) => p.replace(/\/\*$/, ''))
)

function routeFinns(href) {
  if (!href.startsWith('/')) return false
  const artikel = href.match(/^\/knowledge-base\/article\/([^/]+)$/)
  if (artikel) return befintliga.has(artikel[1]) || Boolean(META[artikel[1]])
  return routes.has(href)
}

// ---------- Validera ----------
const fel = []
const artiklar = []
const slugs = Object.keys(META).sort()

for (const slug of slugs) {
  const m = META[slug]
  const anmark = (t) => fel.push(`${slug}: ${t}`)

  if (!/^[a-z0-9-]+$/.test(slug)) anmark('sluggen får bara innehålla a-z, 0-9 och bindestreck')
  if (/\b20\d\d\b/.test(slug)) anmark('sluggen innehåller ett årtal — triagen utesluter den')
  if (befintliga.has(slug)) anmark('sluggen finns redan i snapshoten')

  const mdFil = path.join(NYA, `${slug}.md`)
  if (!fs.existsSync(mdFil)) {
    anmark('ingen .md-fil')
    continue
  }
  const text = fs.readFileSync(mdFil, 'utf8').trim()

  if (text.includes(DOLLAR_TAG)) anmark('texten innehåller dollar-taggen — kan inte citeras säkert')
  if (/^#\s/m.test(text)) anmark('texten innehåller en `# `-rubrik — titeln sätts av metadatan')

  if (!m.title) anmark('title saknas')
  if (!m.summary) anmark('summary saknas')
  else if (m.summary.length > 155) anmark(`summary är ${m.summary.length} tecken (max 155)`)
  if (m.title && /\b20\d\d\b/.test(m.title)) anmark('titeln innehåller ett årtal — triagen utesluter den')
  if (m.title && /portalen|jobin|denna sida|här i appen/i.test(m.title))
    anmark('titeln matchar triagens portalspecifika mönster och skulle uteslutas')

  if (!KATEGORIER.has(m.category_key)) anmark(`okänd category_key "${m.category_key}"`)
  if (m.difficulty && !SVARIGHET.has(m.difficulty)) anmark(`okänd difficulty "${m.difficulty}"`)
  if (m.energy_level && !ENERGI.has(m.energy_level)) anmark(`okänd energy_level "${m.energy_level}"`)

  const checklist = Array.isArray(m.checklist) ? m.checklist : []
  const checklistOrd = checklist.map((c) => String(c.text || c)).join(' ').split(/\s+/).filter(Boolean).length
  const ord = markdownToPlain(text).split(/\s+/).filter(Boolean).length + checklistOrd
  const lattlast = m.difficulty === 'easy-swedish' || m.category_key === 'easy-swedish' || /^latt/.test(slug)
  const grans = lattlast ? GRANS_LATTLAST : GRANS_NORMAL
  if (ord < grans) anmark(`för kort: ${ord} ord (triagens gräns är ${grans}) — skulle inte publiceras`)

  for (const r of m.related_article_slugs || []) {
    if (!befintliga.has(r) && !META[r]) anmark(`related_article_slugs pekar på "${r}" som inte finns`)
  }
  for (const t of m.related_tools || []) {
    if (!routeFinns(t)) anmark(`related_tools "${t}" har ingen route i App.tsx`)
  }
  const actions = Array.isArray(m.actions) ? m.actions : []
  for (const a of actions) {
    if (!a.href || !a.label) anmark('en action saknar href eller label')
    else if (!routeFinns(a.href)) anmark(`action "${a.href}" har ingen route i App.tsx`)
    if (a.href === '/knowledge-base' && a.type === 'primary')
      anmark('primär action får inte peka på /knowledge-base — en läsknapp är ingen åtgärd')
  }
  if (actions.length && !actions.some((a) => a.type === 'primary'))
    anmark('ingen action är markerad som primary')

  artiklar.push({
    slug,
    text,
    ord,
    lattlast,
    lastid: Math.max(1, Math.round(ord / ORD_PER_MINUT)),
    meta: m,
    checklist: checklist.map((c, i) => ({ id: String(i + 1), text: String(c.text || c) })),
    actions,
  })
}

if (fel.length) {
  console.error(`VALIDERINGEN FÄLLDE — ${fel.length} problem, ingenting skrivet:\n`)
  for (const f of fel) console.error(`  ${f}`)
  process.exit(1)
}

console.log('Slug'.padEnd(42), 'kategori'.padEnd(20), ' ord  lästid')
for (const a of artiklar) {
  console.log(
    a.slug.padEnd(42),
    String(a.meta.category_key).padEnd(20),
    String(a.ord).padStart(4),
    `${String(a.lastid).padStart(4)} min`
  )
}
const totalOrd = artiklar.reduce((s, a) => s + a.ord, 0)
console.log(`\n${artiklar.length} nya artiklar, ${totalOrd} ord totalt.`)

if (!skriv) {
  console.log('\nTorrkörning. Validering grön. Lägg till --skriv för att skriva till prod.')
  process.exit(0)
}

// ---------- Slugkrock mot PROD, inte mot snapshoten ----------
const slugLista = artiklar.map((a) => `'${a.slug}'`).join(',')
const krock = kor(`SELECT slug FROM articles WHERE slug IN (${slugLista});`)
const krockade = artiklar.map((a) => a.slug).filter((s) => new RegExp(`\\b${s}\\b`).test(krock))
if (krockade.length) {
  console.error(`Följande slugs finns REDAN i prod (snapshoten var inte aktuell):\n  ${krockade.join('\n  ')}`)
  console.error('Ingenting skrivet.')
  process.exit(1)
}

// ---------- Skriv ----------
const citera = (s) => {
  const str = String(s)
  if (str.includes(DOLLAR_TAG)) {
    console.error('Text innehåller dollar-taggen — kan inte citeras säkert. Avbryter.')
    process.exit(1)
  }
  return `${DOLLAR_TAG}${str}${DOLLAR_TAG}`
}
const textArray = (arr) =>
  arr && arr.length ? `ARRAY[${arr.map((v) => citera(v)).join(',')}]::text[]` : `'{}'::text[]`
const jsonb = (v) => `${citera(JSON.stringify(v))}::jsonb`

const satser = artiklar.map((a) => {
  const m = a.meta
  const kolumner = [
    ['slug', citera(a.slug)],
    ['title', citera(m.title)],
    ['summary', citera(m.summary)],
    ['content', citera(a.text)],
    ['category_key', citera(m.category_key)],
    ['subcategory', m.subcategory ? citera(m.subcategory) : 'NULL'],
    ['tags', textArray(m.tags)],
    ['reading_time', String(a.lastid)],
    ['difficulty', m.difficulty ? citera(m.difficulty) : 'NULL'],
    ['energy_level', m.energy_level ? citera(m.energy_level) : 'NULL'],
    ['author', citera(FORFATTARE)],
    ['related_article_slugs', textArray(m.related_article_slugs)],
    ['related_tools', textArray(m.related_tools)],
    ['checklist', jsonb(a.checklist)],
    ['actions', jsonb(a.actions)],
    ['is_active', 'true'],
  ]
  return (
    `INSERT INTO articles (${kolumner.map((k) => k[0]).join(', ')})\n` +
    `VALUES (${kolumner.map((k) => k[1]).join(', ')});`
  )
})

kor(satser.join('\n'))

// Verifiera UTFALLET i databasen, inte att kommandot gick igenom.
const kontroll = kor(
  `SELECT slug, category_key, length(content) AS tecken, reading_time, is_active
   FROM articles WHERE slug IN (${slugLista}) ORDER BY slug;`
)
console.log('\nUtfall i prod:')
console.log(kontroll)

const antal = kor(`SELECT count(*) AS antal FROM articles WHERE slug IN (${slugLista});`)
console.log(antal)

fs.writeFileSync(
  LOGG,
  JSON.stringify(
    {
      _kommentar:
        'Slugs som apply-new-articles.cjs lagt in i prod. Radera dem igen med `node scripts/apply-new-articles.cjs --rollback --skriv`.',
      skrivet: new Date().toISOString().slice(0, 10),
      slugs: artiklar.map((a) => a.slug),
    },
    null,
    2
  ) + '\n',
  'utf8'
)
console.log(`\nLogg skriven: ${path.relative(REPO_ROOT, LOGG)}`)
console.log('Nästa steg: npm run content:refresh && npm run content:triage -- --skriv && npm run build')
