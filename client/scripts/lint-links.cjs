#!/usr/bin/env node
/**
 * Hittar interna länkmål (`to="/x"`, `navigate('/x')`, `href="/x"`,
 * `{ href: '/x' }`/`{ to: '/x' }`) i client/src som inte matchar någon
 * <Route> i App.tsx. (ROADMAP C23, 2026-08-12)
 *
 * VARFÖR SKRIPTET FINNS
 * ----------------------
 * React Routers catch-all (`path="*"` -> <Navigate to="/">) sväljer en
 * felstavad/omdöpt sökväg TYST — ingen 404, ingen konsolvarning. Fyra sådana
 * länkar hittades skarpa i levande UI 2026-08-12 (`/jobs`, `/jobs?tab=saved`,
 * `/cv-builder` ×2, `/spontaneous`) genom manuell premissgranskning. Det här
 * skriptet gör samma kontroll mekaniskt.
 *
 * Route-matchningen återanvänder samma logik som
 * `scripts/apply-article-corrections.cjs` (`byggRouteMatchare`): en riktig
 * matchare mot React Routers segment/param/splat-semantik, inte en Set av
 * strängar (en sådan missar att `cv/*` matchar `/cv/mall/2` och att
 * `exercises` INTE matchar `/exercises/digital-cleanup`).
 *
 * VAD SKRIPTET INTE GÖR
 * ----------------------
 * - Kontrollerar inte om en nåbar fil faktiskt RENDERAS för en riktig
 *   användare (t.ex. STA-modulen är kod-nåbar men avstängd via
 *   VITE_STA_ENABLED; en tabb-array kan vara skuggad av en lokal
 *   omdefiniering i konsumenten). Läs träffen innan du fixar den.
 * - Rör inga filer. Ren rapport.
 *
 * KÖR
 * ---
 *   node scripts/lint-links.cjs            # rapport, exit 1 om träffar
 *   node scripts/lint-links.cjs --json     # maskinläsbart
 *
 * INTE inkopplat i `npm run verify` eller CI — eget beslut (ROADMAP C23).
 */

const fs = require('fs')
const path = require('path')

const CLIENT = path.join(__dirname, '..')
const SRC = path.join(CLIENT, 'src')
const APP_TSX = path.join(SRC, 'App.tsx')

const KOD_EXT = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']
const ALLA_EXT = [...KOD_EXT, '.css', '.json']

function gaIgenom(dir, ut = []) {
  for (const post of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, post.name)
    if (post.isDirectory()) {
      if (post.name === 'node_modules' || post.name === '.git') continue
      gaIgenom(p, ut)
    } else if (ALLA_EXT.includes(path.extname(post.name))) {
      ut.push(p)
    }
  }
  return ut
}
const ALLA_FILER = gaIgenom(SRC)
const rel = (p) => path.relative(SRC, p).split(path.sep).join('/')

// ---------------------------------------------------------------------------
// Route-matchare — samma logik som scripts/apply-article-corrections.cjs
// ---------------------------------------------------------------------------
function byggRouteMatchare(appTsxPath) {
  const src = fs.readFileSync(appTsxPath, 'utf8')
  const patterns = [...src.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1])
  if (patterns.length < 20) {
    throw new Error(`Hittade bara ${patterns.length} routes i App.tsx — filen ser inte ut som väntat.`)
  }
  const regexar = patterns
    .filter((p) => p !== '*')
    .map((p) => {
      const segment = ('/' + p.replace(/^\//, '')).split('/').filter(Boolean)
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
const rutter = byggRouteMatchare(APP_TSX)

// ---------------------------------------------------------------------------
// Kända undantag — filer/mönster som ser ut som döda länkar men inte är det
// ---------------------------------------------------------------------------

// Filer vars `path:`-fält är avsiktlig PREFIX-matchning (pathname.startsWith),
// inte en klickbar länk mot en exakt route. En strikt route-matchare ger
// falska positiva här (t.ex. '/invite' matchar inte route:n '/invite/:code'
// trots att .startsWith('/invite') fungerar perfekt i själva koden).
const UNDANTAGNA_FILER = new Set([
  'hooks/usePageTitle.ts', // prefix-tabell för dokumenttitel, se filens egen kommentar
])

// Statiska resurser — inte SPA-routes.
const RESURS_EXT = /\.(woff2?|ttf|eot|png|jpe?g|svg|webp|ico|pdf|txt|xml|zip|csv|mp3|mp4)$/i
const RESURS_PREFIX = /^\/(fonts|images|icons|sta)\//

const LANK_MONSTER = [
  /\bto=["']([^"'{}]+)["']/g,
  /\bto=\{\s*["'`]([^"'`{}]+)["'`]\s*\}/g,
  /\bnavigate\(\s*["'`]([^"'`{}]+)["'`]/g,
  /\bhref=["']([^"'{}]+)["']/g,
  /\bhref=\{\s*["'`]([^"'`{}]+)["'`]\s*\}/g,
  /\bwindow\.location\.href\s*=\s*["'`]([^"'`{}]+)["'`]/g,
  // objekt-literaler: { href: '/x' }, { to: '/x' }, { path: '/x' }, { url: '/x' }
  /\b(?:href|to|path|url|ctaHref|linkTo|route)\s*:\s*["'`]([^"'`{}]+)["'`]/g,
]

const traffar = []
for (const fil of ALLA_FILER) {
  if (!/\.(tsx|ts|jsx|js)$/.test(fil)) continue
  if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(fil)) continue
  const filRel = rel(fil)
  if (UNDANTAGNA_FILER.has(filRel)) continue
  const kod = fs.readFileSync(fil, 'utf8')
  for (const re of LANK_MONSTER) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(kod)) !== null) {
      const href = m[1]
      if (!href.startsWith('/') || href.startsWith('//')) continue
      if (RESURS_EXT.test(href) || RESURS_PREFIX.test(href)) continue
      const rad = kod.slice(0, m.index).split('\n').length
      traffar.push({ fil: filRel, rad, href })
    }
  }
}

const seen = new Set()
const unika = traffar.filter((t) => {
  const k = `${t.fil}:${t.rad}:${t.href}`
  if (seen.has(k)) return false
  seen.add(k)
  return true
})

const doda = unika.filter((t) => !rutter.matchar(t.href)).sort((a, b) => a.fil.localeCompare(b.fil) || a.rad - b.rad)

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ routes: rutter.antal, granskade: unika.length, doda }, null, 2))
} else {
  console.log(`Routes lästa ur App.tsx: ${rutter.antal}`)
  console.log(`Interna länkmål granskade: ${unika.length}`)
  if (!doda.length) {
    console.log('\nInga döda länkmål hittade.')
  } else {
    console.log(`\n${doda.length} länkmål matchar ingen route:\n`)
    for (const d of doda) console.log(`  ${d.fil}:${d.rad}  ${d.href}`)
    console.log(
      '\nOBS: en träff bevisar bara att strängen inte matchar en route i App.tsx — inte att den ' +
        'renderas för en riktig användare (feature-flaggor, skuggade lokala tabbar, o.s.v.). Läs ' +
        'träffen i sitt sammanhang innan du ändrar den.'
    )
  }
}

process.exit(doda.length ? 1 : 0)
