// Driftgenomgång 2026-09-22 — hur portalen BETER SIG i skarp drift (https://www.jobin.se).
// Kör från repots rot:  node e2e/drift-genomgang-2026-09-22.cjs
// Valfritt: DRIFT_BARA=deltagare,konsulent,publik,engelska,mobil,mork,foretag
//
// Rapportörskript: klickar ALDRIG på något som skriver data. Bara navigering,
// sidoflikar/role=tab, samt språk och tema via localStorage (addInitScript).
// Cookie-valet sätts i localStorage i förväg (CookieConsent.tsx läser bara därifrån).
// Onboardingguider stängs INTE (att hoppa över kan skrivas till profilen) — deras
// text räknas då in i skanningen, vilket noteras i rapporten.
//
// Utdata: docs/review-2026-09-22/drift/  (resultat.json, skarmdumpar/)
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const OUT = path.join(ROOT, 'docs', 'review-2026-09-22', 'drift')
const SHOTS = path.join(OUT, 'skarmdumpar')
fs.mkdirSync(SHOTS, { recursive: true })

const env = {}
for (const f of [path.join(ROOT, '.env.test.local'), path.join(ROOT, 'client', '.env')]) {
  if (!fs.existsSync(f)) continue
  for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z_]+)=(.*)$/)
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
const BASE = 'https://www.jobin.se'
const BARA = process.env.DRIFT_BARA ? new Set(process.env.DRIFT_BARA.split(',')) : null
const kor = (n) => !BARA || BARA.has(n)

// ---------- Rutter (App.tsx + nästlade <Routes> i sidorna) ----------
const DELTAGARE = [
  '/oversikt', '/oversikt/historik', '/jobb', '/karriar', '/resurser', '/min-vardag',
  '/cv', '/cv/my-cvs', '/cv/adapt', '/cv/ats', '/cv/tips',
  '/cover-letter', '/cover-letter/my-letters',
  '/interest-guide', '/interest-guide/results', '/interest-guide/occupations', '/interest-guide/explore', '/interest-guide/history',
  '/knowledge-base',
  '/profile', '/my-consultant',
  '/job-search', '/job-search/daily', '/job-search/slumpjobbet', '/job-search/saved', '/job-search/alerts', '/job-search/matches',
  '/job-search/applications', '/job-search/crm', '/job-search/culture',
  '/applications', '/applications/timeline', '/applications/calendar', '/applications/contacts', '/applications/analytics', '/applications/aktivitetsrapport',
  '/career', '/career/adaptation', '/career/credentials', '/career/relocation', '/career/plan',
  '/diary', '/wellness', '/wellness/routines', '/wellness/cognitive', '/wellness/crisis', '/wellness/energy',
  '/settings', '/resources', '/help', '/salary', '/education', '/calendar', '/min-vecka',
  '/spontanans%C3%B6kan', '/spontanans%C3%B6kan/mina-foretag', '/spontanans%C3%B6kan/statistik',
  '/n%C3%A4tverk',
  '/personal-brand', '/personal-brand/pitch', '/personal-brand/portfolio', '/personal-brand/visibility',
  '/linkedin-optimizer', '/skills-gap-analysis', '/interview-simulator', '/ai-team', '/exercises', '/international',
  '/externa-resurser', '/print/cv', '/admin', '/consultant',
  '/privacy', '/terms', '/ai-policy', '/tillganglighet',
]
const KONSULENT = [
  '/consultant', '/consultant/participants', '/consultant/platser', '/consultant/analytics',
  '/consultant/communication', '/consultant/resources', '/consultant/settings',
]
const PUBLIKA_SPA = ['/#/', '/#/login', '/#/register', '/#/privacy', '/#/terms', '/#/ai-policy', '/#/tillganglighet', '/#/accessibility', '/#/invite/ogiltig-kod-drift']
const PUBLIKA_STATISKA = [
  '/om-oss/', '/verktyg/', '/verktyg/cv/', '/verktyg/lon/', '/verktyg/dagbok/', '/verktyg/ny-i-sverige/',
  '/for-dig-som/', '/for-dig-som/langtidsarbetslos/', '/for-arbetsmarknadsenheter/', '/for-rusta-och-matcha/', '/for-arbetsgivare/',
]
const MORKT_URVAL = ['/oversikt', '/cv', '/jobb', '/min-vardag', '/job-search', '/diary', '/settings']

