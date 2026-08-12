/**
 * Delad kunskap om guidesidorna: vilka som publiceras, vart CTA:erna pekar,
 * och hur en artikel blir en sida.  (spår K2, 2026-08-05)
 *
 * Både prerender-guides.cjs och generate-sitemap.cjs läser härifrån, så att
 * sidor och sitemap aldrig kan gå isär.
 */

const fs = require('node:fs')
const path = require('node:path')

const CONTENT_DIR = path.join(__dirname, '..', '..', 'content')
const SNAPSHOT = path.join(CONTENT_DIR, 'articles.snapshot.json')
const PUBLISH_LIST = path.join(CONTENT_DIR, 'publish-list.json')

const SITE = 'https://www.jobin.se'
const GUIDE_BASE = '/guider'

/**
 * Appen kör HashRouter — djuplänkar MÅSTE ha `#`, annars fångar
 * SPA-fallbacken sökvägen och användaren landar på startsidan.
 */
const appUrl = (route) => `${SITE}/#${route}`

/**
 * Verktygen vi länkar till. `route` är verifierad mot <Route>-listan i
 * App.tsx — se validateRoutes() nedan, som failar bygget vid drift.
 */
const TOOLS = {
  '/cv': {
    namn: 'CV-byggaren',
    text: 'Bygg ett CV som är lätt att läsa — och ladda ner det som PDF när du är klar.',
  },
  '/cover-letter': {
    namn: 'Personligt brev',
    text: 'Få hjälp att sätta ord på varför just du passar för jobbet.',
  },
  '/interview-simulator': {
    namn: 'Intervjuträning',
    text: 'Öva på riktiga intervjufrågor i din egen takt, utan att någon tittar på.',
  },
  '/interest-guide': {
    namn: 'Intresseguiden',
    text: 'Vet du inte vad du vill jobba med? Börja här.',
  },
  '/job-search': {
    namn: 'Jobbsök',
    text: 'Hitta lediga jobb och spara de som känns rätt.',
  },
  '/skills-gap-analysis': {
    namn: 'Kompetensanalys',
    text: 'Se vad som skiljer dig från drömjobbet — och vad du kan göra åt det.',
  },
  '/linkedin-optimizer': {
    namn: 'LinkedIn-hjälpen',
    text: 'Gör din profil lättare att hitta för arbetsgivare.',
  },
  '/wellness': {
    namn: 'Må bra-verktygen',
    text: 'Håll koll på energi och mående medan du söker.',
  },
  '/career': {
    namn: 'Karriärvägar',
    text: 'Utforska vad nästa steg kan vara.',
  },
  '/knowledge-base': {
    namn: 'Kunskapsbanken',
    text: 'Alla guider samlade, med ljuduppläsning och anpassad textstorlek.',
  },
}

/**
 * Hrefs i databasens `actions`/`related_tools` pekar delvis fel — `/cv-builder`
 * finns inte som route (10 artiklar), och `/knowledge/<slug>` heter
 * `/knowledge-base/article/<slug>`. Kartan rättar dem i stället för att
 * skicka besökaren till startsidan. Se ROADMAP K2.
 */
const HREF_FIXAR = {
  '/cv-builder': '/cv',
  '/jobs': '/job-search',
  '/interview': '/interview-simulator',
  '/linkedin': '/linkedin-optimizer',
  '/skills-gap': '/skills-gap-analysis',
}

/**
 * Vilket verktyg som föreslås när artikeln inte pekar ut något själv.
 *
 * Regel: primär-CTA måste vara något man GÖR. `/knowledge-base` får aldrig
 * stå här — den leder till mer läsning, och sidan är redan läsning. Den
 * duger som sekundär länk, inte som huvudknapp.
 */
const KATEGORI_TILL_VERKTYG = {
  'job-search': '/job-search',
  interview: '/interview-simulator',
  'self-awareness': '/interest-guide',
  'career-development': '/career',
  'digital-presence': '/linkedin-optimizer',
  wellness: '/wellness',
  networking: '/linkedin-optimizer',
  'job-market': '/job-search',
  'employment-law': '/job-search',
  accessibility: '/cv',
  'easy-swedish': '/cv',
  tools: '/cv',
  'getting-started': '/interest-guide',
}

