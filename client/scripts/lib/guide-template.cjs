/**
 * HTML-mallen för guidesidorna.  (spår K2, 2026-08-05)
 *
 * Sidorna är INGÅNGSPORTAR till Jobin, inte artikelkopior (beslut Mikael
 * 2026-08-05). Strukturen är därför byggd för att leda vidare:
 *   topbar-CTA → hero med löfte → tidig verktygsruta → innehållet →
 *   verktygskort → avslutande CTA → relaterade guider
 *
 * Två saker den medvetet INTE gör:
 *   - Ingen påhittad statistik, inga uppdiktade omdömen. Innehållet vänder
 *     sig till människor i utsatt läge; falska siffror vore både fel och en
 *     Helpful-Content-risk.
 *   - Ingen skrikig reklamröst. DESIGN.md §2 slår fast "lugn vän", aldrig
 *     prestationsspråk mot deltagare. Säljande STRUKTUR, portalens RÖST.
 *
 * Tekniskt: självbärande HTML, ingen JS, inga externa anrop (CSP:n tillåter
 * dem inte ändå). Ljust och mörkt läge via prefers-color-scheme, tokens
 * hämtade ur src/styles/tokens.css (info/sky = Resurser-hubben).
 */

const { markdownToHtml, markdownToPlain, escapeHtml } = require('./markdown.cjs')
const { SITE, TOOLS, KATEGORI_NAMN, KATEGORIER, kategoriUrl, appUrl, verktygFor, guideUrl } =
  require('./guides.cjs')

