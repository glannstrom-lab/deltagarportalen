// Prod-röktest för aktivitetskravet (KM3–KM7): konsulenten bygger mall → plan →
// närvaro → underlag → PDF → IVO-kort → organisation; deltagaren ser Min vecka
// och checkar in; konsulenten ser incheckningen. Skärmdumpar i e2e/screenshots/km/.
//
// Kör:  NODE_PATH=node_modules node e2e/km-aktivitetskrav-prod.cjs
// Kräver TEST_CONSULTANT_EMAIL/PASSWORD + TEST_USER_EMAIL/PASSWORD i miljön
// (eller .env.test.local). Konsulenten ska vara kopplad till deltagaren.
// Idempotent: mall och plan återanvänds om de redan finns. Rör ingen AI.
// Första körningen 2026-09-11: 13/13 steg gröna mot www.jobin.se.
const { chromium } = require('playwright')
const fs = require('fs'); const path = require('path')
;(function laddaEnv() {
  const p = path.join(__dirname, '..', '.env.test.local'); if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2] }
})()
const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://www.jobin.se'
const OUT = path.join(__dirname, 'screenshots', 'km'); fs.mkdirSync(OUT, { recursive: true })
const KONS = process.env.TEST_CONSULTANT_EMAIL, DELT = process.env.TEST_USER_EMAIL
const PW_K = process.env.TEST_CONSULTANT_PASSWORD, PW_D = process.env.TEST_USER_PASSWORD
if (!KONS || !DELT || !PW_K || !PW_D) { console.error('Saknar TEST_CONSULTANT_EMAIL/PASSWORD och TEST_USER_EMAIL/PASSWORD'); process.exit(2) }
const resultat = []
function ok(steg, extra = '') { resultat.push(['OK', steg, extra]); console.log('OK ', steg, extra) }
function fel(steg, e) { resultat.push(['FEL', steg, String(e).slice(0, 300)]); console.log('FEL', steg, String(e).slice(0, 300)) }
const idag = new Date(); const pad = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const mandag = new Date(idag); mandag.setDate(idag.getDate() - ((idag.getDay() + 6) % 7))
const slut = new Date(mandag); slut.setDate(mandag.getDate() + 7 * 12 - 1)

async function shot(page, name) { await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false }); }
async function cookies(page) { const b = page.getByRole('button', { name: 'Endast nödvändiga' }); if (await b.isVisible({ timeout: 3000 }).catch(() => false)) await b.click() }
async function login(page, email, pw) {
  await page.goto(BASE + '/#/login', { waitUntil: 'networkidle' })
  await cookies(page)
  await page.fill('#email', email); await page.fill('#password', pw)
  await page.click('button[type="submit"]')
  await page.waitForURL((u) => !u.hash.includes('/login'), { timeout: 30000 })
  await page.waitForLoadState('networkidle')
  await hoppaOver(page)
}
async function hoppaOver(page) {
  for (let i = 0; i < 3; i++) {
    const b = page.getByRole('button', { name: /Hoppa över/ })
    if (await b.isVisible({ timeout: 2500 }).catch(() => false)) { await b.click(); await page.waitForTimeout(600); ok('onboardingguiden hoppad över') } else break
  }
}