// ---------- Hjälpare ----------
const resultat = []
const sanera = (u) => {
  try {
    const x = new URL(u)
    for (const k of [...x.searchParams.keys()]) if (/key|token|secret|password/i.test(k)) x.searchParams.set(k, '***')
    let s = x.toString()
    s = s.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '<epost>')
    return s.length > 400 ? s.slice(0, 400) + '…' : s
  } catch { return String(u).slice(0, 300) }
}
const filnamn = (s) => s.replace(/^\/#?\/?/, '').replace(/%C3%B6/g, 'o').replace(/%C3%A4/g, 'a').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'rot'

function initSkript(opts) {
  return `(() => { try {
    ${opts.lang ? `localStorage.setItem('language', ${JSON.stringify(opts.lang)});` : ''}
    ${opts.theme ? `localStorage.setItem('theme', ${JSON.stringify(opts.theme)});` : ''}
  } catch (e) {} })()`
}

async function nyKontext(browser, { mobil = false, lang = 'sv', theme = 'light' } = {}) {
  const ctx = await browser.newContext(mobil
    ? { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: lang === 'en' ? 'en-GB' : 'sv-SE' }
    : { viewport: { width: 1440, height: 900 }, locale: lang === 'en' ? 'en-GB' : 'sv-SE' })
  // Cookie-nyckeln: läs den faktiska från CookieConsent.tsx vid körning i stället för att gissa
  await ctx.addInitScript(initSkript({ lang, theme }))
  await ctx.addInitScript(COOKIE_INIT)
  return ctx
}

// Cookie-nycklarna ur källkoden (så att skriptet inte ljuger om de byter namn)
const cc = fs.readFileSync(path.join(ROOT, 'client/src/components/CookieConsent.tsx'), 'utf8')
const CK = (cc.match(/COOKIE_CONSENT_KEY\s*=\s*['"]([^'"]+)/) || [])[1] || 'cookie-consent'
const CP = (cc.match(/COOKIE_PREFERENCES_KEY\s*=\s*['"]([^'"]+)/) || [])[1] || 'cookie-preferences'
const COOKIE_INIT = `(() => { try { localStorage.setItem(${JSON.stringify(CK)}, 'true'); localStorage.setItem(${JSON.stringify(CP)}, JSON.stringify({necessary:true,analytics:false,marketing:false,functional:false})) } catch (e) {} })()`

// Lyssnare som fördelar händelser på "aktuell rutt"
function koppla(page, tillstand) {
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') {
      const loc = m.location() || {}
      tillstand.aktuell?.[m.type() === 'error' ? 'konsolfel' : 'konsolvarningar'].push({
        text: m.text().slice(0, 500), kalla: loc.url ? sanera(loc.url) + ':' + loc.lineNumber : undefined,
      })
    }
  })
  page.on('pageerror', (e) => { tillstand.aktuell?.sidfel.push({ text: String(e.message || e).slice(0, 500), stack: String(e.stack || '').split('\n').slice(0, 4).join(' | ').slice(0, 600) }) })
  page.on('requestfailed', (r) => {
    const f = r.failure()?.errorText || ''
    if (/ERR_ABORTED/.test(f)) return
    tillstand.aktuell?.natfel.push({ url: sanera(r.url()), metod: r.method(), fel: f })
  })
  page.on('response', async (r) => {
    const s = r.status()
    if (s < 400) return
    const u = r.url()
    const rad = { url: sanera(u), metod: r.request().method(), status: s }
    const cur = tillstand.aktuell
    if (/supabase\.co|\/api\/|jobin\.se\/functions/.test(u)) {
      try { const t = await r.text(); rad.kropp = t.slice(0, 400); const j = JSON.parse(t); rad.kod = j.code || j.error_code || j.error; rad.meddelande = (j.message || j.msg || j.error_description || '').slice(0, 300) } catch {}
    }
    cur?.httpfel.push(rad)
  })
}

// DOM-skanning: i18n-nycklar, dåliga värden, (i engelskt läge) svensk text, overflow
async function skanna(page, { engelska = false, mobil = false } = {}) {
  return page.evaluate(({ engelska, mobil }) => {
    const synlig = (el) => {
      if (!el) return false
      if (el.closest('[aria-hidden="true"], script, style, noscript, template')) return false
      if (typeof el.checkVisibility === 'function') return el.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true })
      return !!(el.offsetParent || el.getClientRects().length)
    }
    const beskriv = (el) => {
      if (!el) return ''
      const cls = (typeof el.className === 'string' ? el.className : el.getAttribute('class') || '').trim().split(/\s+/).slice(0, 6).join('.')
      const lm = el.closest('main, nav, header, footer, aside, [role="dialog"], [role="complementary"]')
      const lmNamn = lm ? (lm.tagName.toLowerCase() + (lm.getAttribute('aria-label') ? `[${lm.getAttribute('aria-label')}]` : '') + (lm.getAttribute('role') ? `{${lm.getAttribute('role')}}` : '')) : ''
      return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''}${lmNamn ? ' in ' + lmNamn : ''}`
    }
    const NYCKEL = /^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9_]+){2,}$/
    const NYCKEL_INBAKAD = /(?:^|[\s(:"'])([a-z][a-zA-Z0-9]*\.[a-zA-Z][a-zA-Z0-9_]*\.[a-zA-Z0-9_.]*[a-zA-Z0-9_])(?=$|[\s),:"'])/g
    const DOMAN = /\.(se|com|org|nu|io|net|eu|pdf|docx?|png|jpe?g|svg|js|ts|tsx|json|html|gov|info|fi|no|dk)(\b|$)/i
    const DALIGT = /(^|[^\p{L}])(undefined|NaN|Invalid Date|null|\[object Object\])(?=$|[^\p{L}])/u
    const MALL = /\{\{\s*\w+\s*\}\}/
    const SKYDDADE = /Arbetsförmedlingen|Försäkringskassan|Migrationsverket|Skatteverket|a-kassa|A-kassa|a-kassan|komvux|Komvux|yrkeshögskola|Yrkeshögskola|personnummer|Personnummer|Folkhögskola|folkhögskola|Svenska för invandrare|Socialtjänsten|socialtjänst|Försäkringskassans|Arbetsförmedlingens|Kronofogden|CSN|Studieförbund|Sverige|Göteborg|Malmö|Västra|Skåne|Östergötland|Jönköping|Gävle|Västerås|Örebro|Norrköping|Linköping|Umeå|Luleå|Växjö|Borås|Södertälje|Uppsala|Jämtland|Värmland|Västerbotten|Västernorrland|Södermanland|Kalmar|Halland|Blekinge|Gotland|Dalarna|Norrbotten|Kronoberg|Västmanland|Stockholms|Glänne|Söner|Lätt svenska|Svenska|svenska/g
    const nycklar = [], nycklarInbakade = [], daliga = [], mallrester = [], svenska = [], attrNycklar = []
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let n
    while ((n = w.nextNode())) {
      const t = (n.nodeValue || '').trim()
      if (!t || t.length > 2000) continue
      const el = n.parentElement
      if (!synlig(el)) continue
      if (NYCKEL.test(t) && !DOMAN.test(t)) nycklar.push({ text: t, el: beskriv(el) })
      else {
        let m; NYCKEL_INBAKAD.lastIndex = 0
        while ((m = NYCKEL_INBAKAD.exec(t))) if (!DOMAN.test(m[1]) && !/^(e|t|d|bl|t\.ex|m\.m|s|o|p|i|fr|ca|dvs|osv)\./i.test(m[1])) nycklarInbakade.push({ text: t.slice(0, 160), nyckel: m[1], el: beskriv(el) })
      }
      if (DALIGT.test(t) && !el.closest('code, pre, textarea, input')) daliga.push({ text: t.slice(0, 200), el: beskriv(el) })
      if (MALL.test(t)) mallrester.push({ text: t.slice(0, 200), el: beskriv(el) })
      if (engelska) {
        const rest = t.replace(SKYDDADE, '')
        if (/[åäöÅÄÖ]/.test(rest)) svenska.push({ text: t.slice(0, 160), el: beskriv(el) })
      }
    }
    for (const el of document.querySelectorAll('[aria-label], [placeholder], [title], img[alt]')) {
      for (const a of ['aria-label', 'placeholder', 'title', 'alt']) {
        const v = (el.getAttribute(a) || '').trim()
        if (v && NYCKEL.test(v) && !DOMAN.test(v)) attrNycklar.push({ attr: a, text: v, el: beskriv(el) })
        if (v && DALIGT.test(v)) daliga.push({ text: `${a}="${v.slice(0, 150)}"`, el: beskriv(el) })
        if (engelska && v && /[åäöÅÄÖ]/.test(v.replace(SKYDDADE, '')) && synlig(el)) svenska.push({ text: `${a}="${v.slice(0, 150)}"`, el: beskriv(el) })
      }
    }
    let overflow = null
    // OBS: med isMobile växer layoutviewporten (innerWidth) när innehållet är för brett —
    // Chrome zoomar ut. Jämför därför mot den nominella bredden 375, inte mot innerWidth.
    const vw = 375
    const sw = Math.max(document.documentElement.scrollWidth, window.innerWidth)
    if (mobil && sw > vw + 1) {
      const klipper = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) return true } return false }
      const sticker = []
      for (const el of document.body.querySelectorAll('*')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        if (r.right <= vw + 1 && r.left >= -1) continue
        if (!synlig(el) || klipper(el)) continue
        const par = el.parentElement; const pr = par ? par.getBoundingClientRect() : null
        const foralderStickerOcksa = pr && (pr.right > vw + 1 || pr.left < -1) && !klipper(par)
        if (foralderStickerOcksa) continue
        sticker.push({ el: beskriv(el), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), text: (el.innerText || '').trim().slice(0, 80) })
      }
      overflow = { scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, nominell: vw, element: sticker.slice(0, 8) }
    }
    const body = document.body.innerText || ''
    return {
      hash: location.hash, pathname: location.pathname,
      h1: (document.querySelector('h1')?.textContent || '').trim().slice(0, 120),
      dialog: [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')].filter(synlig).map((d) => (d.getAttribute('aria-label') || d.textContent || '').trim().slice(0, 100)),
      laddarKvar: /Laddar|Loading\.\.\./.test(body.slice(0, 5000)),
      felgrans: /Något gick fel|Something went wrong|Sidan kunde inte visas/i.test(body),
      nycklar, nycklarInbakade: nycklarInbakade.slice(0, 20), attrNycklar, daliga: daliga.slice(0, 30), mallrester, svenska: svenska.slice(0, 60), svenskaAntal: svenska.length, overflow,
    }
  }, { engelska, mobil })
}

async function vanta(page) {
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(1500)
}

function nyPost(korning, rutt) {
  return { korning, rutt, konsolfel: [], konsolvarningar: [], sidfel: [], httpfel: [], natfel: [] }
}

async function besok(page, tillstand, korning, url, opts = {}) {
  const post = nyPost(korning, url)
  tillstand.aktuell = post
  const t0 = Date.now()
  try {
    await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await vanta(page)
    post.ms = Date.now() - t0
    Object.assign(post, await skanna(page, opts))
    if (opts.skarmdump) await page.screenshot({ path: path.join(SHOTS, `${korning}-${filnamn(url)}.jpg`), type: 'jpeg', quality: 60, fullPage: !!opts.helsida }).catch(() => {})
  } catch (e) { post.navigeringsfel = e.message.split('\n')[0] }
  resultat.push(post)
  const sam = `${post.sidfel.length}pe ${post.konsolfel.length}ce ${post.httpfel.length}http ${post.nycklar?.length || 0}key ${post.daliga?.length || 0}bad` + (post.overflow ? ` OVERFLOW ${post.overflow.scrollWidth}` : '') + (opts.engelska ? ` sv=${post.svenskaAntal}` : '') + ` -> ${post.hash || post.pathname || ''}`
  console.log(`[${korning}] ${url} ${sam}`)
  return post
}

// Flikar som lever i tillstånd: knappar i nav "… — avsnitt" och role=tab
async function flikar(page, tillstand, korning, url) {
  const knappar = page.locator('nav[aria-label$="avsnitt"] button, nav[aria-label="Avsnitt"] button, [role="tab"]')
  const antal = Math.min(await knappar.count().catch(() => 0), 10)
  const sedda = new Set()
  for (let i = 0; i < antal; i++) {
    const k = knappar.nth(i)
    if (!(await k.isVisible().catch(() => false))) continue
    const namn = ((await k.textContent().catch(() => '')) || '').trim().slice(0, 40)
    if (!namn || sedda.has(namn)) continue
    sedda.add(namn)
    const post = nyPost(korning, `${url} [flik: ${namn}]`)
    tillstand.aktuell = post
    try { await k.click({ timeout: 4000 }); await vanta(page); Object.assign(post, await skanna(page, {})) } catch (e) { post.navigeringsfel = e.message.split('\n')[0] }
    resultat.push(post)
    console.log(`  [flik] ${namn}: ${post.sidfel.length}pe ${post.konsolfel.length}ce ${post.httpfel.length}http ${post.nycklar?.length || 0}key ${post.daliga?.length || 0}bad`)
  }
}

async function loggaIn(page, tillstand, epost, losen, etikett) {
  const post = nyPost('inloggning', etikett)
  tillstand.aktuell = post
  await page.goto(BASE + '/#/login', { waitUntil: 'domcontentloaded' })
  await page.locator('input#email').waitFor({ timeout: 20000 })
  await page.locator('input#email').fill(epost)
  await page.locator('input#password').fill(losen)
  await page.locator('button[type="submit"]').first().click()
  await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 30000 })
  await vanta(page)
  Object.assign(post, await skanna(page, {}))
  resultat.push(post)
  console.log(`[inloggning ${etikett}] landade på ${post.hash}; dialoger: ${JSON.stringify(post.dialog)}`)
}

;(async () => {
  const browser = await chromium.launch()
  const start = Date.now()

  // ===== A. Deltagare, desktop, svenska =====
  if (kor('deltagare')) {
    const ctx = await nyKontext(browser); const page = await ctx.newPage(); const st = {}; koppla(page, st)
    await loggaIn(page, st, env.TEST_USER_EMAIL, env.TEST_USER_PASSWORD, 'deltagare-desktop')
    for (const r of DELTAGARE) {
      await besok(page, st, 'deltagare', '/#' + r, { skarmdump: true })
      await flikar(page, st, 'deltagare', '/#' + r)
    }
    // Artikel i kunskapsbanken: första länken
    await page.goto(BASE + '/#/knowledge-base'); await vanta(page)
    const art = await page.locator('a[href*="knowledge-base/article/"]').first().getAttribute('href').catch(() => null)
    if (art) await besok(page, st, 'deltagare', '/' + art.replace(/^\/?/, ''), { skarmdump: true })
    await ctx.close()
  }

  // ===== B. Deltagare, mobil 375, svenska (overflow) =====
  if (kor('mobil')) {
    const ctx = await nyKontext(browser, { mobil: true }); const page = await ctx.newPage(); const st = {}; koppla(page, st)
    await loggaIn(page, st, env.TEST_USER_EMAIL, env.TEST_USER_PASSWORD, 'deltagare-mobil')
    for (const r of DELTAGARE) {
      const p = await besok(page, st, 'mobil', '/#' + r, { mobil: true })
      if (p.overflow) await page.screenshot({ path: path.join(SHOTS, `mobil-overflow-${filnamn(r)}.jpg`), type: 'jpeg', quality: 60 }).catch(() => {})
    }
    await ctx.close()
  }

  // ===== C. Deltagare, desktop, engelska =====
  if (kor('engelska')) {
    const ctx = await nyKontext(browser, { lang: 'en' }); const page = await ctx.newPage(); const st = {}; koppla(page, st)
    await loggaIn(page, st, env.TEST_USER_EMAIL, env.TEST_USER_PASSWORD, 'deltagare-en')
    // FYND: språket i localStorage skrivs över av settingsStore.syncWithServer vid varje
    // appstart (user_preferences.language, som språkväljarna aldrig sparar). Välj därför
    // engelska i UI:t efter inloggningen — i18n.changeLanguage, ingen serverskrivning —
    // och navigera sedan bara inom dokumentet (hash-byten laddar inte om appen).
    await page.getByRole('button', { name: /välj språk|choose language|select language/i }).first().click().catch(() => {})
    await page.waitForTimeout(400)
    await page.getByText(/^English$/).first().click().catch(() => {})
    await page.waitForTimeout(2500)
    console.log('[engelska] språk efter val i UI:', await page.evaluate(() => document.documentElement.lang))
    for (const r of DELTAGARE) {
      if (r.startsWith('/consultant') || r === '/admin') continue
      const p = await besok(page, st, 'engelska', '/#' + r, { engelska: true })
      if (p.svenskaAntal >= 5 || (p.nycklar && p.nycklar.length)) await page.screenshot({ path: path.join(SHOTS, `en-${filnamn(r)}.jpg`), type: 'jpeg', quality: 55, fullPage: true }).catch(() => {})
    }
    await ctx.close()
  }

  // ===== D. Mörkt läge, urval =====
  if (kor('mork')) {
    const ctx = await nyKontext(browser, { theme: 'dark' }); const page = await ctx.newPage(); const st = {}; koppla(page, st)
    await loggaIn(page, st, env.TEST_USER_EMAIL, env.TEST_USER_PASSWORD, 'deltagare-mork')
    for (const r of MORKT_URVAL) await besok(page, st, 'mork', '/#' + r, { skarmdump: true, helsida: true })
    await ctx.close()
    const ctx2 = await nyKontext(browser, { theme: 'dark', mobil: true }); const p2 = await ctx2.newPage(); const st2 = {}; koppla(p2, st2)
    await loggaIn(p2, st2, env.TEST_USER_EMAIL, env.TEST_USER_PASSWORD, 'deltagare-mork-mobil')
    for (const r of ['/oversikt', '/cv', '/min-vecka']) await besok(p2, st2, 'mork-mobil', '/#' + r, { skarmdump: true, helsida: true, mobil: true })
    await ctx2.close()
  }

  // ===== E. Konsulent =====
  if (kor('konsulent')) {
    for (const lage of [{ namn: 'konsulent', mobil: false, theme: 'light' }, { namn: 'konsulent-mobil', mobil: true, theme: 'light' }, { namn: 'konsulent-mork', mobil: false, theme: 'dark' }]) {
      const ctx = await nyKontext(browser, { mobil: lage.mobil, theme: lage.theme }); const page = await ctx.newPage(); const st = {}; koppla(page, st)
      await loggaIn(page, st, env.TEST_CONSULTANT_EMAIL, env.TEST_CONSULTANT_PASSWORD, lage.namn)
      const lista = lage.namn === 'konsulent-mork' ? ['/consultant', '/consultant/participants'] : KONSULENT
      for (const r of lista) {
        const p = await besok(page, st, lage.namn, '/#' + r, { skarmdump: lage.namn !== 'konsulent-mobil' || false, helsida: lage.namn === 'konsulent-mork', mobil: lage.mobil })
        if (p.overflow) await page.screenshot({ path: path.join(SHOTS, `${lage.namn}-overflow-${filnamn(r)}.jpg`), type: 'jpeg', quality: 60 }).catch(() => {})
        if (lage.namn === 'konsulent') await flikar(page, st, lage.namn, '/#' + r)
      }
      // Deltagardetalj: första länken ur deltagarlistan
      await page.goto(BASE + '/#/consultant/participants'); await vanta(page)
      const href = await page.locator('a[href*="/consultant/participants/"]').first().getAttribute('href').catch(() => null)
      let detalj = href
      if (!detalj) {
        // Listan kan navigera via onClick — ta id ur URL efter klick på raden? (skrivfritt: bara navigering)
        const rad = page.locator('main [role="row"] a, main table a, main li a').first()
        detalj = await rad.getAttribute('href').catch(() => null)
      }
      if (detalj) {
        const r = detalj.replace(/^#/, '').replace(/^\/?#?/, '/')
        const p = await besok(page, st, lage.namn, '/#' + r.replace(/^\/#/, ''), { skarmdump: true, helsida: lage.namn === 'konsulent-mork', mobil: lage.mobil })
        if (lage.namn === 'konsulent') await flikar(page, st, lage.namn, p.rutt)
      } else console.log(`[${lage.namn}] hittade ingen deltagarlänk i listan`)
      await ctx.close()
    }
  }

  // ===== F. Publika sidor utan inloggning =====
  if (kor('publik')) {
    for (const mobil of [false, true]) {
      const ctx = await nyKontext(browser, { mobil }); const page = await ctx.newPage(); const st = {}; koppla(page, st)
      for (const r of PUBLIKA_SPA) await besok(page, st, mobil ? 'publik-mobil' : 'publik', r, { skarmdump: !mobil, mobil })
      for (const r of PUBLIKA_STATISKA) await besok(page, st, mobil ? 'publik-mobil' : 'publik', r, { skarmdump: false, mobil })
      // Guider: ett urval ur sitemapen
      const sm = await (await page.request.get(BASE + '/sitemap.xml')).text()
      const guider = [...sm.matchAll(/<loc>https:\/\/www\.jobin\.se(\/guider\/[^<]+)<\/loc>/g)].map((m) => m[1])
      const urval = [guider[0], ...guider.filter((_, i) => i % Math.max(1, Math.floor(guider.length / 12)) === 0)].filter(Boolean).slice(0, 13)
      for (const g of [...new Set(['/guider/', ...urval])]) await besok(page, st, mobil ? 'publik-mobil' : 'publik', g, { mobil })
      await ctx.close()
    }
  }

  // ===== G. Företagskontot (demo) =====
  if (kor('foretag') && env.DEMO_EMPLOYER_EMAIL) {
    const ctx = await nyKontext(browser); const page = await ctx.newPage(); const st = {}; koppla(page, st)
    await loggaIn(page, st, env.DEMO_EMPLOYER_EMAIL, env.DEMO_EMPLOYER_PASSWORD, 'foretag')
    for (const r of ['/foretag', '/oversikt']) { await besok(page, st, 'foretag', '/#' + r, { skarmdump: true }); await flikar(page, st, 'foretag', '/#' + r) }
    await ctx.close()
  }

  await browser.close()
  const fil = BARA ? `resultat-${[...BARA].join('-')}.json` : 'resultat.json'
  fs.writeFileSync(path.join(OUT, fil), JSON.stringify({ kord: new Date().toISOString(), sekunder: Math.round((Date.now() - start) / 1000), resultat }, null, 2))
  console.log(`\nKLART — ${resultat.length} besök, ${Math.round((Date.now() - start) / 1000)} s → ${path.join(OUT, fil)}`)
})().catch((e) => { console.error(e); process.exit(1) })