const CSS = `
:root{
  --bg:#fff;--fg:#2C2C2A;--muted:#6A6864;--line:#DDD9D0;--soft:#F5F4F0;
  --c-bg:#ECF4FA;--c-accent:#C8DEEF;--c-solid:#266DA0;--c-text:#1F5985;
}
@media (prefers-color-scheme:dark){
  :root{--bg:#1a1917;--fg:#EDEBE6;--muted:#A9A69F;--line:#3A3833;--soft:#232220;
    --c-bg:#112536;--c-accent:#2A4F70;--c-solid:#6EB1E0;--c-text:#B5D8F0;}
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);
  font:400 1.0625rem/1.7 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}
.wrap{max-width:44rem;margin:0 auto;padding:0 1.25rem}
a{color:var(--c-solid)}
img{max-width:100%;height:auto}

.topbar{border-bottom:1px solid var(--line);background:var(--bg);position:sticky;top:0;z-index:5}
.topbar .wrap{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding-block:.75rem}
.brand{font-weight:700;font-size:1.1rem;color:var(--fg);text-decoration:none;letter-spacing:-.01em}
.btn{display:inline-block;background:var(--c-solid);color:#fff;text-decoration:none;
  padding:.7rem 1.15rem;border-radius:.6rem;font-weight:600;font-size:.95rem;line-height:1.2;
  border:2px solid transparent}
.btn:hover{filter:brightness(1.08)}
.btn:focus-visible,a:focus-visible{outline:3px solid var(--c-solid);outline-offset:2px}
.btn-ghost{background:transparent;color:var(--c-solid);border-color:var(--c-accent)}
.btn-sm{padding:.5rem .9rem;font-size:.875rem}

.hero{background:var(--c-bg);border-bottom:1px solid var(--c-accent);padding:2.5rem 0 2.25rem}
.crumb{font-size:.85rem;color:var(--c-text);margin-bottom:.9rem}
.crumb a{color:var(--c-text)}
h1{font-size:clamp(1.75rem,5vw,2.4rem);line-height:1.2;margin:0 0 .75rem;letter-spacing:-.02em}
.lead{font-size:1.15rem;color:var(--fg);margin:0 0 1.25rem;opacity:.9}
.facts{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.5rem;font-size:.85rem}
.chip{background:var(--bg);border:1px solid var(--c-accent);color:var(--c-text);
  padding:.25rem .7rem;border-radius:999px}

main{padding:2.25rem 0 1rem}
h2{font-size:1.45rem;line-height:1.3;margin:2.25rem 0 .75rem;letter-spacing:-.01em}
h3{font-size:1.15rem;margin:1.75rem 0 .5rem}
h4{font-size:1.02rem;margin:1.25rem 0 .5rem}
p{margin:0 0 1.1rem}
ul,ol{margin:0 0 1.2rem;padding-left:1.4rem}
li{margin-bottom:.45rem}
blockquote{margin:1.5rem 0;padding:.25rem 0 .25rem 1.1rem;border-left:4px solid var(--c-solid);
  color:var(--muted);font-style:italic}
code{background:var(--soft);padding:.1rem .35rem;border-radius:.25rem;font-size:.9em}
pre{background:var(--soft);padding:1rem;border-radius:.6rem;overflow-x:auto}
pre code{background:none;padding:0}
.table-wrap{overflow-x:auto;margin:0 0 1.4rem;border:1px solid var(--line);border-radius:.6rem}
table{border-collapse:collapse;width:100%;font-size:.95rem}
th,td{padding:.6rem .8rem;text-align:left;border-bottom:1px solid var(--line)}
th{background:var(--soft);font-weight:600}
tr:last-child td{border-bottom:none}

.cta{background:var(--c-bg);border:1px solid var(--c-accent);border-radius:.9rem;
  padding:1.4rem 1.35rem;margin:2rem 0}
.cta h2,.cta h3{margin-top:0}
.cta p{margin-bottom:1rem;color:var(--fg)}
.cta-early{margin:0 0 2rem}
.tools{display:grid;gap:.85rem;margin:1.25rem 0 0}
@media(min-width:34rem){.tools{grid-template-columns:1fr 1fr}}
.tool{display:block;background:var(--bg);border:1px solid var(--c-accent);border-radius:.7rem;
  padding:1rem 1.1rem;text-decoration:none;color:var(--fg)}
.tool:hover{border-color:var(--c-solid)}
.tool strong{display:block;color:var(--c-solid);margin-bottom:.25rem;font-size:1rem}
.tool span{font-size:.9rem;color:var(--muted);line-height:1.5}

.checklist{list-style:none;padding:0}
.checklist li{padding-left:1.9rem;position:relative}
.checklist li::before{content:"";position:absolute;left:0;top:.45rem;width:1.05rem;height:1.05rem;
  border:2px solid var(--c-solid);border-radius:.25rem}

.related{border-top:1px solid var(--line);margin-top:2.5rem;padding-top:1.75rem}
.related ul{list-style:none;padding:0;margin:0}
.related li{margin-bottom:1rem}
.related a{font-weight:600;text-decoration-thickness:1px;text-underline-offset:2px}
.related .meta{display:block;color:var(--muted);font-size:.9rem;line-height:1.5;margin-top:.15rem}
.related .intro{color:var(--muted);font-size:.95rem;margin:-.25rem 0 1.1rem}

footer{border-top:1px solid var(--line);margin-top:3rem;padding:1.75rem 0 2.5rem;
  font-size:.9rem;color:var(--muted)}
footer a{color:var(--muted)}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
  clip:rect(0 0 0 0);white-space:nowrap;border:0}
/* F18 (2026-08-09): skip-länken fanns men blev ALDRIG synlig — .sr-only saknade
   :focus-regel, så clip:rect(0 0 0 0) satt kvar även med fokus. Samma bugg som i
   appens accessibility.css, andra instansen. WCAG 2.4.1 kräver att bypass-länken
   går att se när den fokuseras; en osynlig skip-länk hjälper bara skärmläsare. */
.sr-only:focus{position:fixed;top:0;left:0;z-index:9999;width:auto;height:auto;
  margin:0;padding:12px 20px;overflow:visible;clip:auto;white-space:normal;
  background:var(--c-solid,#266DA0);color:#fff;font-weight:600;
  border-radius:0 0 8px 0;outline:2px solid #fff;outline-offset:-4px}
`

const SVARIGHET = {
  'easy-swedish': 'Lätt svenska',
  easy: 'Lätt att läsa',
  medium: 'Normal',
  detailed: 'Fördjupning',
}