;(async () => {
  const browser = await chromium.launch()
  // ---------------- Konsulent ----------------
  const kctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sv-SE', acceptDownloads: true })
  const k = await kctx.newPage()
  k.on('dialog', (dlg) => { resultat.push(['INFO', 'native confirm()', dlg.message().slice(0, 80)]); dlg.accept() })
  try { await login(k, KONS, PW_K); ok('konsulent inloggad', k.url()) } catch (e) { fel('konsulent inloggning', e); await shot(k, 'k00-login-fel') }

  try {
    await k.goto(BASE + '/#/consultant', { waitUntil: 'networkidle' }); await k.waitForTimeout(1500); await hoppaOver(k)
    const portalKnapp = k.locator('a:has-text("Konsultportal"), button:has-text("Konsultportal")').first()
    if (await portalKnapp.isVisible().catch(() => false)) { await portalKnapp.click(); await k.waitForLoadState('networkidle'); await k.waitForTimeout(1200) }
    await shot(k, 'k00-konsultportal')
    const rail = k.locator('a[href="#/consultant/resources"]').first()
    if (await rail.isVisible().catch(() => false)) { await rail.click() } else { await k.goto(BASE + '/#/consultant/resources', { waitUntil: 'networkidle' }) }
    await k.waitForLoadState('networkidle'); await k.waitForTimeout(1000)
    await k.getByRole('button', { name: 'Schemamallar' }).click()
    await k.waitForTimeout(800)
    await shot(k, 'k01-schemamallar-tom')
    if (await k.getByText('Jobbsökarverkstad 15 h (test)').first().isVisible().catch(() => false)) { ok('schemamall fanns redan'); throw new Error('__finns__') }
    await k.getByRole('button', { name: 'Ny schemamall' }).click()
    await k.getByLabel('Namn').fill('Jobbsökarverkstad 15 h (test)')
    await k.getByLabel('Beskrivning').fill('Testmall från browserverifieringen 2026-09-11.')
    await k.getByLabel('Veckodag').first().selectOption({ label: 'Måndag' })
    await k.getByLabel('Start').first().fill('09:00')
    await k.getByLabel('Slut').first().fill('12:00')
    await k.getByLabel('Aktivitetstyp').first().selectOption({ index: 3 })
    await k.getByLabel('Rubrik').first().fill('Jobbsökarverkstad')
    await k.getByLabel('Plats').first().fill('Hjernet, Malmgatan 4')
    await k.getByRole('button', { name: /Kopiera till alla vardagar/i }).first().click()
    await k.waitForTimeout(300)
    await shot(k, 'k02-mall-dialog')
    await k.getByRole('button', { name: 'Spara mall' }).click()
    await k.waitForTimeout(1500)
    await shot(k, 'k03-mall-sparad')
    ok('schemamall skapad')
  } catch (e) { if (String(e).includes('__finns__')) { await shot(k, 'k03-mall-sparad') } else { fel('schemamall', e); await shot(k, 'k02-mall-fel') } }

  let deltagarUrl = null
  try {
    await k.goto(BASE + '/#/consultant/participants', { waitUntil: 'networkidle' })
    await k.waitForTimeout(1000)
    await hoppaOver(k); const lank = k.getByRole('link', { name: /Dana/ }).first()
    await lank.click()
    await k.waitForLoadState('networkidle'); await k.waitForTimeout(800)
    deltagarUrl = k.url()
    await k.getByRole('button', { name: 'Aktivitet' }).click()
    await k.waitForTimeout(800)
    await shot(k, 'k04-aktivitet-tom')
    if (await k.getByRole('button', { name: 'Avsluta plan' }).first().isVisible().catch(() => false)) { ok('plan fanns redan'); throw new Error('__finns__') }
    await k.getByRole('button', { name: 'Tillämpa schemamall' }).first().click()
    await k.waitForTimeout(800)
    await k.getByLabel('Startdatum').fill(iso(mandag))
    await k.getByLabel('Slutdatum').fill(iso(slut))
    await k.getByLabel('Barn under 8 år i hushållet').check({ force: true })
    await k.getByLabel('Tid för eget jobbsökande, h/vecka').fill('5')
    await k.getByLabel('Beslutsdatum').fill(iso(idag))
    await k.getByLabel('Försörjningshinder (för IVO-underlaget)').selectOption({ label: 'Arbetslös' })
    await k.getByLabel('Plan i text').fill('Jobbsökarverkstad tre timmar per vardag på Hjernet, plus fem timmar eget jobbsökande. Anpassat till hämtning på förskola.')
    await shot(k, 'k05-tillampa-dialog')
    await k.getByRole('button', { name: 'Skapa plan' }).click()
    await k.waitForTimeout(2500)
    await shot(k, 'k06-plan-skapad')
    ok('plan skapad ur mall', `start ${iso(mandag)}`)
  } catch (e) { if (!String(e).includes('__finns__')) { fel('plan', e); await shot(k, 'k05-plan-fel') } }

  try {
    const togglar = k.locator('button[aria-controls^="narvaro-"]')
    await togglar.nth(0).scrollIntoViewIfNeeded(); await togglar.nth(0).click(); await k.waitForTimeout(500)
    await k.getByRole('button', { name: 'Ogiltig frånvaro' }).first().click({ force: true }); await k.waitForTimeout(1500)
    await togglar.nth(1).scrollIntoViewIfNeeded(); await togglar.nth(1).click(); await k.waitForTimeout(500)
    await k.getByRole('button', { name: 'Närvarande' }).first().click({ force: true }); await k.waitForTimeout(1500)
    await k.screenshot({ path: path.join(OUT, 'k07-narvaro-markerad.png'), fullPage: true })
    ok('närvaro markerad (1 ogiltig, 1 närvarande)')
  } catch (e) { fel('närvaro', e); await shot(k, 'k07-narvaro-fel') }

  try {
    // Idempotent: står datumet redan, ångra först så dialogen prövas på riktigt.
    const angra = k.getByRole('button', { name: 'Ångra' }).first()
    if (await angra.isVisible().catch(() => false)) { await angra.evaluate((el) => el.scrollIntoView({ block: 'center' })); await angra.click(); await k.waitForTimeout(1200) }
    const ul = k.locator('button:has-text("Underlag lämnat till handläggaren"), a:has-text("Underlag lämnat till handläggaren")').first()
    await ul.evaluate((el) => el.scrollIntoView({ block: 'center' })); await k.waitForTimeout(400); await ul.click()
    await k.waitForTimeout(700)
    await shot(k, 'k08-bekrafta-dialog')
    // Portalens egen dialog (useConfirmDialog). Native confirm() accepteras av dialog-lyssnaren ovan.
    const ja = k.getByRole('button', { name: 'Ja, underlag lämnat' })
    if (await ja.isVisible({ timeout: 3000 }).catch(() => false)) { await ja.click(); ok('portalens bekräftelsedialog visades') } else { fel('bekräftelsedialog', 'portalens dialog visades inte (native confirm?)') }
    await k.waitForTimeout(1200)
    await shot(k, 'k08-underlag-lamnat')
    ok('underlag lämnat-datum satt')
  } catch (e) { fel('underlag lämnat', e) }

  try {
    const [dl] = await Promise.all([k.waitForEvent('download', { timeout: 20000 }), k.getByRole('button', { name: 'Plan som PDF' }).click()])
    const p = path.join(OUT, 'aktivitetsplan.pdf'); await dl.saveAs(p)
    ok('plan-PDF laddad ner', `${fs.statSync(p).size} byte, ${dl.suggestedFilename()}`)
  } catch (e) { fel('plan-PDF', e) }

  try {
    await k.goto(BASE + '/#/consultant/analytics', { waitUntil: 'networkidle' }); await k.waitForTimeout(2500)
    const h = k.getByText(/kvartalsunderlag till IVO/i).first()
    await h.scrollIntoViewIfNeeded(); await k.waitForTimeout(600)
    await shot(k, 'k09-ivo-underlag')
    ok('IVO-kortet renderat')
  } catch (e) { fel('IVO-kortet', e); await shot(k, 'k09-ivo-fel') }

  try {
    await k.goto(BASE + '/#/consultant/settings', { waitUntil: 'networkidle' }); await k.waitForTimeout(2000)
    const org = k.getByText(/Testkommun/).first(); await org.scrollIntoViewIfNeeded(); await k.waitForTimeout(500)
    await shot(k, 'k10-organisation-caseload')
    ok('organisation + caseload synlig')
  } catch (e) { fel('organisation', e); await shot(k, 'k10-org-fel') }

  // ---------------- Deltagare ----------------
  const dctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'sv-SE', isMobile: true, hasTouch: true })
  const d = await dctx.newPage()
  try { await login(d, DELT, PW_D); ok('deltagare inloggad', d.url()) } catch (e) { fel('deltagare inloggning', e); await shot(d, 'd00-login-fel') }
  try {
    await d.waitForTimeout(3000); await hoppaOver(d); await d.waitForTimeout(800)
    const samtycke = d.getByRole('button', { name: 'Ja, det är okej' })
    if (await samtycke.isVisible({ timeout: 4000 }).catch(() => false)) {
      await shot(d, 'd01-samtyckesfraga')
      for (const cb of await d.locator('input[type=checkbox]').all()) { if (!(await cb.isChecked())) await cb.check({ force: true }) }
      await samtycke.click(); await d.waitForTimeout(1000)
      ok('konsulentsamtycke givet')
    } else ok('ingen samtyckesfråga visades')
  } catch (e) { fel('samtycke', e) }
  try {
    await d.goto(BASE + '/#/min-vecka', { waitUntil: 'networkidle' }); await d.waitForTimeout(2000); await hoppaOver(d)
    await shot(d, 'd02-min-vecka')
    const har = d.getByRole('button', { name: 'Jag är här' }).first()
    if (await har.isVisible({ timeout: 3000 }).catch(() => false)) {
      await har.click(); await d.waitForTimeout(1500); await shot(d, 'd03-incheckad'); ok('deltagaren checkade in')
    } else { fel('incheckning', 'ingen "Jag är här"-knapp synlig (inget pass i dag?)') }
  } catch (e) { fel('min vecka', e); await shot(d, 'd02-min-vecka-fel') }
  try {
    await d.goto(BASE + '/#/min-vardag', { waitUntil: 'networkidle' }); await d.waitForTimeout(1500)
    await shot(d, 'd04-min-vardag-hubb'); ok('hubbkortet Min vecka')
  } catch (e) { fel('hubb', e) }

  // Konsulenten ser incheckningen
  try {
    if (deltagarUrl) { await k.goto(deltagarUrl, { waitUntil: 'networkidle' }); await k.waitForTimeout(800); await k.getByRole('button', { name: 'Aktivitet' }).click(); await k.waitForTimeout(1500) }
    const inch = await k.getByText(/Checkade in/).count()
    await shot(k, 'k11-ser-incheckning')
    inch > 0 ? ok('konsulenten ser deltagarens incheckning') : fel('incheckning hos konsulent', 'ingen "Checkade in"-text')
  } catch (e) { fel('incheckning hos konsulent', e) }

  await browser.close()
  fs.writeFileSync(path.join(OUT, 'resultat.json'), JSON.stringify(resultat, null, 2))
  console.log('\n' + resultat.map((r) => r.join(' | ')).join('\n'))
})()
