#!/usr/bin/env node
/**
 * Hämtar de publicerbara artiklarna ur prod till content/articles.snapshot.json.
 * (spår K2, 2026-08-05)
 *
 * Varför snapshot och inte live-hämtning i bygget:
 *   - Bygget blir deterministiskt och funkar i CI utan databasnycklar.
 *   - Diffen blir granskningsbar — innehållsändringar syns i en PR.
 *   - Samma mönster som supabase/schema-snapshot.json, som projektet redan
 *     litar på (`npm run schema:refresh`).
 *
 * Priset: redigerar man en artikel i Supabase syns det INTE publikt förrän
 * någon kör `npm run content:refresh` och committar. `npm run content:drift`
 * jämför snapshoten mot prod och säger till när de glidit isär.
 *
 * PREMISS (mätt 2026-08-05): tabellen `articles` har 133 aktiva rader med
 * unika slugs. `articleData.ts` bar tidigare 141 artiklar som fallback i
 * contentApi — den reservkopian är borttagen 2026-08-22, databasen är enda
 * källan —
 * den visas när DB-anropet failar eller ger noll rader. Sanningen är
 * databasen; kör inte det här skriptet mot mock-datat.
 */

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execSync } = require('node:child_process')

const REPO_ROOT = path.join(__dirname, '..', '..')
const OUT = path.join(__dirname, '..', 'content', 'articles.snapshot.json')

function queryJson(sql) {
  // SQL via temporär fil (`-f`): Windows + Node kan inte spawna npx.cmd utan
  // shell, och med shell blir citattecken i SQL:en ohanterliga. Se
  // refresh-schema-snapshot.cjs, samma lösning.
  const tmp = path.join(os.tmpdir(), `content-snapshot-${process.pid}.sql`)
  fs.writeFileSync(tmp, sql, 'utf8')
  try {
    const raw = execSync(`npx supabase db query --linked -f "${tmp}" --output json`, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 128 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const start = raw.indexOf('{')
    if (start === -1) throw new Error(`Oväntat CLI-svar:\n${raw.slice(0, 400)}`)
    return JSON.parse(raw.slice(start)).rows
  } finally {
    try { fs.unlinkSync(tmp) } catch { /* temp-filen är inte kritisk */ }
  }
}

console.log('Hämtar aktiva artiklar ur prod …')
const rows = queryJson(`
  SELECT slug, title, summary, content, category_key, subcategory, tags,
         reading_time, difficulty, energy_level, author, author_title,
         related_article_slugs, related_tools, checklist, actions,
         sort_order, updated_at
  FROM articles
  WHERE is_active
  ORDER BY slug
`)

if (!Array.isArray(rows) || rows.length === 0) {
  console.error('content-snapshot: noll rader tillbaka — avbryter hellre än skriver en tom snapshot.')
  process.exit(1)
}

// Sanity: slugs måste vara unika och URL-säkra, annars kolliderar sidorna.
const seen = new Set()
for (const r of rows) {
  if (!r.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug)) {
    console.error(`content-snapshot: ogiltig slug ${JSON.stringify(r.slug)} (${r.title}).`)
    process.exit(1)
  }
  if (seen.has(r.slug)) {
    console.error(`content-snapshot: dubblerad slug "${r.slug}" — sidorna hade skrivit över varandra.`)
    process.exit(1)
  }
  seen.add(r.slug)
}

const snapshot = {
  _generated: 'npm run content:refresh — redigera inte för hand',
  _source: 'public.articles where is_active (prod)',
  generatedAt: new Date().toISOString().slice(0, 10),
  count: rows.length,
  articles: rows,
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n', 'utf8')
console.log(`content-snapshot: skrev ${path.relative(REPO_ROOT, OUT)} med ${rows.length} artiklar.`)
