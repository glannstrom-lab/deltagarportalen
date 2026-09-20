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

const {
  getPublishedArticles,
  loadSnapshot,
  validateRoutes,
  guideUrl,
  arLattlast,
  KATEGORIER,
} = require('./lib/guides.cjs')
const {
  renderGuide,
  renderIndex,
  renderKategori,
  renderLattlast,
  renderTool,
  renderToolIndex,
  renderB2B,
  renderDemo,
  renderSituation,
  renderSituationIndex,
  renderOmOss,
  titelForLang,
  TITEL_MAX,
} = require('./lib/guide-template.cjs')
const { byggRelaterade, validateRelaterade } = require('./lib/related.cjs')

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

// /guider/lattlast/ och /guider/kategori/ är genererade ingångssidor. En
// artikel med någon av de sluggarna hade skrivits över tyst — hellre trasigt
// bygge än en sida som försvinner.
const RESERVERADE = new Set(['lattlast', 'index', 'kategori'])
const krock = publicerade.filter((a) => RESERVERADE.has(a.slug))
if (krock.length) {
  console.error(
    `prerender-guides: slug(s) krockar med genererade sidor: ${krock.map((a) => a.slug).join(', ')}`
  )
  process.exit(1)
}

const snapshot = loadSnapshot()
const publiceradeSlugs = new Set(publicerade.map((a) => a.slug))
const bySlug = new Map(snapshot.articles.map((a) => [a.slug, a]))

// Grind: ett artikelantal utskrivet på en landningssida måste stämma.
//
// /verktyg/kunskapsbank/ säger "239 artiklar" i lead, punktlista och FAQ.
// Talet är sant när det skrivs och fel efter nästa innehållsomgång — samma
// mönster som K10:s lästider, som var fel på 128 av 133 artiklar innan någon
// mätte. Skillnaden mot lästiderna är att det här går att vakta mekaniskt.
//
// Grinden läser SIDORNAS data, inte filernas `_kommentar` — en kommentar som
// beskriver en historisk siffra ska inte fälla bygget. Samma skäl som att
// Landing-grinden nedan strippar kommentarer innan den matchar.
{
  const antalsfel = []
  for (const [fil, nyckel] of [
    ['tools.json', 'verktyg'],
    ['situationer.json', 'sidor'],
    ['b2b.json', 'sidor'],
  ]) {
    const sokvag = path.join(CLIENT, 'content', fil)
    if (!fs.existsSync(sokvag)) continue
    for (const post of JSON.parse(fs.readFileSync(sokvag, 'utf8'))[nyckel] || []) {
      for (const [, tal] of JSON.stringify(post).matchAll(/(\d+)\s*(?:st\s*)?artiklar/g)) {
        if (Number(tal) !== publicerade.length) {
          antalsfel.push(
            `  - ${fil} → ${post.slug}: säger "${tal} artiklar", verkligheten är ${publicerade.length}`
          )
        }
      }
    }
  }
  if (antalsfel.length) {
    console.error('prerender-guides: ett artikelantal på en landningssida stämmer inte:')
    antalsfel.forEach((f) => console.error(f))
    console.error('  Rätta talet i content-filen — höj inte grinden.')
    process.exit(1)
  }
}

// Den interna länkningen. Rangordnas på relevans och lagas så att ingen guide
// blir en återvändsgränd — se lib/related.cjs för hur poängen sätts.
const { karta: relaterade, statistik: lankstat } = byggRelaterade(publicerade)

// Grind: en länk till en opublicerad slug är en 404 för läsaren och en mjuk
// 404 i Search Console. Samma princip som verktygssidornas kontroll nedan.
// Grinden fångar också guider utan inkommande länkar — sidor som bara går att
// nå via /guider/ hittas i praktiken inte alls.
const lankfel = validateRelaterade(relaterade, publiceradeSlugs)
if (lankfel.length) {
  console.error('prerender-guides: den interna länkningen håller inte:')
  lankfel.forEach((f) => console.error(`  - ${f}`))
  process.exit(1)
}