function verktygskort(routes) {
  return routes
    .map((r) => {
      const t = TOOLS[r]
      return `<a class="tool" href="${appUrl(r)}"><strong>${escapeHtml(t.namn)}</strong><span>${escapeHtml(t.text)}</span></a>`
    })
    .join('')
}

/** Kortar en text vid ordgräns, så att raden inte slutar mitt i ett ord. */
function korta(text, max) {
  const t = String(text || '').trim()
  if (t.length <= max) return t
  const kap = t.slice(0, max)
  const brytpunkt = kap.lastIndexOf(' ')
  return `${(brytpunkt > max * 0.6 ? kap.slice(0, brytpunkt) : kap).replace(/[\s,.;:–—-]+$/, '')}…`
}

/**
 * En post under "Läs vidare".
 *
 * Länktexten är ALLTID artikelns titel — aldrig "läs mer". Dels för att en
 * skärmläsare läser upp länklistan utan omgivande text, dels för att titeln är
 * den enda information som säger om det är värt orken att klicka. Sammanfattning
 * och lästid ligger utanför länken: de hjälper valet, men ska inte läsas upp som
 * en del av länknamnet.
 */
function relateradPost(r) {
  const detaljer = [
    r.summary ? escapeHtml(korta(r.summary, 105)) : '',
    r.reading_time ? `${r.reading_time} min` : '',
  ].filter(Boolean)

  return (
    `<li><a href="${guideUrl(r.slug)}">${escapeHtml(r.title)}</a>` +
    (detaljer.length ? `<span class="meta">${detaljer.join(' · ')}</span>` : '') +
    `</li>`
  )
}

/**
 * @param {object} a artikel ur snapshoten
 * @param {object[]} relaterade artiklar som också är publicerade
 */
function renderGuide(a, relaterade) {
  const url = `${SITE}${guideUrl(a.slug)}`
  const kategori = KATEGORI_NAMN[a.category_key] || 'Guide'
  const verktyg = verktygFor(a)
  const primart = verktyg[0]
  const body = markdownToHtml(a.content)

  // Beskrivningen tas ur summary; faller tillbaka på inledningen om den saknas.
  const beskrivning = (a.summary || markdownToPlain(a.content).slice(0, 160)).trim().slice(0, 160)

  const checklista =
    Array.isArray(a.checklist) && a.checklist.length
      ? `<h2>Checklista</h2><ul class="checklist">${a.checklist
          .map((c) => `<li>${escapeHtml(typeof c === 'string' ? c : c.text || '')}</li>`)
          .join('')}</ul>`
      : ''

  const relateradeHtml = relaterade.length
    ? `<nav class="related" aria-labelledby="rel"><h2 id="rel">Läs vidare</h2>` +
      `<p class="intro">Guider som hör ihop med den här — välj den som känns närmast där du är nu.</p>` +
      `<ul>${relaterade.map(relateradPost).join('')}</ul></nav>`
    : ''

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: a.title,
        description: beskrivning,
        inLanguage: 'sv-SE',
        mainEntityOfPage: url,
        datePublished: (a.updated_at || '').slice(0, 10) || undefined,
        dateModified: (a.updated_at || '').slice(0, 10) || undefined,
        author: { '@type': 'Organization', name: 'Jobin' },
        publisher: { '@type': 'Organization', name: 'Jobin', url: SITE },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Jobin', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Guider', item: `${SITE}/guider/` },
          { '@type': 'ListItem', position: 3, name: a.title, item: url },
        ],
      },
    ],
  }

  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(a.title)} — Jobin</title>
<meta name="description" content="${escapeHtml(beskrivning)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Jobin">
<meta property="og:locale" content="sv_SE">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${escapeHtml(a.title)}">
<meta property="og:description" content="${escapeHtml(beskrivning)}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/favicon-64.png">
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<a class="sr-only" href="#innehall">Hoppa till innehållet</a>

<header class="topbar">
  <div class="wrap">
    <a class="brand" href="/">Jobin</a>
    <a class="btn btn-sm" href="${appUrl('/oversikt')}">Öppna Jobin</a>
  </div>
