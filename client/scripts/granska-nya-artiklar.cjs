#!/usr/bin/env node
/**
 * Oberoende granskning av en innehållsomgång (spår K, steg 5 i skillen
 * `innehallsomgang`).
 *
 * Varför den finns: fem omgångar i rad har agenterna rapporterat sitt arbete
 * som rent, och fem gånger har egen mätning hittat fel de missat. En
 * egenrapport är inte en mätning.
 *
 * Kontrollerar det som går att mäta maskinellt:
 *   · ordantal mot briefens spann (700–1200, eller 250–450 för easy-swedish)
 *   · titel ≤ 60 tecken, summary ≤ 155
 *   · slugkrock mot prod-snapshoten
 *   · att varje .md har en post i något _meta.*.json, och tvärtom
 *   · externa källänkar (noll = fällt; omgång 6 hade 14 av 25 utan)
 *   · siffror som ser ut som regler (belopp, procent, dagantal, åldrar)
 *   · förbjudna generaliseringar
 *   · category_key mot den tillåtna mängden
 *   · rå `# H1` i brödtexten (titeln sätts av metadatan)
 *
 * Det som INTE går att mäta maskinellt står i skillen och måste läsas för
 * hand: att juridiska begrepp inte är föråldrade, att stödet fortfarande
 * finns, och att sluggen är rättstavad — den blir URL:en för all framtid.
 *
 * Körs utan argument från client/. Exit 1 om något fälls.
 */
const fs = require('fs')
const path = require('path')

// Katalogen går att peka om, så grinden själv kan mutationstestas mot en
// provkatalog i stället för mot den skarpa omgången.
const KATALOG = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, '..', 'content', 'new-articles')
const SNAPSHOT = path.join(__dirname, '..', 'content', 'articles.snapshot.json')

const KATEGORIER = new Set([
  'job-search', 'interview', 'career-development', 'job-market', 'wellness',
  'self-awareness', 'networking', 'digital-presence', 'employment-law',
  'accessibility', 'easy-swedish', 'tools', 'getting-started',
])

const GENERALISERINGAR = /de flesta|många som|många upplever|forskning visar|studier visar|det är vanligt att de|nio av tio|majoriteten av/gi

// Siffror som är regler. Årtal, paragrafnummer och listnumrering är inte det.
const REGELSIFFROR = [
  { rx: /\b\d[\d\s]*(?:kr|kronor|procent|%)\b/gi, vad: 'belopp eller procent' },
  { rx: /\b\d+\s*(?:dagar|dygn|veckor|månader|år)\b(?!\s*sedan)/gi, vad: 'tidsgräns' },
  { rx: /\b(?:minst|högst|max(?:imalt)?|upp till)\s+\d+/gi, vad: 'gräns' },
  { rx: /\b\d{2}\s*(?:–|-)\s*\d{2}\s*år\b/gi, vad: 'åldersspann' },
]

const fel = []
const varning = []
const rader = []

