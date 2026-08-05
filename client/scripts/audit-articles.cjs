#!/usr/bin/env node
/**
 * Datakvalitetsgranskning av artikelinnehållet.  (2026-08-05)
 *
 * Bakgrund: två fel i samma tabell hittades samma dag, och båda syntes bara
 * när någon faktiskt mätte — lästiden var fel på 128 av 133 artiklar, och
 * tabeller renderades inte alls i appen. Ingetdera gick att se genom att läsa
 * koden. Det här skriptet mäter resten.
 *
 * Kör mot content/articles.snapshot.json (färsk kopia av prod).
 * Kör `npm run content:refresh` först om du vill vara säker på att den är ny.
 */

const fs = require('node:fs')
const path = require('node:path')
const { markdownToPlain } = require('./lib/markdown.cjs')

const SNAPSHOT = path.join(__dirname, '..', 'content', 'articles.snapshot.json')
const APP_TSX = path.join(__dirname, '..', 'src', 'App.tsx')

const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))
const artiklar = snapshot.articles
const slugs = new Set(artiklar.map((a) => a.slug))

/**
 * Matchar en sökväg mot App.tsx som React Router gör det.
 *
 * Rättad 2026-08-05: den gamla varianten jämförde mot en Set av strängar och
 * godtog dessutom bassökvägen (`href.split('/').slice(0,2)`). Den heuristiken
 * släppte igenom `/exercises/digital-cleanup` — men `<Route path="exercises">`
 * saknar wildcard, så den föll till catch-all (`path="*"` -> Navigate to "/")
 * och skickade användaren till översikten. Fem primära CTA:er var döda utan
 * att granskningen sa något. Reglerna som faktiskt gäller:
 *   path="x"     matchar bara /x
 *   path="x/*"   matchar /x OCH /x/vad-som-helst
 *   path="x/:id" matchar exakt ett segment efter /x
 */