</header>

<div class="hero">
  <div class="wrap">
    <nav class="crumb" aria-label="Brödsmulor">
      <a href="/">Jobin</a> › <a href="/guider/">Guider</a> › ${escapeHtml(kategori)}
    </nav>
    <h1>${escapeHtml(a.title)}</h1>
    ${a.summary ? `<p class="lead">${escapeHtml(a.summary)}</p>` : ''}
    <div class="facts">
      ${a.reading_time ? `<span class="chip">${a.reading_time} min läsning</span>` : ''}
      ${a.difficulty && SVARIGHET[a.difficulty] ? `<span class="chip">${SVARIGHET[a.difficulty]}</span>` : ''}
      <span class="chip">Gratis</span>
    </div>
    <a class="btn" href="${appUrl(primart)}">${escapeHtml(TOOLS[primart].namn)} — kom igång</a>
  </div>
</div>

<main id="innehall">
  <div class="wrap">

    <aside class="cta cta-early">
      <h2>Du behöver inte göra det här ensam</h2>
      <p>Jobin är en kostnadsfri portal där du får hjälp hela vägen — från att sätta ord på vad du kan, till att skicka ansökan. Läs guiden här, och gör det skarpt i portalen.</p>
      <a class="btn" href="${appUrl(primart)}">${escapeHtml(TOOLS[primart].namn)}</a>
      <a class="btn btn-ghost" href="${appUrl('/oversikt')}">Se allt som ingår</a>
    </aside>

    ${body}

    ${checklista}

    <section class="cta">
      <h2>Gör det här i Jobin</h2>
      <p>Verktygen nedan hör ihop med den här guiden. De är gratis och du kommer igång direkt.</p>
      <div class="tools">${verktygskort(verktyg.length > 1 ? verktyg : [primart, '/knowledge-base'].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 2))}</div>
    </section>

    ${relateradeHtml}
  </div>
</main>

<footer>
  <div class="wrap">
    <p><strong>Jobin</strong> — stöd och verktyg för dig som söker jobb.
    <a href="${appUrl('/oversikt')}">Öppna portalen</a> · <a href="/guider/">Alla guider</a></p>
    <p><a href="/#/privacy">Integritet</a> · <a href="/#/tillganglighet">Tillgänglighet</a></p>
  </div>
