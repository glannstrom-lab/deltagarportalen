// Prod-röktest för företagskontot (AG6–AG8, 2026-09-13): demoföretaget Nordfrakt
// loggar in och ser sina sju flikar, förslag, pågående och meddelanden; demo-
// konsulenten ser företagskontot på platsen; demodeltagaren Anna ser "Det du delat".
// Skärmdumpar i e2e/screenshots/foretag/. Rör ingen AI, skickar inga mejl, skriver
// ingenting (demot återställs 01:00 UTC ändå).
//
// Kör:  NODE_PATH=node_modules node e2e/foretag-prod-rok.cjs
// Kräver DEMO_EMPLOYER_EMAIL/PASSWORD, DEMO_CONSULTANT_EMAIL/PASSWORD och
// DEMO_PARTICIPANT_EMAIL/PASSWORD i miljön eller .env.test.local.
const { chromium } = require('playwright')
const fs = require('fs'); const path = require('path')
;(function laddaEnv() {
  const p = path.join(__dirname, '..', '.env.test.local'); if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2] }
})()
const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://www.jobin.se'
const OUT = path.join(__dirname, 'screenshots', 'foretag'); fs.mkdirSync(OUT, { recursive: true })
const F = [process.env.DEMO_EMPLOYER_EMAIL, process.env.DEMO_EMPLOYER_PASSWORD]
const K = [process.env.DEMO_CONSULTANT_EMAIL, process.env.DEMO_CONSULTANT_PASSWORD]
const D = [process.env.DEMO_PARTICIPANT_EMAIL, process.env.DEMO_PARTICIPANT_PASSWORD]
if (!F[0] || !F[1] || !K[0] || !K[1] || !D[0] || !D[1]) { console.error('Saknar DEMO_EMPLOYER_/DEMO_CONSULTANT_/DEMO_PARTICIPANT_ EMAIL+PASSWORD'); process.exit(2) }
const resultat = []
function ok(steg, extra = '') { resultat.push(['OK', steg, extra]); console.log('OK ', steg, extra) }
function fel(steg, e) { resultat.push(['FEL', steg, String(e).slice(0, 300)]); console.log('FEL', steg, String(e).slice(0, 300)) }
async function shot(page, name) { await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false }) }
async function cookies(page) { const b = page.getByRole('button', { name: 'Endast nödvändiga' }); if (await b.isVisible({ timeout: 3000 }).catch(() => false)) await b.click() }
async function login(page, [email, pw]) {
  await page.goto(BASE + '/#/login', { waitUntil: 'networkidle' })
  await cookies(page)
  await page.fill('#email', email); await page.fill('#password', pw)
  await page.click('button[type="submit"]')
  await page.waitForURL((u) => !u.hash.includes('/login'), { timeout: 30000 })
  await page.waitForLoadState('networkidle')
  for (let i = 0; i < 3; i++) {
    const b = page.getByRole('button', { name: /Hoppa över/ })
    if (await b.isVisible({ timeout: 2000 }).catch(() => false)) { await b.click(); await page.waitForTimeout(500) } else break
  }
}
async function synlig(page, text, steg, timeout = 15000) {
  try { await page.getByText(text, { exact: false }).first().waitFor({ timeout }); ok(steg, `"${text}"`) } catch (e) { fel(steg, `"${text}" syns inte: ${e.message.split('\n')[0]}`) }
}