const KATEGORI_NAMN = {
  'job-search': 'Söka jobb',
  interview: 'Intervju',
  'self-awareness': 'Självkännedom',
  'career-development': 'Karriär',
  'digital-presence': 'Digital närvaro',
  wellness: 'Må bra',
  networking: 'Nätverk',
  'job-market': 'Arbetsmarknaden',
  'employment-law': 'Dina rättigheter',
  accessibility: 'Tillgänglighet',
  'easy-swedish': 'Lätt svenska',
  tools: 'Verktyg',
  'getting-started': 'Kom igång',
}

/**
 * Kategorisidorna under /guider/kategori/<slug>/.  (spår K15, 2026-08-12)
 *
 * `easy-swedish` står MED VILJA inte här. Den har redan en egen ingång på
 * /guider/lattlast/ (K5), och en andra sida över samma 20 artiklar hade blivit
 * exakt den kannibalisering K14 varnar för — två URL:er som slåss om samma
 * sökning. Kategoriindexet länkar dit i stället.
 *
 * `getting-started` står inte här heller: dess två artiklar är onboarding och
 * publiceras aldrig (triagens regel 3), så sidan hade varit tom.
 *
 * `verktygssida` pekar på en PUBLIK sida under /verktyg/, inte in i appen.
 * Skälet är K11: appens routes är skyddade, och en gäst som klickar dumpas
 * tyst på startsidan. Tills K11 är löst ska en publik sida aldrig ha en
 * skyddad route som primär väg vidare.
 */
const KATEGORIER = [
  {
    key: 'job-search',
    slug: 'soka-jobb',
    rubrik: 'Söka jobb',
    lead: 'Ansökan, CV, personligt brev och sättet att lägga upp sökandet så att det går att hålla i över tid.',
    verktygssida: '/verktyg/cv/',
  },
  {
    key: 'interview',
    slug: 'intervju',
    rubrik: 'Intervju',
    lead: 'Förberedelser, vanliga frågor, digitala intervjuer och det som händer efteråt.',
    verktygssida: '/verktyg/intervjutraning/',
  },
  {
    key: 'wellness',
    slug: 'orka-och-ma-bra',
    rubrik: 'Orka och må bra',
    lead: 'Att söka jobb tar på krafterna. Här handlar det om stress, avslag, motivation och att hitta en takt som håller.',
    verktygssida: '/verktyg/',
  },
  {
    key: 'career-development',
    slug: 'karriar',
    rubrik: 'Karriär och utveckling',
    lead: 'Byta bana, växa i rollen du har, eller ta reda på vad nästa steg skulle kunna vara.',
    verktygssida: '/verktyg/kompetensanalys/',
  },
  {
    key: 'employment-law',
    slug: 'dina-rattigheter',
    rubrik: 'Dina rättigheter',
    lead: 'Anställningsformer, avtal, lön och vad som gäller när något inte står rätt till. Vi beskriver hur reglerna fungerar — de exakta beloppen och gränserna hämtar du hos myndigheten.',
    verktygssida: '/verktyg/',
  },
  {
    key: 'self-awareness',
    slug: 'sjalvkannedom',
    rubrik: 'Vad du kan och vill',
    lead: 'Styrkor, värderingar och kompetenser — underlaget du behöver för att kunna beskriva dig själv för någon annan.',
    verktygssida: '/verktyg/kompetensanalys/',
  },
  {
    key: 'accessibility',
    slug: 'stod-och-anpassningar',
    rubrik: 'Stöd och anpassningar',
    lead: 'Vilka stöd som finns när arbetsförmågan är nedsatt, hur de beslutas, och hur du tar upp dem med en arbetsgivare.',
    verktygssida: '/verktyg/',
  },
  {
    key: 'job-market',
    slug: 'arbetsmarknaden',
    rubrik: 'Arbetsmarknaden',
    lead: 'Var jobben finns, hur branscher skiljer sig åt och hur du läser läget utan att fastna i siffror.',
    verktygssida: '/verktyg/',
  },
  {
    key: 'digital-presence',
    slug: 'digital-narvaro',
    rubrik: 'Din digitala närvaro',
    lead: 'LinkedIn, portfolio och det en arbetsgivare hittar när hon söker på ditt namn.',
    verktygssida: '/verktyg/cv/',
  },
  {
    key: 'networking',
    slug: 'natverk',
    rubrik: 'Nätverk',
    lead: 'Hur kontakter faktiskt leder till jobb — också för dig som tycker att nätverkande känns obekvämt.',
    verktygssida: '/verktyg/',
  },
  {
    key: 'tools',
    slug: 'checklistor-och-ordlistor',
    rubrik: 'Checklistor och ordlistor',
    lead: 'Att bocka av innan du skickar, och att slå upp ord som dyker upp i annonser och avtal.',
    verktygssida: '/verktyg/cv/',
  },
]