</footer>
</body>
</html>
`
}

/** Ingångssidan /guider/ — samlar guiderna och ger crawlern en väg in. */
function renderIndex(artiklar) {
  const url = `${SITE}/guider/`
  const grupper = {}
  artiklar.forEach((a) => {
    const k = KATEGORI_NAMN[a.category_key] || 'Övrigt'
    ;(grupper[k] = grupper[k] || []).push(a)
  })

  // Rubriken länkar till ämnessidan (K15). Ordningen följer KATEGORIER så att
  // index och ämnessidor presenterar samma värld i samma följd; kategorier
  // utan egen sida (lättläst har /guider/lattlast/) hamnar sist utan länk.
  const kategoriPerNamn = new Map(KATEGORIER.map((k) => [KATEGORI_NAMN[k.key] || k.rubrik, k]))
  const ordnade = [
    ...KATEGORIER.map((k) => KATEGORI_NAMN[k.key] || k.rubrik).filter((n) => grupper[n]),
    ...Object.keys(grupper).filter((n) => !kategoriPerNamn.has(n)),
  ]

  const amnesnav =
    `<nav aria-label="Ämnen"><p>Hoppa till ett ämne: ` +
    KATEGORIER.filter((k) => grupper[KATEGORI_NAMN[k.key] || k.rubrik])
      .map((k) => `<a href="${kategoriUrl(k.slug)}">${escapeHtml(k.rubrik)}</a>`)
      .join(' · ') +
    ` · <a href="/guider/lattlast/">Lätt svenska</a></p></nav>`

  const sektioner = ordnade
    .map((namn) => {
      const list = grupper[namn]
      const kat = kategoriPerNamn.get(namn)
      const rubrik = kat
        ? `<h2><a href="${kategoriUrl(kat.slug)}">${escapeHtml(kat.rubrik)}</a></h2>`
        : `<h2>${escapeHtml(namn)}</h2>`
      return `${rubrik}<ul>${list
        .map(
          (a) =>
            `<li><a href="${guideUrl(a.slug)}">${escapeHtml(a.title)}</a>${
              a.summary ? ` — <span style="color:var(--muted)">${escapeHtml(a.summary.slice(0, 110))}</span>` : ''
            }</li>`
        )
        .join('')}</ul>`
    })
    .join('')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Guider för dig som söker jobb',
    inLanguage: 'sv-SE',
    url,
  }

  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Guider för dig som söker jobb — Jobin</title>
<meta name="description" content="Konkreta guider om CV, personligt brev, intervju och att orka söka jobb. Gratis, på svenska — flera även i lätt svenska.">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="Guider för dig som söker jobb — Jobin">
<meta property="og:description" content="Konkreta guider om CV, personligt brev, intervju och att orka söka jobb.">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/favicon-64.png">
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<a class="sr-only" href="#innehall">Hoppa till innehållet</a>
<header class="topbar">
  <div class="wrap">
    <a class="brand" href="/">Jobin</a>
    <a class="btn btn-sm" href="${appUrl('/oversikt')}">Öppna Jobin</a>
  </div>
</header>

<div class="hero">
  <div class="wrap">
    <h1>Guider för dig som söker jobb</h1>
    <p class="lead">Konkret hjälp, skriven för att vara lätt att ta till sig — även en dag när orken är låg. Allt är gratis.</p>
    <a class="btn" href="${appUrl('/oversikt')}">Kom igång i Jobin</a>
  </div>
</div>

<main>
  <div class="wrap">
    ${amnesnav}
    ${sektioner}
    <section class="cta">
      <h2>Vill du göra det på riktigt?</h2>
      <p>I Jobin bygger du CV, skriver personligt brev och övar inför intervjun — med stöd hela vägen.</p>
      <div class="tools">${verktygskort(['/cv', '/cover-letter'])}</div>
    </section>
  </div>
</main>

<footer>
  <div class="wrap">
    <p><strong>Jobin</strong> — stöd och verktyg för dig som söker jobb. <a href="${appUrl('/oversikt')}">Öppna portalen</a></p>
  </div>
</footer>
</body>
</html>
`
}

/**
 * /guider/lattlast/ — egen ingång för lättläst svenska.  (spår K5)
 *
 * Texten på den här sidan är själv skriven på lättläst: korta meningar, en
 * tanke per rad, inga inskjutna bisatser. Det vore motsägelsefullt att
 * beskriva lättläst material i krånglig text.
 */
function renderLattlast(artiklar) {
  const url = `${SITE}/guider/lattlast/`

  const lista = artiklar
    .map(
      (a) =>
        `<li><a href="${guideUrl(a.slug)}">${escapeHtml(a.title)}</a>${
          a.reading_time ? ` <span style="color:var(--muted)">(${a.reading_time} min)</span>` : ''
        }</li>`
    )
    .join('')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Söka jobb — på lätt svenska',
    inLanguage: 'sv-SE',
    url,
  }

  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Söka jobb på lätt svenska — Jobin</title>
<meta name="description" content="Guider om CV, jobb och intervju på lätt svenska. Korta texter med enkla ord. Gratis att läsa.">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="Söka jobb på lätt svenska — Jobin">
<meta property="og:description" content="Guider om CV, jobb och intervju på lätt svenska. Korta texter med enkla ord.">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/favicon-64.png">
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<a class="sr-only" href="#innehall">Hoppa till innehållet</a>
<header class="topbar">
  <div class="wrap">
    <a class="brand" href="/">Jobin</a>
    <a class="btn btn-sm" href="${appUrl('/oversikt')}">Öppna Jobin</a>
  </div>
</header>