;(async () => {
  const browser = await chromium.launch()
  // ---------------- Företaget ----------------
  const fctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sv-SE' })
  const f = await fctx.newPage()
  try {
    await login(f, F)
    await f.waitForTimeout(1500)
    if (f.url().includes('/foretag')) ok('företag landar på /foretag', f.url()); else fel('företag landar på /foretag', f.url())
    await shot(f, 'f01-oversikt')
    await synlig(f, 'Hej Nordfrakt', 'översikt hälsar företaget')
    await synlig(f, 'Demo', 'demobannern syns för företaget', 8000)
    const hubb = await f.locator('a[href="#/jobb"]').count()
    if (hubb === 0) ok('inga deltagarhubbar i företagets skal'); else fel('inga deltagarhubbar i företagets skal', hubb + ' länkar till /jobb')
    for (const [slug, text] of [['platser', 'Lagermedarbetare'], ['forslag', 'Omar'], ['pagaende', 'Anna'], ['meddelanden', 'Kaffe finns'], ['stod', 'Arbetsförmedlingen'], ['om', 'Nordfrakt']]) {
      await f.goto(BASE + '/#/foretag/' + slug, { waitUntil: 'networkidle' }); await f.waitForTimeout(800)
      if (slug === 'meddelanden') { const trad = f.getByText('Anna Exempel').first(); if (await trad.isVisible().catch(() => false)) { await trad.click(); await f.waitForTimeout(1000) } }
      await synlig(f, text, 'flik ' + slug)
      await shot(f, 'f02-' + slug)
    }
    // Förslagsdetalj: Omar (show_contact=false → ingen e-post), Anna (show_contact=true)
    await f.goto(BASE + '/#/foretag/forslag', { waitUntil: 'networkidle' }); await f.waitForTimeout(800)
    const omar = f.getByRole('button', { name: /Läs presentationen|Omar/ }).first()
    if (await omar.isVisible().catch(() => false)) { await omar.click(); await f.waitForTimeout(1200); await shot(f, 'f03-forslag-omar') }
    const sida = await f.content()
    if (sida.includes('omar.demo@example.com')) fel('Omars e-post döljs (show_contact=false)', 'e-posten syns'); else ok('Omars e-post döljs (show_contact=false)')
    if (sida.includes('DEMO — intern anteckning')) fel('intern anteckning når aldrig företaget', 'texten syns'); else ok('intern anteckning når aldrig företaget')
    const belopp = sida.match(/\d[\d\s]*\s?kr\b|\d+\s?%/g)
    await f.goto(BASE + '/#/foretag/stod', { waitUntil: 'networkidle' }); await f.waitForTimeout(600)
    const stod = await f.locator('main').innerText().catch(() => '')
    if (/\d[\d\s]*\s?kr\b|\d+\s?%/.test(stod)) fel('stödfliken utan belopp/procent', stod.match(/\d[\d\s]*\s?kr\b|\d+\s?%/g).slice(0, 3).join(', ')); else ok('stödfliken utan belopp/procent')
    void belopp
  } catch (e) { fel('företagsflödet', e); await shot(f, 'f99-fel') }
  await fctx.close()

  // ---------------- Konsulenten ----------------
  const kctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sv-SE' })
  const k = await kctx.newPage()
  try {
    await login(k, K)
    // Samma väg som km-aktivitetskrav-prod.cjs: via Konsultportal-knappen, sedan fliken
    await k.goto(BASE + '/#/consultant', { waitUntil: 'networkidle' }); await k.waitForTimeout(1500)
    const portalKnapp = k.locator('a:has-text("Konsultportal"), button:has-text("Konsultportal")').first()
    if (await portalKnapp.isVisible().catch(() => false)) { await portalKnapp.click(); await k.waitForLoadState('networkidle'); await k.waitForTimeout(1200) }
    await k.goto(BASE + '/#/consultant/platser', { waitUntil: 'networkidle' }); await k.waitForTimeout(2000)
    await shot(k, 'k01-platser')
    await synlig(k, 'Företagskonto', 'konsulenten ser företagskontot på platsen')
    await synlig(k, 'Nordfrakt', 'konsulenten ser företagets namn')
    await synlig(k, 'vill gå vidare', 'konsulenten ser företagets svar om Anna', 8000)
  } catch (e) { fel('konsulentflödet', e); await shot(k, 'k99-fel') }
  await kctx.close()

  // ---------------- Deltagaren (Anna) ----------------
  const dctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sv-SE' })
  const d = await dctx.newPage()
  try {
    await login(d, D)
    await d.goto(BASE + '/#/my-consultant', { waitUntil: 'networkidle' }); await d.waitForTimeout(1500)
    await shot(d, 'd01-min-konsulent')
    await synlig(d, 'Det du delat', 'Anna ser "Det du delat"')
    await synlig(d, 'vill gå vidare', 'Anna ser att företaget vill gå vidare', 8000)
    const skal = d.locator('a[href="#/jobb"]')
    if (await skal.count() > 0) ok('deltagaren har sitt vanliga skal'); else fel('deltagaren har sitt vanliga skal', 'ingen /jobb-länk')
  } catch (e) { fel('deltagarflödet', e); await shot(d, 'd99-fel') }
  await dctx.close()
  await browser.close()

  const antalFel = resultat.filter((r) => r[0] === 'FEL').length
  console.log(`\n${resultat.length - antalFel}/${resultat.length} steg gröna`)
  fs.writeFileSync(path.join(OUT, 'resultat.json'), JSON.stringify(resultat, null, 2))
  process.exit(antalFel ? 1 : 0)
})()