// Den omvända B2B-kopplingen (2026-09-15, mätt i Search Console).
//
// content/b2b.json säger vilka guider varje B2B-sida pekar PÅ. Kopplingen åt
// andra hållet fanns inte — och mätningen visade vad det kostade: de fyra
// guiderna bär 1 424 exponeringar, B2B-sidorna 6. /guider/sius-stod-vid-
// introduktion ligger på position 9,4 med 600 visningar, och en arbetsgivare
// som landar där har ingen väg till /for-arbetsgivare.
//
// Kartan HÄRLEDS ur samma fil som sidorna byggs av, så en ny B2B-sida får sin
// invit utan att någon rör mallen. En hårdkodad lista här hade blivit den
// drift grindarna i övrigt finns för att fånga.
const b2bInviter = new Map()
{
  // Egen sökväg: B2B_FILE deklareras längre ned i filen och ligger i sin
  // temporala dödzon här. Att flytta upp den hade spridit ut B2B-blocket.
  const b2bFil = path.join(CLIENT, 'content', 'b2b.json')
  const sidor = fs.existsSync(b2bFil) ? JSON.parse(fs.readFileSync(b2bFil, 'utf8')).sidor || [] : []
  for (const b of sidor) {
    if (!b.guideInvit || !b.guideInvitLank) continue
    for (const g of b.guider || []) {
      if (!b2bInviter.has(g)) b2bInviter.set(g, [])
      b2bInviter.get(g).push(b)
    }
  }
}

let skrivna = 0
for (const artikel of publicerade) {
  const dir = path.join(DIST, 'guider', artikel.slug)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    renderGuide(artikel, relaterade.get(artikel.slug) || [], b2bInviter.get(artikel.slug) || []),
    'utf8'
  )
  skrivna++
}

fs.writeFileSync(path.join(DIST, 'guider', 'index.html'), renderIndex(publicerade), 'utf8')

// K17: uppläsningsskriptet som egen fil. Identiskt på 161 sidor — inline
// kostade ~490 kB över bygget och krävde CSP:ns unsafe-inline. Som fil hämtas
// den en gång och cachas.
fs.copyFileSync(
  path.join(__dirname, 'lib', 'lyssna.client.js'),
  path.join(DIST, 'guider', 'lyssna.js')
)

// K15: ämnessidor under /guider/kategori/<slug>/.
//
// Grinden: en kategori i KATEGORIER som inte har någon publicerad artikel
// skulle bli en tom sida — alltså en mjuk 404 som vi själva länkar till.
// Hellre trasigt bygge än en tom sida i sitemapen.
let antalKategorier = 0
const tommaKategorier = []
for (const kat of KATEGORIER) {
  const iKat = publicerade.filter((a) => a.category_key === kat.key)
  if (!iKat.length) {
    tommaKategorier.push(kat.slug)
    continue
  }
  const dir = path.join(DIST, 'guider', 'kategori', kat.slug)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), renderKategori(kat, iKat, KATEGORIER), 'utf8')
  antalKategorier++
}
if (tommaKategorier.length) {
  console.error(
    `prerender-guides: kategorisidor utan publicerade artiklar: ${tommaKategorier.join(', ')}`
  )
  process.exit(1)
}

// Grinden åt andra hållet: en publicerad artikel vars kategori saknar
// ämnessida syns bara i den långa listan på /guider/. `easy-swedish` är det
// enda tillåtna undantaget — den har /guider/lattlast/ sedan K5.
const utanAmnessida = [
  ...new Set(
    publicerade
      .filter((a) => !KATEGORIER.some((k) => k.key === a.category_key))
      .map((a) => a.category_key)
  ),
].filter((k) => k !== 'easy-swedish')
if (utanAmnessida.length) {
  console.error(
    `prerender-guides: publicerade artiklar i kategorier utan ämnessida: ${utanAmnessida.join(', ')}. ` +
      'Lägg till dem i KATEGORIER i lib/guides.cjs.'
  )
  process.exit(1)
}

// K5: egen ingång för lättläst svenska.
const lattlast = publicerade.filter(arLattlast)
if (lattlast.length) {
  const dir = path.join(DIST, 'guider', 'lattlast')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), renderLattlast(lattlast), 'utf8')
}

