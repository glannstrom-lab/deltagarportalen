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
 * INKOPPLAT i `npm run verify` sedan 2026-08-12 (ROADMAP C27c). Det gick först
 * när tre saker var på plats: de prerenderade sidorna blev kända för linten
 * (annars 14 falska träffar i `Landing.tsx`), `articleData.ts` rättades (35
 * träffar), och träffar i kod som inte körs slutade fälla bygget.
 *
 * INTE i `.github/workflows/ci.yml` — den filen kräver Mikaels ja enligt
 * släppreglerna i CLAUDE.md. Kör `npm run verify` före push tills dess.
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

/**
 * Exporter som ser ut som navigation men inte konsumeras av någon.  (C27c)
 *
 * Spårat 2026-08-12: `dashboardTabDefs`/`dashboardTabs` har **noll**
 * konsumenter, och `JobSearch.tsx:46` definierar en EGEN lokal
 * `jobSearchTabDefs` som skuggar den i `data/pageTabs.ts`. Sökvägarna
 * `/quests` och `/job-tracker` renderas alltså aldrig för någon användare.
 *
 * De står här i stället för att "rättas": att peka om en död export är att
 * betala för kod ingen kör. Rätt åtgärd är att radera exporterna, vilket hör
 * till dödkodsstädningen i spår C — inte till en länkgrind.
 */
const DODA_EXPORTER = new Map([
  ['data/dashboardTabs.ts', 'dashboardTabDefs/dashboardTabs har noll konsumenter (spårat 2026-08-12)'],
  ['data/pageTabs.ts', 'jobSearchTabDefs skuggas av en lokal definition i JobSearch.tsx:46'],
])

/**
 * Filer som inte är nåbara från `main.tsx`.
 *
 * En död länk i kod som ingen kör är inte en bugg för någon användare, och att
 * laga den är precis det slöseri lärdomen om mekaniska svep varnar för (ett
 * WCAG-svep skrev 58 rader i 15 onåbara filer i augusti). De rapporteras, men
 * de fäller inte grinden — annars kan `lint:links` aldrig kopplas in i CI utan
 * att först städa 42 000 rader dödkod.
 *
 * Listan härleds ur `scripts/dead-code.cjs` när den går att köra; misslyckas
 * det behandlas alla filer som nåbara (strängare, aldrig tystare).
 */
