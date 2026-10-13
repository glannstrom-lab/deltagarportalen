// Språkgenomgång mot prod (2026-10-13): engelska (i18next) + Google Translate.
// node e2e/sprak-prod-2026-10-13.cjs  — kräver DEMO_PARTICIPANT_* i .env.test.local
const { chromium } = require('playwright')
const fs = require('fs'), path = require('path')
;(() => { const p = path.join(__dirname, '..', '.env.test.local'); if (!fs.existsSync(p)) return
  for (const l of fs.readFileSync(p, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim() } })()
const BASE = process.env.BASE || 'https://www.jobin.se'
const OUT = process.env.OUT || path.join(__dirname, '..', 'test-results', 'sprak')
fs.mkdirSync(OUT, { recursive: true })
const BARA_GOOGLE = process.env.BARA_GOOGLE === '1'
const SIDOR = ['/oversikt', '/jobb', '/cv', '/applications', '/karriar', '/resurser', '/min-vardag', '/diary', '/wellness', '/settings', '/knowledge-base', '/interview-simulator', '/cover-letter']
const SV_ORD = /\b(och|för|inte|eller|med|din|dina|ditt|här|ansökningar|sparade|Översikt|Söka jobb|Karriär|Resurser|vardag|Inställningar|Lägg till|Spara|Visa|dagbok|mående)\b/i

async function login(page) {
  await page.goto(BASE + '/#/login', { waitUntil: 'networkidle' })
  await page.fill('#email', process.env.DEMO_PARTICIPANT_EMAIL); await page.fill('#password', process.env.DEMO_PARTICIPANT_PASSWORD)
  await page.keyboard.press('Enter')
  await page.waitForURL((u) => !u.hash.includes('/login'), { timeout: 30000 })
  await page.waitForTimeout(2000)
}
async function svenskaKvar(page) {
  return page.evaluate((src) => {
    const re = new RegExp(src, 'i'); const ut = new Set()
    const w = document.createTreeWalker(document.querySelector('main') || document.body, NodeFilter.SHOW_TEXT)
    let n; while ((n = w.nextNode())) {
      const el = n.parentElement; if (!el || el.closest('script,style,[translate="no"],.notranslate')) continue
      const s = n.textContent.trim(); if (s.length < 3) continue
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue
      if (/[åäöÅÄÖ]/.test(s) || re.test(s)) ut.add(s.slice(0, 90))
    }
    return [...ut]
  }, SV_ORD.source)
}

;(async () => {
  const browser = await chromium.launch()
  const rapport = { en: {}, google: {}, fel: [] }
  // ── 1. Engelska ──
  if (!BARA_GOOGLE) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    page.on('pageerror', (e) => rapport.fel.push(['en', page.url(), e.message.slice(0, 200)]))
    await login(page)
    await page.evaluate(() => { localStorage.setItem('language', 'en') })
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(2500)
    rapport.en.htmlLang = await page.evaluate(() => document.documentElement.lang)
    for (const s of SIDOR) {
      await page.goto(BASE + '/#' + s, { waitUntil: 'networkidle' }).catch(() => {}); await page.waitForTimeout(2500)
      const kvar = await svenskaKvar(page)
      rapport.en[s] = kvar
      await page.screenshot({ path: path.join(OUT, `en${s.replace(/\//g, '_')}.png`) })
    }
    rapport.en.sparatSprak = await page.evaluate(() => localStorage.getItem('language'))
    // Tillbaka till svenska via inställningen (sparar på kontot)
    await page.evaluate(() => { localStorage.setItem('language', 'sv') })
    await ctx.close()
  }
  // ── 2. Google Translate ──
  for (const [kod, uiSprak] of [['ar', 'sv'], ['so', 'sv'], ['ar', 'en']]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    const nyckel = `${kod}-ui_${uiSprak}`
    rapport.google[nyckel] = {}
    page.on('pageerror', (e) => rapport.fel.push(['google ' + nyckel, page.url(), e.message.slice(0, 200)]))
    page.on('console', (m) => { if (m.type() === 'error') rapport.fel.push(['google-console ' + nyckel, page.url(), m.text().slice(0, 300)]) })
    await login(page)
    await page.evaluate(([k, ui]) => { localStorage.setItem('googleTranslateLanguage', k); localStorage.setItem('language', ui) }, [kod, uiSprak])
    await ctx.addCookies([{ name: 'googtrans', value: `/sv/${kod}`, domain: new URL(BASE).hostname, path: '/' }])
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(6000)
    for (const s of ['/oversikt', '/jobb', '/applications', '/diary', '/settings']) {
      await page.goto(BASE + '/#' + s, { waitUntil: 'networkidle' }).catch(() => {}); await page.waitForTimeout(4000)
      const info = await page.evaluate(() => ({
        htmlClass: document.documentElement.className.slice(0, 80),
        htmlLang: document.documentElement.lang,
        fontTaggar: document.querySelectorAll('font').length,
        skript: !!document.querySelector('script[src*="translate_a/element.js"]'),
        rubrik: (document.querySelector('main h1, h1')?.innerText || '').slice(0, 80),
        brodtext: (document.querySelector('main')?.innerText || '').slice(0, 300),
        vitSida: (document.querySelector('#root')?.innerText || '').trim().length < 20,
      }))
      rapport.google[nyckel][s] = info
      await page.screenshot({ path: path.join(OUT, `g-${nyckel}${s.replace(/\//g, '_')}.png`) })
    }
    // SPA-interaktion: öppna/stäng något och se att inget kraschar
    await ctx.close()
  }
  // Återställ kontots språk till svenska
  {
    const ctx = await browser.newContext(); const page = await ctx.newPage()
    await login(page); await page.evaluate(() => { localStorage.setItem('language', 'sv') })
    await page.goto(BASE + '/#/settings', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500)
    const sel = page.locator('#sprakval')
    if (await sel.count()) { await sel.selectOption('en').catch(() => {}); await page.waitForTimeout(800); await sel.selectOption('sv').catch(() => {}); await page.waitForTimeout(1500) }
    await ctx.close()
  }
  fs.writeFileSync(path.join(OUT, 'rapport.json'), JSON.stringify(rapport, null, 2))
  console.log(JSON.stringify(rapport, null, 2))
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