<div class="hero">
  <div class="wrap">
    <nav class="crumb" aria-label="Brödsmulor">
      <a href="/">Jobin</a> › <a href="/guider/">Guider</a> › Lätt svenska
    </nav>
    <h1>Söka jobb — på lätt svenska</h1>
    <p class="lead">Här är texter med enkla ord och korta meningar.
    De handlar om CV, jobb och intervju. Allt är gratis.</p>
    <a class="btn" href="${appUrl('/cv')}">Börja med ditt CV</a>
  </div>
</div>

<main>
  <div class="wrap">
    <h2>Texter på lätt svenska</h2>
    <ul>${lista}</ul>

    <section class="cta">
      <h2>Du kan få hjälp</h2>
      <p>I Jobin gör du ditt CV steg för steg.
      Du får hjälp med orden. Det kostar ingenting.</p>
      <div class="tools">${verktygskort(['/cv', '/interview-simulator'])}</div>
    </section>

    <p><a href="/guider/">Se alla guider</a></p>
  </div>
</main>

<footer>
  <div class="wrap">
    <p><strong>Jobin</strong> — hjälp för dig som söker jobb. <a href="${appUrl('/oversikt')}">Öppna Jobin</a></p>
  </div>
</footer>
</body>
</html>
`
}

/**
 * /guider/kategori/<slug>/ — ämnessida.  (spår K15, 2026-08-12)
 *
 * Varför de finns: guideindexet var en enda lista på 161 rader. Den som söker
 * på ett ämne fick skrolla igenom allt annat, och Google fick en enda sida att
 * förstå ett helt ämnesområde ifrån. Elva ämnessidor ger både navigering och
 * elva nya indexerbara sidor — datat (`category_key`) fanns redan.
 *
 * Två saker den medvetet INTE gör:
 *   - Ingen sida för `easy-swedish`. Den har /guider/lattlast/ sedan K5, och
 *     en andra sida över samma artiklar hade konkurrerat med den (K14).
 *   - Ingen primär CTA in i appen. Appens routes är skyddade och en gäst
 *     dumpas tyst på startsidan (K11), så vägen vidare går till en publik
 *     /verktyg/-sida i stället.
 *
 * Sorteringen sätter längre texter först inom varje svårighetsnivå — den som
 * landar på ämnessidan vill oftast ha genomgången, inte checklistan.
 */
function renderKategori(kat, artiklar, syskon) {
  const url = `${SITE}${kategoriUrl(kat.slug)}`

  const ordning = { detailed: 0, medium: 1, easy: 2, 'easy-swedish': 3 }
  const sorterade = [...artiklar].sort(
    (a, b) =>
      (ordning[a.difficulty] ?? 9) - (ordning[b.difficulty] ?? 9) ||
      (b.content || '').length - (a.content || '').length
  )

  const lista = sorterade
    .map(
      (a) =>
        `<li><a href="${guideUrl(a.slug)}">${escapeHtml(a.title)}</a>${
          a.reading_time ? ` <span style="color:var(--muted)">(${a.reading_time} min)</span>` : ''
        }${a.summary ? `<br><span style="color:var(--muted)">${escapeHtml(korta(a.summary, 120))}</span>` : ''}</li>`
    )
    .join('')

  const andraAmnen = syskon
    .filter((k) => k.slug !== kat.slug)
    .map((k) => `<li><a href="${kategoriUrl(k.slug)}">${escapeHtml(k.rubrik)}</a></li>`)
    .join('')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: kat.rubrik,
    description: kat.lead,
    inLanguage: 'sv-SE',
    url,
    hasPart: sorterade.map((a) => ({
      '@type': 'Article',
      headline: a.title,
      url: `${SITE}${guideUrl(a.slug)}`,
    })),
  }
  const brodsmula = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Jobin', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Guider', item: `${SITE}/guider/` },
      { '@type': 'ListItem', position: 3, name: kat.rubrik, item: url },
    ],
  }

  const beskrivning = korta(`${kat.lead} ${artiklar.length} guider, gratis att läsa.`, 155)

  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(kat.rubrik)} — guider — Jobin</title>
<meta name="description" content="${escapeHtml(beskrivning)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${escapeHtml(kat.rubrik)} — guider — Jobin">
<meta property="og:description" content="${escapeHtml(beskrivning)}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/favicon-64.png">
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(brodsmula)}</script>
</head>
<body>
<a class="sr-only" href="#innehall">Hoppa till innehållet</a>
<header class="topbar">
  <div class="wrap">
    <a class="brand" href="/">Jobin</a>
    <a class="btn btn-sm" href="/verktyg/">Se verktygen</a>
  </div>
</header>

<div class="hero">
  <div class="wrap">
    <nav class="crumb" aria-label="Brödsmulor">
      <a href="/">Jobin</a> › <a href="/guider/">Guider</a> › ${escapeHtml(kat.rubrik)}
    </nav>
    <h1>${escapeHtml(kat.rubrik)}</h1>
    <p class="lead">${escapeHtml(kat.lead)}</p>
    <a class="btn" href="${kat.verktygssida}">Se vad du kan få hjälp med</a>
  </div>
</div>

<main id="innehall">
  <div class="wrap">
    <h2>${artiklar.length} guider om ${escapeHtml(kat.rubrik.toLowerCase())}</h2>
    <ul>${lista}</ul>

    <h2>Andra ämnen</h2>
    <ul>${andraAmnen}
      <li><a href="/guider/lattlast/">Lätt svenska</a></li>
    </ul>

    <p><a href="/guider/">Alla guider</a></p>
  </div>
</main>

<footer>
  <div class="wrap">
    <p><strong>Jobin</strong> — hjälp för dig som söker jobb. <a href="${appUrl('/oversikt')}">Öppna Jobin</a></p>
  </div>
</footer>
</body>
</html>
`
}