function las(p) { return fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n') }

if (!fs.existsSync(KATALOG)) {
  console.error('granska-nya-artiklar: hittar inte content/new-articles/')
  process.exit(1)
}

const befintliga = new Set(
  JSON.parse(las(SNAPSHOT)).articles.map((a) => a.slug),
)

const metaFiler = fs.readdirSync(KATALOG).filter((f) => /^_meta\.[A-Z]\.json$/.test(f))
const meta = {}
for (const f of metaFiler) {
  let m
  try {
    m = JSON.parse(las(path.join(KATALOG, f)))
  } catch (e) {
    fel.push(`${f}: går inte att tolka som JSON — ${e.message}`)
    continue
  }
  for (const [slug, post] of Object.entries(m)) {
    if (slug.startsWith('_')) continue
    if (meta[slug]) fel.push(`${slug}: finns i både ${meta[slug]._fil} och ${f}`)
    meta[slug] = { ...post, _fil: f }
  }
}

const mdFiler = fs.readdirSync(KATALOG)
  .filter((f) => f.endsWith('.md') && f !== 'BRIEF.md')

if (mdFiler.length === 0) {
  console.error('granska-nya-artiklar: inga .md-filer att granska.')
  process.exit(1)
}

for (const f of mdFiler) {
  const slug = f.replace(/\.md$/, '')
  const text = las(path.join(KATALOG, f))
  const post = meta[slug]
  const ord = text.split(/\s+/).filter(Boolean).length
  const lankar = (text.match(/https:\/\//g) || []).length

  if (!post) {
    fel.push(`${slug}: ingen post i något _meta.*.json`)
    continue
  }
  if (befintliga.has(slug)) {
    fel.push(`${slug}: SLUGKROCK — finns redan i prod`)
  }

  const lattlast = post.category_key === 'easy-swedish'
  const [min, max] = lattlast ? [250, 450] : [700, 1200]
  if (ord < min || ord > max) {
    fel.push(`${slug}: ${ord} ord, ska vara ${min}–${max}${lattlast ? ' (lättläst)' : ''}`)
  }

  if (!post.title) fel.push(`${slug}: saknar title`)
  else if (post.title.length > 60) fel.push(`${slug}: titel ${post.title.length} tecken (max 60)`)

  if (!post.summary) fel.push(`${slug}: saknar summary`)
  else if (post.summary.length > 155) fel.push(`${slug}: summary ${post.summary.length} tecken (max 155)`)

  if (!KATEGORIER.has(post.category_key)) {
    fel.push(`${slug}: category_key "${post.category_key}" är inte tillåten`)
  }

  if (lankar === 0) fel.push(`${slug}: NOLL externa källänkar`)

  if (/^#\s/m.test(text)) fel.push(`${slug}: har en rå # H1 — titeln sätts av metadatan`)

  const gen = text.match(GENERALISERINGAR)
  if (gen) fel.push(`${slug}: obelagd generalisering — ${[...new Set(gen)].join(', ')}`)

  for (const { rx, vad } of REGELSIFFROR) {
    const t = text.match(rx)
    if (t) varning.push(`${slug}: möjlig regelsiffra (${vad}) — ${[...new Set(t)].slice(0, 4).join(', ')}`)
  }

  // "Läs mer om …" utan länk är en död hänvisning.
  for (const m of text.matchAll(/Läs mer om ([^\n.]{0,60})/g)) {
    const efter = text.slice(m.index, m.index + 160)
    if (!/\]\(/.test(efter)) varning.push(`${slug}: "Läs mer om${m[1]}" utan markdown-länk`)
  }

  rader.push({ slug, ord, titel: post.title ? post.title.length : 0, sum: post.summary ? post.summary.length : 0, lankar, kat: post.category_key })
}

for (const slug of Object.keys(meta)) {
  if (!mdFiler.includes(`${slug}.md`)) fel.push(`${slug}: post i ${meta[slug]._fil} men ingen .md-fil`)
}

console.log(`\n${'slug'.padEnd(38)}${'ord'.padStart(5)}${'titel'.padStart(7)}${'summ'.padStart(6)}${'länk'.padStart(6)}  kategori`)
for (const r of rader.sort((a, b) => a.slug.localeCompare(b.slug))) {
  console.log(`${r.slug.padEnd(38)}${String(r.ord).padStart(5)}${String(r.titel).padStart(7)}${String(r.sum).padStart(6)}${String(r.lankar).padStart(6)}  ${r.kat}`)
}
console.log(`\n${rader.length} artiklar granskade.`)

if (varning.length) {
  console.log(`\nATT LÄSA FÖR HAND (${varning.length}):`)
  for (const v of varning) console.log('  · ' + v)
}

if (fel.length) {
  console.error(`\nFÄLLT (${fel.length}):`)
  for (const f of fel) console.error('  ✖ ' + f)
  console.error('\nRätta i filerna — höj aldrig en gräns för att bli grön.')
  process.exit(1)
}

console.log('\nInga maskinellt mätbara fel. Kvar att läsa för hand: föråldrade')
console.log('begrepp, avvecklade stöd, och att varje slug är rättstavad.')