function byggOnabara() {
  try {
    const { execSync } = require('child_process')
    const ut = execSync('node scripts/dead-code.cjs --json', {
      cwd: CLIENT,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const j = JSON.parse(ut)
    return new Set((j.poster || []).map((p) => String(p.fil).replace(/^src\//, '')))
  } catch (err) {
    console.warn(`lint-links: kunde inte avgöra nåbarhet (${err.message.split('\n')[0]}) — alla filer behandlas som nåbara.`)
    return new Set()
  }
}

const ONABARA = byggOnabara()

// Statiska resurser — inte SPA-routes.
const RESURS_EXT = /\.(woff2?|ttf|eot|png|jpe?g|svg|webp|ico|pdf|txt|xml|zip|csv|mp3|mp4)$/i
const RESURS_PREFIX = /^\/(fonts|images|icons|sta)\//

/**
 * De PRERENDERADE sidorna under /guider/ och /verktyg/.  (K12, 2026-08-12)
 *
 * De är statiska filer utanför React-appen och har därför ingen <Route> i
 * App.tsx — men de är fullt giltiga länkmål. Utan den här listan rapporterade
 * linten 14 falska träffar i `Landing.tsx` (K12:s länkar till guideindexet,
 * ämnessidorna och verktygssidorna) och kunde alltså aldrig kopplas in i CI.
 *
 * Listan HÄRLEDS ur samma källor som prerender-guides.cjs bygger sidorna av —
 * publish-list, KATEGORIER och tools.json. En hårdkodad lista hade drivit isär
 * från vad som faktiskt genereras, vilket är samma fälla som den här linten
 * finns för att fånga. Följden är att en länk till en opublicerad guide
 * fortfarande rapporteras, vilket är rätt: den blir en mjuk 404.
 */
function byggPrerenderade() {
  const sidor = new Set()
  try {
    const { KATEGORIER, kategoriUrl, getPublishedArticles, guideUrl } = require('./lib/guides.cjs')
    const publicerade = getPublishedArticles()
    if (publicerade.length) {
      sidor.add('/guider/')
      sidor.add('/guider/lattlast/')
      for (const a of publicerade) sidor.add(guideUrl(a.slug))
      for (const k of KATEGORIER) {
        if (publicerade.some((a) => a.category_key === k.key)) sidor.add(kategoriUrl(k.slug))
      }
    }
    const toolsFil = path.join(CLIENT, 'content', 'tools.json')
    if (fs.existsSync(toolsFil)) {
      const { verktyg } = JSON.parse(fs.readFileSync(toolsFil, 'utf8'))
      if (verktyg?.length) {
        sidor.add('/verktyg/')
        for (const t of verktyg) sidor.add(`/verktyg/${t.slug}/`)
      }
    }
  } catch (err) {
    // Saknas snapshoten går linten vidare utan de här sidorna hellre än att
    // krascha — men säg det, annars ser tystnaden ut som att allt är grönt.
    console.warn(`lint-links: kunde inte läsa de prerenderade sidorna — ${err.message}`)
  }
  return sidor
}

const PRERENDERADE = byggPrerenderade()

const LANK_MONSTER = [
  /\bto=["']([^"'{}]+)["']/g,
  /\bto=\{\s*["'`]([^"'`{}]+)["'`]\s*\}/g,
  /\bnavigate\(\s*["'`]([^"'`{}]+)["'`]/g,
  /\bhref=["']([^"'{}]+)["']/g,
  /\bhref=\{\s*["'`]([^"'`{}]+)["'`]\s*\}/g,
  /\bwindow\.location\.href\s*=\s*["'`]([^"'`{}]+)["'`]/g,
  // objekt-literaler: { href: '/x' }, { to: '/x' }, { path: '/x' }, { url: '/x' }
  /\b(?:href|to|path|url|ctaHref|linkTo|link|route)\s*:\s*["'`]([^"'`{}]+)["'`]/g,
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

// En länk är levande om den matchar en <Route> i App.tsx ELLER är en av de
// prerenderade statiska sidorna. Frågetecken/ankare skalas bort först — de
// tillhör sidan, inte sökvägen.
const arLevande = (href) => {
  if (rutter.matchar(href)) return true
  const utanQuery = href.split(/[?#]/)[0]
  return PRERENDERADE.has(utanQuery) || PRERENDERADE.has(`${utanQuery}/`)
}

const doda = unika.filter((t) => !arLevande(t.href)).sort((a, b) => a.fil.localeCompare(b.fil) || a.rad - b.rad)

// Träffarna delas i två högar. Bara den första fäller bygget: en död länk i
// kod som ingen kör är inte en bugg för någon användare, och att laga den är
// betalt arbete i dödkod. Den andra högen rapporteras ändå — den ska minska
// när spår C:s städning körs, inte glömmas bort.
const orsakOnabar = (t) =>
  ONABARA.has(t.fil) ? 'onåbar från main.tsx' : DODA_EXPORTER.get(t.fil) || null

const levandeKod = doda.filter((t) => !orsakOnabar(t))
const dodKod = doda.filter((t) => orsakOnabar(t))

if (process.argv.includes('--json')) {
  console.log(
    JSON.stringify(
      {
        routes: rutter.antal,
        prerenderade: PRERENDERADE.size,
        granskade: unika.length,
        doda: levandeKod,
        dodaIDodKod: dodKod.map((t) => ({ ...t, orsak: orsakOnabar(t) })),
      },
      null,
      2
    )
  )
} else {
  console.log(`Routes lästa ur App.tsx: ${rutter.antal}`)
  console.log(`Prerenderade sidor kända: ${PRERENDERADE.size}`)
  console.log(`Interna länkmål granskade: ${unika.length}`)

  if (!levandeKod.length) {
    console.log('\nInga döda länkmål i levande kod.')
  } else {
    console.log(`\n${levandeKod.length} länkmål matchar varken route eller prerenderad sida:\n`)
    for (const d of levandeKod) console.log(`  ${d.fil}:${d.rad}  ${d.href}`)
    console.log(
      '\nOBS: en träff bevisar bara att strängen inte matchar en route — inte att den renderas ' +
        'för en riktig användare (feature-flaggor, skuggade lokala tabbar, o.s.v.). Läs träffen ' +
        'i sitt sammanhang innan du ändrar den.'
    )
  }

  if (dodKod.length) {
    console.log(`\n${dodKod.length} träffar i kod som inte körs (fäller inte bygget):`)
    for (const d of dodKod) console.log(`  ${d.fil}:${d.rad}  ${d.href}  — ${orsakOnabar(d)}`)
    console.log('  Rätt åtgärd är att radera koden (spår C), inte att peka om länken.')
  }
}

process.exit(levandeKod.length ? 1 : 0)