// K6: publika landningssidor för verktygen.
const TOOLS_FILE = path.join(CLIENT, 'content', 'tools.json')
let antalVerktyg = 0
if (fs.existsSync(TOOLS_FILE)) {
  const { verktyg } = JSON.parse(fs.readFileSync(TOOLS_FILE, 'utf8'))
  const appRoutes = new Set(
    [...fs.readFileSync(APP_TSX, 'utf8').matchAll(/<Route\s+path="([^"]+)"/g)].map(
      (m) => '/' + m[1].replace(/^\//, '').replace(/\/\*$/, '')
    )
  )

  for (const t of verktyg) {
    // En CTA som pekar på en route som inte finns skickar besökaren till
    // startsidan — hellre trasigt bygge än tyst trasig knapp.
    if (!appRoutes.has(t.route)) {
      console.error(`prerender-guides: verktyget "${t.slug}" pekar på ${t.route} som saknar route i App.tsx.`)
      process.exit(1)
    }
    // Länkade guider måste vara publicerade, annars blir det en död länk.
    const saknade = (t.guider || []).filter((s) => !publiceradeSlugs.has(s))
    if (saknade.length) {
      console.error(
        `prerender-guides: verktyget "${t.slug}" länkar till opublicerade guider: ${saknade.join(', ')}`
      )
      process.exit(1)
    }

    const dir = path.join(DIST, 'verktyg', t.slug)
    fs.mkdirSync(dir, { recursive: true })
    const guider = (t.guider || []).map((s) => bySlug.get(s))
    fs.writeFileSync(path.join(dir, 'index.html'), renderTool(t, guider), 'utf8')
    antalVerktyg++
  }

  fs.writeFileSync(path.join(DIST, 'verktyg', 'index.html'), renderToolIndex(verktyg), 'utf8')
}

// K7/K16: B2B-landningssidorna för kommunala arbetsmarknadsenheter och
// Rusta-och-matcha-leverantörer. Samma gating som verktygssidorna (K6): en
// länkad guide måste vara publicerad, annars blir det en död länk vi själva
// pekat besökaren mot.
const B2B_FILE = path.join(CLIENT, 'content', 'b2b.json')
let antalB2B = 0
const b2bSlugs = []
if (fs.existsSync(B2B_FILE)) {
  const { sidor, demoSida } = JSON.parse(fs.readFileSync(B2B_FILE, 'utf8'))

  // BL1 (2026-09-20): demokontonas inloggningsuppgifter på egen noindex-sida.
  // Den ligger MED FLIT utanför sitemap.xml och b2bSlugs — sitemapen listar
  // det vi vill ska hittas, och det här är det enda vi inte vill.
  if (demoSida) {
    const demoDir = path.join(DIST, demoSida.slug)
    fs.mkdirSync(demoDir, { recursive: true })
    fs.writeFileSync(path.join(demoDir, 'index.html'), renderDemo(demoSida), 'utf8')
  }

  for (const b of sidor) {
    const saknade = (b.guider || []).filter((s) => !publiceradeSlugs.has(s))
    if (saknade.length) {
      console.error(
        `prerender-guides: B2B-sidan "${b.slug}" länkar till opublicerade guider: ${saknade.join(', ')}`
      )
      process.exit(1)
    }

    const dir = path.join(DIST, b.slug)
    fs.mkdirSync(dir, { recursive: true })
    const guider = (b.guider || []).map((s) => bySlug.get(s))
    fs.writeFileSync(path.join(dir, 'index.html'), renderB2B(b, guider), 'utf8')
    b2bSlugs.push(b.slug)
    antalB2B++
  }
}