/**
 * /verktyg/<slug>/ — publik landningssida för ett verktyg.  (spår K6)
 *
 * Skillnaden mot en guidesida: den här ska konvertera. Strukturen är
 * hero → så funkar det → vad du får → för vem → FAQ → relaterade guider →
 * avslutande CTA, med FAQPage-JSON-LD eftersom frågorna är verkliga frågor
 * och inte utfyllnad.
 *
 * Vad den INTE gör: hittar på social bevisning. Inga användarsiffror, inga
 * omdömen, inga betyg. Varje påstående om vad verktyget kan är kontrollerat
 * mot koden — se kommentaren i content/tools.json.
 */
function renderTool(t, guider) {
  const url = `${SITE}/verktyg/${t.slug}/`
  const appLank = appUrl(t.route)

  const steg = t.steg
    .map(
      ([rubrik, text], i) =>
        `<h2><span aria-hidden="true">${i + 1}. </span>${escapeHtml(rubrik)}</h2><p>${escapeHtml(text)}</p>`
    )
    .join('')

  const punkter = t.punkter.map((p) => `<li>${escapeHtml(p)}</li>`).join('')

  const faq = t.faq
    .map(([f, s]) => `<h3>${escapeHtml(f)}</h3><p>${escapeHtml(s)}</p>`)
    .join('')

  const relaterade = guider.length
    ? `<nav class="related" aria-labelledby="rel"><h2 id="rel">Läs mer först</h2><ul>${guider
        .map(relateradPost)
        .join('')}</ul></nav>`
    : ''

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: `Jobin — ${t.h1}`,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        inLanguage: 'sv-SE',
        url,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'SEK' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: t.faq.map(([f, s]) => ({
          '@type': 'Question',
          name: f,
          acceptedAnswer: { '@type': 'Answer', text: s },
        })),
      },
    ],
  }

  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(t.title)} — Jobin</title>
<meta name="description" content="${escapeHtml(t.description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Jobin">
<meta property="og:locale" content="sv_SE">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${escapeHtml(t.title)}">
<meta property="og:description" content="${escapeHtml(t.description)}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/favicon-64.png">
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<a class="sr-only" href="#innehall">Hoppa till innehållet</a>

<header class="topbar">
  <div class="wrap">
    <a class="brand" href="/">Jobin</a>
    <a class="btn btn-sm" href="${appLank}">Öppna verktyget</a>
  </div>
</header>