const routePatterns = [...fs.readFileSync(APP_TSX, 'utf8').matchAll(/<Route\s+path="([^"]+)"/g)].map(
  (m) => m[1]
)
const routeRegexar = routePatterns
  .filter((p) => p !== '*') // catch-all matchar allt — den är felet, inte målet
  .map((p) => {
    const segment = ('/' + p.replace(/^\//, '')).split('/').filter(Boolean)
    const splat = segment[segment.length - 1] === '*'
    if (splat) segment.pop()
    const kropp = segment
      .map((s) => (s.startsWith(':') ? '[^/]+' : s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      .join('/')
    return new RegExp(kropp ? `^/${kropp}${splat ? '(?:/.*)?' : ''}/?$` : '^/$')
  })
const routeFinns = (href) => {
  const ren = String(href).split(/[?#]/)[0] || '/'
  return routeRegexar.some((r) => r.test(ren))
}

const fynd = []
const notera = (allvar, rubrik, rader) => {
  if (rader.length) fynd.push({ allvar, rubrik, antal: rader.length, rader })
}

// --- Trasiga referenser ----------------------------------------------------
const dodaArtikelRef = []
for (const a of artiklar) {
  for (const r of a.related_article_slugs || []) {
    if (!slugs.has(r)) dodaArtikelRef.push(`${a.slug} → ${r}`)
  }
}
notera('HÖG', 'related_article_slugs pekar på artiklar som inte finns', dodaArtikelRef)

const dodaVerktyg = []
for (const a of artiklar) {
  for (const r of a.related_tools || []) {
    if (typeof r === 'string' && r.startsWith('/') && !routeFinns(r)) {
      dodaVerktyg.push(`${a.slug} → ${r}`)
    }
  }
}
notera('HÖG', 'related_tools pekar på routes som inte finns i App.tsx', dodaVerktyg)

const dodaActions = []
for (const a of artiklar) {
  for (const act of Array.isArray(a.actions) ? a.actions : []) {
    const h = act?.href
    if (typeof h !== 'string' || !h.startsWith('/')) continue
    if (!routeFinns(h)) dodaActions.push(`${a.slug} → ${h} ("${act.label}")`)
  }
}
notera('HÖG', 'actions[].href pekar på routes som inte finns', dodaActions)

// En route kan matcha samtidigt som målobjektet saknas — /knowledge-base/article/:id
// tar vilken sträng som helst, även en slug som inte finns.
const dodaDjuplankar = []
for (const a of artiklar) {
  const hrefs = [...(a.related_tools || []), ...(Array.isArray(a.actions) ? a.actions.map((x) => x?.href) : [])]
  for (const h of hrefs) {
    if (typeof h !== 'string') continue
    const m = h.match(/^\/knowledge-base\/article\/([^/?#]+)/)
    if (m && !slugs.has(m[1])) dodaDjuplankar.push(`${a.slug} → ${h}`)
  }
}
notera('HÖG', 'Länk till artikel-slug som inte finns', dodaDjuplankar)

// href="#" är ingen navigering — knappen renderas men gör ingenting när man klickar.
const tomHref = []
for (const a of artiklar) {
  for (const act of Array.isArray(a.actions) ? a.actions : []) {
    if (typeof act?.href === 'string' && /^#/.test(act.href.trim())) {
      tomHref.push(`${a.slug} → "${act.href}" ("${act.label}")`)
    }
  }
}
notera('MEDEL', 'actions[].href är ett ankare som inte leder någonstans', tomHref)

const sjalvRef = artiklar
  .filter((a) => (a.related_article_slugs || []).includes(a.slug))
  .map((a) => a.slug)
notera('LÅG', 'Artikel refererar till sig själv', sjalvRef)

// --- Dubbletter ------------------------------------------------------------
const perTitel = {}
artiklar.forEach((a) => (perTitel[a.title.trim().toLowerCase()] ||= []).push(a.slug))
notera(
  'MEDEL',
  'Identiska titlar på flera artiklar',
  Object.entries(perTitel)
    .filter(([, v]) => v.length > 1)
    .map(([t, v]) => `"${t}" → ${v.join(', ')}`)
)

const perSummary = {}
artiklar.forEach((a) => (perSummary[(a.summary || '').trim().toLowerCase()] ||= []).push(a.slug))
notera(
  'MEDEL',
  'Identiska sammanfattningar',
  Object.entries(perSummary)
    .filter(([k, v]) => k && v.length > 1)
    .map(([t, v]) => `"${t.slice(0, 50)}…" → ${v.join(', ')}`)
)

// --- Innehållets form ------------------------------------------------------
const h1IContent = artiklar
  .filter((a) => /^#\s+/.test(a.content.trim()))
  .map((a) => {
    const forsta = a.content.trim().split('\n')[0].replace(/^#\s+/, '').trim()
    const samma = forsta.toLowerCase() === a.title.trim().toLowerCase()
    return `${a.slug}${samma ? ' (identisk med title — dubblerad rubrik på sidan)' : ` ("${forsta.slice(0, 40)}")`}`
  })
notera('MEDEL', 'Innehållet inleds med en # -rubrik', h1IContent)

const tomSummary = artiklar.filter((a) => !a.summary || !a.summary.trim()).map((a) => a.slug)
notera('HÖG', 'Saknar sammanfattning (används som meta description)', tomSummary)

const langSummary = artiklar
  .filter((a) => (a.summary || '').length > 160)
  .map((a) => `${a.slug} (${a.summary.length} tecken)`)
notera('LÅG', 'Sammanfattning över 160 tecken (kapas i sökresultat)', langSummary)

// --- Enum-värden -----------------------------------------------------------
const GILTIG_SVARIGHET = new Set(['easy-swedish', 'easy', 'medium', 'detailed'])
const GILTIG_ENERGI = new Set(['low', 'medium', 'high'])
notera(
  'MEDEL',
  'Okänt värde i difficulty',
  artiklar.filter((a) => a.difficulty && !GILTIG_SVARIGHET.has(a.difficulty)).map((a) => `${a.slug}: ${a.difficulty}`)
)
notera(
  'MEDEL',
  'Okänt värde i energy_level',
  artiklar.filter((a) => a.energy_level && !GILTIG_ENERGI.has(a.energy_level)).map((a) => `${a.slug}: ${a.energy_level}`)
)
notera('LÅG', 'Saknar difficulty', artiklar.filter((a) => !a.difficulty).map((a) => a.slug))
notera('LÅG', 'Saknar energy_level', artiklar.filter((a) => !a.energy_level).map((a) => a.slug))

// --- Kategorier ------------------------------------------------------------
const kategorier = {}
artiklar.forEach((a) => (kategorier[a.category_key || '(saknas)'] = (kategorier[a.category_key || '(saknas)'] || 0) + 1))
notera('HÖG', 'Saknar category_key', artiklar.filter((a) => !a.category_key).map((a) => a.slug))

// --- Taggar ----------------------------------------------------------------
const taggRakning = {}
artiklar.forEach((a) => (a.tags || []).forEach((t) => (taggRakning[t] = (taggRakning[t] || 0) + 1)))
const engangstaggar = Object.entries(taggRakning).filter(([, n]) => n === 1)
notera('LÅG', 'Artiklar helt utan taggar', artiklar.filter((a) => !(a.tags || []).length).map((a) => a.slug))

// --- Energinivå mot lästid -------------------------------------------------
// En artikel märkt "låg energi" som tar 7 minuter motsäger sin egen märkning.
const energiKrock = artiklar
  .filter((a) => a.energy_level === 'low' && (a.reading_time || 0) > 4)
  .map((a) => `${a.slug} (${a.reading_time} min, märkt låg energi)`)
notera('MEDEL', 'Märkt för låg energi men lång lästid', energiKrock)

// --- Utskrift --------------------------------------------------------------
console.log(`Granskade ${artiklar.length} artiklar (snapshot ${snapshot.generatedAt}).\n`)

const ordning = { HÖG: 0, MEDEL: 1, LÅG: 2 }
fynd.sort((a, b) => ordning[a.allvar] - ordning[b.allvar])

if (!fynd.length) {
  console.log('Inga fynd.')
} else {
  for (const f of fynd) {
    console.log(`[${f.allvar}] ${f.rubrik} — ${f.antal} st`)
    f.rader.slice(0, 12).forEach((r) => console.log(`    ${r}`))
    if (f.rader.length > 12) console.log(`    … och ${f.rader.length - 12} till`)
    console.log()
  }
}

console.log('--- Fördelningar ---')
console.log('Kategorier:', Object.entries(kategorier).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' '))
console.log(`Taggar: ${Object.keys(taggRakning).length} unika, varav ${engangstaggar.length} med en enda förekomst`)
const ord = artiklar.map((a) => markdownToPlain(a.content).split(/\s+/).filter(Boolean).length).sort((x, y) => x - y)
console.log(`Ordantal: min ${ord[0]}, median ${ord[Math.floor(ord.length / 2)]}, max ${ord[ord.length - 1]}`)
console.log(`\nSumma: ${fynd.filter((f) => f.allvar === 'HÖG').length} höga, ${fynd.filter((f) => f.allvar === 'MEDEL').length} medel, ${fynd.filter((f) => f.allvar === 'LÅG').length} låga fyndkategorier.`)
