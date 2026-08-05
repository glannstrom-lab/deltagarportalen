#!/usr/bin/env node
/**
 * Genererar de publika guidesidorna till dist/guider/.  (spår K2, 2026-08-05)
 *
 * Kör efter `vite build`. Varje publicerad artikel blir en egen statisk
 * HTML-sida med riktig <title>, meta description, canonical och JSON-LD —
 * det appen aldrig kan ge, eftersom HashRouter gör hela portalen till EN
 * URL för en sökmotor.
 *
 * Sidorna renderar helt utan JS. Det är en SEO-vinst, men framför allt rätt
 * för målgruppen: innehållet syns även på svag uppkoppling och gammal enhet.
 */

const fs = require('node:fs')
const path = require('node:path')

const { getPublishedArticles, loadSnapshot, validateRoutes, guideUrl } = require('./lib/guides.cjs')
const { renderGuide, renderIndex } = require('./lib/guide-template.cjs')

const CLIENT = path.join(__dirname, '..')
const DIST = path.join(CLIENT, 'dist')
const APP_TSX = path.join(CLIENT, 'src', 'App.tsx')

if (!fs.existsSync(DIST)) {
  console.error('prerender-guides: dist/ saknas — kör efter `vite build`.')
  process.exit(1)
}

// En CTA som pekar på en route som inte finns skickar besökaren till
// startsidan. Hellre trasigt bygge än tyst trasig knapp.
const antalRoutes = validateRoutes(APP_TSX)

const publicerade = getPublishedArticles()
if (publicerade.length === 0) {
  console.log('prerender-guides: publish-list.json är tom — inga guidesidor genererade.')
  process.exit(0)
}

const snapshot = loadSnapshot()
const publiceradeSlugs = new Set(publicerade.map((a) => a.slug))
const bySlug = new Map(snapshot.articles.map((a) => [a.slug, a]))

/** Relaterade guider — bara sådana som faktiskt är publicerade. */
function relateradeFor(a) {
  const egna = (a.related_article_slugs || [])
    .filter((s) => publiceradeSlugs.has(s) && s !== a.slug)
    .map((s) => bySlug.get(s))
  if (egna.length >= 3) return egna.slice(0, 4)

  const sammaKategori = publicerade.filter(
    (x) => x.category_key === a.category_key && x.slug !== a.slug && !egna.some((e) => e.slug === x.slug)
  )
  return [...egna, ...sammaKategori].slice(0, 4)
}

let skrivna = 0
for (const artikel of publicerade) {
  const dir = path.join(DIST, 'guider', artikel.slug)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), renderGuide(artikel, relateradeFor(artikel)), 'utf8')
  skrivna++
}

fs.writeFileSync(path.join(DIST, 'guider', 'index.html'), renderIndex(publicerade), 'utf8')

const totalKb = Math.round(
  publicerade.reduce(
    (n, a) => n + fs.statSync(path.join(DIST, 'guider', a.slug, 'index.html')).size,
    0
  ) / 1024
)

console.log(
  `prerender-guides: ${skrivna} guidesidor + /guider/ skrivna (${totalKb} kB), ` +
    `${antalRoutes} routes validerade, ${snapshot.count - skrivna} artiklar ännu opublicerade.`
)
console.log(`   Exempel: ${guideUrl(publicerade[0].slug)}`)