<div class="hero">
  <div class="wrap">
    <nav class="crumb" aria-label="Brödsmulor">
      <a href="/">Jobin</a> › <a href="/verktyg/">Verktyg</a>
    </nav>
    <h1>${escapeHtml(t.h1)}</h1>
    <p class="lead">${escapeHtml(t.lead)}</p>
    <div class="facts">
      <span class="chip">Gratis</span>
      <span class="chip">På svenska</span>
      <span class="chip">Inget att installera</span>
    </div>
    <a class="btn" href="${appLank}">Kom igång</a>
  </div>
</div>

<main id="innehall">
  <div class="wrap">
    ${steg}

    <section class="cta">
      <h2>Det här ingår</h2>
      <ul>${punkter}</ul>
      <a class="btn" href="${appLank}">Öppna verktyget</a>
    </section>

    <h2>Vem passar det för?</h2>
    <p>${escapeHtml(t.for)}</p>

    <h2>Vanliga frågor</h2>
    ${faq}

    ${relaterade}

    <section class="cta">
      <h2>Redo att börja?</h2>
      <p>Jobin är kostnadsfritt. Du skapar ett konto med din e-post och kommer igång direkt — allt du gör sparas så att du kan fortsätta när du orkar.</p>
      <a class="btn" href="${appLank}">Kom igång nu</a>
      <a class="btn btn-ghost" href="${appUrl('/oversikt')}">Se allt som ingår</a>
    </section>
  </div>
</main>

<footer>
  <div class="wrap">
    <p><strong>Jobin</strong> — stöd och verktyg för dig som söker jobb.
    <a href="/guider/">Alla guider</a> · <a href="/verktyg/">Alla verktyg</a></p>
    <p><a href="/#/privacy">Integritet</a> · <a href="/#/tillganglighet">Tillgänglighet</a></p>
  </div>
</footer>
</body>
</html>
`
}

/** /verktyg/ — samlingssida. */
function renderToolIndex(verktyg) {
  const url = `${SITE}/verktyg/`
  const kort = verktyg
    .map(
      (t) =>
        `<a class="tool" href="/verktyg/${t.slug}/"><strong>${escapeHtml(t.h1)}</strong><span>${escapeHtml(t.description)}</span></a>`
    )
    .join('')

  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Gratis verktyg för dig som söker jobb — Jobin</title>
<meta name="description" content="CV-byggare, personligt brev, intervjuträning och kompetensanalys. Kostnadsfritt, på svenska, utan att du behöver installera något.">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="Gratis verktyg för dig som söker jobb — Jobin">
<meta property="og:description" content="CV-byggare, personligt brev, intervjuträning och kompetensanalys. Kostnadsfritt och på svenska.">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/favicon-64.png">
<style>${CSS}</style>
</head>
<body>
<a class="sr-only" href="#innehall">Hoppa till innehållet</a>
<header class="topbar">
  <div class="wrap">
    <a class="brand" href="/">Jobin</a>
    <a class="btn btn-sm" href="${appUrl('/oversikt')}">Öppna Jobin</a>
  </div>
</header>

<div class="hero">
  <div class="wrap">
    <h1>Verktyg för dig som söker jobb</h1>
    <p class="lead">Allt är kostnadsfritt och på svenska. Du behöver inte installera något — och du kan spara och fortsätta när du orkar.</p>
    <a class="btn" href="${appUrl('/oversikt')}">Kom igång</a>
  </div>
</div>

<main>
  <div class="wrap">
    <div class="tools">${kort}</div>
    <p style="margin-top:2rem"><a href="/guider/">Se även våra guider</a> — konkret hjälp om CV, intervju och att orka söka.</p>
  </div>
</main>

<footer>
  <div class="wrap">
    <p><strong>Jobin</strong> — stöd och verktyg för dig som söker jobb. <a href="${appUrl('/oversikt')}">Öppna portalen</a></p>
  </div>
</footer>
</body>
</html>
`
}

module.exports = {
  renderGuide,
  renderIndex,
  renderKategori,
  renderLattlast,
  renderTool,
  renderToolIndex,
}