// Spår K, omgång 7 (2026-09-15): situationssidorna under /for-dig-som/.
//
// Samma gating som verktygssidorna (K6) och B2B-sidorna (K7/K16), av samma
// skäl: en länk vi själva sätter dit och som pekar på ingenting är värre än
// ingen länk alls — den ser ut att fungera. Två kontroller till här, eftersom
// sidtypen korslänkar åt två håll:
//   · varje slug i `guider` måste vara publicerad
//   · varje slug i `verktyg` måste finnas i content/tools.json
const SITUATIONER_FILE = path.join(CLIENT, 'content', 'situationer.json')
let antalSituationer = 0
const situationSlugs = []
if (fs.existsSync(SITUATIONER_FILE)) {
  const { sidor } = JSON.parse(fs.readFileSync(SITUATIONER_FILE, 'utf8'))

  // Verktygsregistret läses om här i stället för att återanvända variabeln
  // ovan: verktygsblocket är villkorat av att tools.json finns, och en tyst
  // `undefined` hade gjort kontrollen nedan till en no-op i stället för en
  // grind. En vakt som inte kan falla är ingen vakt.
  const verktygRegister = new Map(
    fs.existsSync(TOOLS_FILE)
      ? JSON.parse(fs.readFileSync(TOOLS_FILE, 'utf8')).verktyg.map((t) => [t.slug, t])
      : []
  )

  // `index` skulle skriva över samlingssidan tyst — samma fälla som RESERVERADE
  // vaktar för guiderna.
  const reserverade = sidor.filter((s) => s.slug === 'index')
  if (reserverade.length) {
    console.error('prerender-guides: situationssida med reserverad slug "index".')
    process.exit(1)
  }

  for (const s of sidor) {
    const saknadeGuider = (s.guider || []).filter((g) => !publiceradeSlugs.has(g))
    if (saknadeGuider.length) {
      console.error(
        `prerender-guides: situationssidan "${s.slug}" länkar till opublicerade guider: ${saknadeGuider.join(', ')}`
      )
      process.exit(1)
    }
    const saknadeVerktyg = (s.verktyg || []).filter((v) => !verktygRegister.has(v))
    if (saknadeVerktyg.length) {
      console.error(
        `prerender-guides: situationssidan "${s.slug}" pekar på verktyg som inte finns i content/tools.json: ${saknadeVerktyg.join(', ')}`
      )
      process.exit(1)
    }

    const dir = path.join(DIST, 'for-dig-som', s.slug)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(
      path.join(dir, 'index.html'),
      renderSituation(
        s,
        (s.verktyg || []).map((v) => verktygRegister.get(v)),
        (s.guider || []).map((g) => bySlug.get(g))
      ),
      'utf8'
    )
    situationSlugs.push(s.slug)
    antalSituationer++
  }

  if (antalSituationer) {
    fs.writeFileSync(
      path.join(DIST, 'for-dig-som', 'index.html'),
      renderSituationIndex(sidor),
      'utf8'
    )
  }
}

// KM12 (9), 2026-09-12: om oss-sidan. En sida, ingen guide-gating (den länkar
// bara till B2B-sidorna, /#/-rutter och mailto).
const OM_OSS_FILE = path.join(CLIENT, 'content', 'om-oss.json')
let antalOmOss = 0
if (fs.existsSync(OM_OSS_FILE)) {
  const o = JSON.parse(fs.readFileSync(OM_OSS_FILE, 'utf8'))
  const dir = path.join(DIST, o.slug)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), renderOmOss(o), 'utf8')
  antalOmOss = 1
}

const totalKb = Math.round(
  publicerade.reduce(
    (n, a) => n + fs.statSync(path.join(DIST, 'guider', a.slug, 'index.html')).size,
    0
  ) / 1024
)