const kategoriUrl = (slug) => `${GUIDE_BASE}/kategori/${slug}/`

function normaliseraHref(href) {
  if (!href || typeof href !== 'string') return null
  let h = href.trim()
  if (!h.startsWith('/')) return null
  if (HREF_FIXAR[h]) h = HREF_FIXAR[h]
  if (h.startsWith('/knowledge/')) h = `/knowledge-base/article/${h.slice('/knowledge/'.length)}`
  return h
}

function loadSnapshot() {
  if (!fs.existsSync(SNAPSHOT)) {
    throw new Error(
      `Saknar ${path.relative(process.cwd(), SNAPSHOT)} — kör \`npm run content:refresh\` först.`
    )
  }
  return JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))
}

function loadPublishList() {
  if (!fs.existsSync(PUBLISH_LIST)) return null
  return JSON.parse(fs.readFileSync(PUBLISH_LIST, 'utf8'))
}

/**
 * Artiklar som ska bli publika sidor.
 *
 * Publiceringen är EXPLICIT (K4): en artikel blir publik först när dess slug
 * står i content/publish-list.json. Att släppa alla 133 samtidigt är en känd
 * Helpful-Content-flagga — därför en allowlist och inte "allt i snapshoten".
 */
function getPublishedArticles() {
  const snapshot = loadSnapshot()
  const lista = loadPublishList()
  const bySlug = new Map(snapshot.articles.map((a) => [a.slug, a]))

  if (!lista || !Array.isArray(lista.published)) return []

  const saknade = lista.published.filter((s) => !bySlug.has(s))
  if (saknade.length) {
    throw new Error(
      `publish-list.json pekar på ${saknade.length} slug(s) som inte finns i snapshoten: ` +
        `${saknade.slice(0, 5).join(', ')}. Kör \`npm run content:refresh\` eller rätta listan.`
    )
  }

  return lista.published.map((slug) => bySlug.get(slug))
}

/**
 * Lättläst svenska (K5). Nischen där varken Arbetsförmedlingen eller
 * CV-sajterna konkurrerar på allvar, och som ligger närmast portalens
 * uppdrag. Märkningen sitter på tre ställen i datat — difficulty, kategori
 * och slug-prefix — därför testas alla tre.
 */
const arLattlast = (a) =>
  a.difficulty === 'easy-swedish' || a.category_key === 'easy-swedish' || /^latt/.test(a.slug)

/** Verktygsförslag för en artikel — dess egna först, annars kategorins. */
function verktygFor(article) {
  const egna = (article.related_tools || [])
    .map(normaliseraHref)
    .filter((h) => h && TOOLS[h])
  const unika = [...new Set(egna)]
  if (unika.length) return unika.slice(0, 3)
  const fallback = KATEGORI_TILL_VERKTYG[article.category_key]
  return fallback && TOOLS[fallback] ? [fallback] : ['/cv']
}

/**
 * Failar om något verktyg pekar på en route som inte finns i App.tsx.
 * En CTA som leder till startsidan är värre än ingen CTA.
 */
function validateRoutes(appTsxPath) {
  const src = fs.readFileSync(appTsxPath, 'utf8')
  const routes = new Set(
    [...src.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => '/' + m[1].replace(/^\//, '').replace(/\/\*$/, ''))
  )
  const trasiga = Object.keys(TOOLS).filter((r) => !routes.has(r))
  if (trasiga.length) {
    throw new Error(
      `guides.cjs: ${trasiga.length} verktygslänk(ar) saknar route i App.tsx: ${trasiga.join(', ')}`
    )
  }
  return routes.size
}

module.exports = {
  SITE,
  GUIDE_BASE,
  TOOLS,
  KATEGORI_NAMN,
  KATEGORIER,
  kategoriUrl,
  appUrl,
  normaliseraHref,
  loadSnapshot,
  loadPublishList,
  getPublishedArticles,
  arLattlast,
  verktygFor,
  validateRoutes,
  guideUrl: (slug) => `${GUIDE_BASE}/${slug}/`,
}