// K12: startsidan länkar numera till de publika sidorna. En sådan länk kan
// ruttna tyst — sluggen byter namn, kategorin tas bort — och resultatet blir
// en mjuk 404 som vi själva pekar besökaren mot. Grinden kontrollerar att
// varje /guider/-, /verktyg/- och B2B-länk i Landing.tsx motsvarar en sida som
// just genererats. Den läser dist/, inte källkoden, så den mäter utfallet.
//
// K7/K16: prefixlistan byggs ur b2bSlugs i stället för att hårdkodas här —
// annars glider grinden och content/b2b.json isär tyst den dag en tredje
// B2B-sida läggs till.
const LANDING = path.join(CLIENT, 'src', 'pages', 'Landing.tsx')
if (fs.existsSync(LANDING)) {
  // 'for-dig-som' står ovillkorligt i listan, inte bakom `antalSituationer`.
    // Villkorat hade grinden tystnat exakt när den behövdes: saknas
    // content/situationer.json genereras ingen sida, och då är startsidans länk
    // dit en mjuk 404 — men prefixet hade utelämnats och länken aldrig prövats.
    // En vakt som slutar titta när målet försvinner är ingen vakt.
    const prefix = ['guider', 'verktyg', 'for-dig-som', ...b2bSlugs].join('|')
  const hrefRe = new RegExp(`href="(\\/(?:${prefix})[^"]*)"`, 'g')
  const linkRe = new RegExp(`<Link\\s+to="(\\/(?:${prefix})[^"]*)"`, 'g')

  // Kommentarerna strippas först. Utan det matchade grinden sin egen
  // dokumentation — kommentaren som förklarar varför <Link to="/guider/"> är
  // fel innehåller ju strängen. En vakt som inte skiljer omnämnande från
  // förekomst larmar på texten som beskriver den.
  const landingSrc = fs
    .readFileSync(LANDING, 'utf8')
    .replace(/\/\*[^]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
  const publikaLankar = [...new Set([...landingSrc.matchAll(hrefRe)].map((m) => m[1]))]
  const doda = publikaLankar.filter(
    (l) => !fs.existsSync(path.join(DIST, l.replace(/^\//, ''), 'index.html'))
  )
  if (doda.length) {
    console.error(
      `prerender-guides: Landing.tsx länkar till sidor som inte genererats: ${doda.join(', ')}`
    )
    process.exit(1)
  }
  // En <Link to="/guider/…"> hade blivit #/guider/… under HashRouter och
  // skickat besökaren till startsidan. Den formen får inte smyga in igen.
  const felaktigaLink = [...landingSrc.matchAll(linkRe)].map((m) => m[1])
  if (felaktigaLink.length) {
    console.error(
      `prerender-guides: Landing.tsx använder <Link to=…> för prerenderade sidor ` +
        `(${felaktigaLink.join(', ')}) — HashRouter gör dem till #-länkar. Använd <a href>.`
    )
    process.exit(1)
  }
  console.log(
    `   Startsidan: ${publikaLankar.length} publika länkar, alla motsvarar genererade sidor.`
  )
}

console.log(
  `prerender-guides: ${skrivna} guidesidor + /guider/ + ${antalKategorier} ämnessidor + ` +
    `${antalVerktyg} verktygssidor + ${antalSituationer} situationssidor + ` +
    `${antalB2B} B2B-sidor + ${antalOmOss} om oss-sida skrivna ` +
    `(${totalKb} kB guider), ${antalRoutes} routes validerade, ` +
    `${snapshot.count - skrivna} artiklar ännu opublicerade.`
)

// SE3 (2026-08-17): titellängd.
//
// Mallen la tidigare på " — Jobin" utan längdkontroll; 48 av 162 titlar
// passerade 60 tecken och kapades i sökresultatet — ofta just det ord som
// skiljer artikeln från sitt syskon. `sidtitel()` släpper nu suffixet när det
// inte får plats, vilket löser fallet automatiskt.
//
// Kvar är de titlar som är för långa ÄVEN utan varumärke. Dem kan bara en
// människa korta, så bygget rapporterar dem i stället för att tysta dem —
// och fäller inte, eftersom en redaktionell omskrivning inte ska blockera en
// deploy. Går listan mot noll kan det här bli en grind.
{
  const langa = publicerade
    .filter((a) => titelForLang(a.title))
    .map((a) => ({ slug: a.slug, langd: a.title.trim().length }))
    .sort((x, y) => y.langd - x.langd)

  if (langa.length === 0) {
    console.log(`   Titlar: alla ≤ ${TITEL_MAX} tecken med varumärke.`)
  } else {
    console.log(
      `   Titlar: ${langa.length} av ${publicerade.length} är längre än ${TITEL_MAX} tecken även utan " — Jobin" ` +
        `och kapas i Google. Korta dem redaktionellt, sökordet först:`
    )
    for (const l of langa.slice(0, 8)) {
      console.log(`     ${String(l.langd).padStart(3)} tecken  /guider/${l.slug}/`)
    }
    if (langa.length > 8) console.log(`     … och ${langa.length - 8} till.`)
  }
}
console.log(
  `   Intern länkning: ${lankstat.antalLankar} länkar (${lankstat.snittPerSida.toFixed(1)}/sida), ` +
    `${lankstat.utanInlankarFore.length} guide(r) utan inlänkar efter rangordningen ` +
    `→ ${lankstat.reparerade} lagade → ${lankstat.utanInlankarEfter.length} kvar.`
)
if (lankstat.svagaReparationer.length) {
  console.log(
    `   ⚠ svag koppling (bäst tillgängliga värd): ${lankstat.svagaReparationer.join(', ')}`
  )
}
console.log(`   Exempel: ${guideUrl(publicerade[0].slug)}`)
