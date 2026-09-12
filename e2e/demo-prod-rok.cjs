// Prod-röktest för demokontot (KM12 (8), 2026-09-12): loggar in som demokonsulenten
// på www.jobin.se, går igenom konsulentvyn och kontrollerar bannern, deltagarlistan,
// en deltagarsida med journal/mål och organisationsfliken. Tar skärmdumpar i
// e2e/screenshots/demo/. Rör ingen AI (avstängd för orgen) och skickar inga mejl.
//
// Kör:  NODE_PATH=node_modules node e2e/demo-prod-rok.cjs
// Kräver DEMO_CONSULTANT_EMAIL/PASSWORD i .env.test.local (samma uppgifter som står
// på /for-arbetsmarknadsenheter/). Demot återställs 01:00 UTC av reset_demo_org().
const { chromium } = require('playwright')
const fs = require('fs'); const path = require('path')
;(function laddaEnv() {
  const p = path.join(__dirname, '..', '.env.test.local'); if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
})()
const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://www.jobin.se'
const OUT = path.join(__dirname, 'screenshots', 'demo'); fs.mkdirSync(OUT, { recursive: true })
const EMAIL = process.env.DEMO_CONSULTANT_EMAIL, PW = process.env.DEMO_CONSULTANT_PASSWORD
if (!EMAIL || !PW) { console.error('Saknar DEMO_CONSULTANT_EMAIL/PASSWORD'); process.exit(2) }
const resultat = []
const ok = (s, x = '') => { resultat.push(['OK', s]); console.log('OK ', s, x) }
const fel = (s, e) => { resultat.push(['FEL', s]); console.log('FEL', s, String(e).slice(0, 200)) }

;(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage()
  try {
    await page.goto(`${BASE}/#/login`); await page.locator('input#email').fill(EMAIL); await page.locator('input#password').fill(PW)
    await page.getByRole('button', { name: /^logga in$/i }).click()
    await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 20000 }); ok('inloggning som demokonsulent')
    const cookies = page.getByRole('button', { name: /endast nödvändiga/i }); if (await cookies.isVisible({ timeout: 2000 }).catch(() => false)) await cookies.click()

    // Direkt efter inloggning skickar appen till /#/oversikt när auth initieras — vänta in
    // det först, gå sedan till konsulentvyn (eller via knappen "Konsultportal" om vi studsar)
    await page.waitForTimeout(2500)
    await page.goto(`${BASE}/#/consultant`); await page.waitForTimeout(2500)
    if (!(await page.getByRole('heading', { name: /konsultportal/i }).isVisible().catch(() => false))) {
      const knapp = page.getByRole('link', { name: /konsultportal/i }).first()
      if (await knapp.isVisible().catch(() => false)) { await knapp.click(); await page.waitForTimeout(2500) }
    }
    // Välkomstguiden (5 steg) visas för varje ny webbläsarkontext — även för konsulenter (bifynd)
    const hoppa = page.getByRole('button', { name: /hoppa över/i })
    if (await hoppa.isVisible({ timeout: 2000 }).catch(() => false)) { await hoppa.click(); await page.waitForTimeout(500); ok('välkomstguiden stängd') }
    await page.screenshot({ path: path.join(OUT, '01-oversikt.png'), fullPage: true })
    if (await page.getByTestId('demo-banner').isVisible().catch(() => false)) { ok('demobannern syns') } else { fel('demobannern syns', 'saknas — är DemoBanner monterad i layouten?') }
    if (await page.getByRole('heading', { name: /konsultportal/i }).isVisible()) { ok('konsulentvyn laddar') } else { fel('konsulentvyn laddar', 'ingen rubrik') }

    await page.getByRole('navigation', { name: /konsultportal — avsnitt/i }).getByRole('link', { name: /^deltagare$/i }).click(); await page.waitForTimeout(2500)
    await page.screenshot({ path: path.join(OUT, '02-deltagare.png'), fullPage: true })
    const namn = ['Anna Exempel', 'Omar Demo', 'Lisa Fiktiv', 'Erik Testsson', 'Fatima Exempel']
    const synliga = []
    for (const n of namn) if (await page.getByText(n, { exact: false }).first().isVisible().catch(() => false)) synliga.push(n)
    if (synliga.length === 5) { ok('fem fiktiva deltagare i listan') } else { fel('fem fiktiva deltagare i listan', `såg ${synliga.length}: ${synliga.join(', ')}`) }

    await page.getByText('Anna Exempel', { exact: false }).first().click(); await page.waitForTimeout(3000)
    await page.screenshot({ path: path.join(OUT, '03-anna.png'), fullPage: true })
    const journal = await page.getByText(/intervju hos Exempel Transport/i).first().isVisible().catch(() => false)
    const mal = await page.getByText(/Tre ansökningar per vecka/i).first().isVisible().catch(() => false)
    if (journal || mal) { ok('deltagarsidan visar seedad journal/mål', `journal=${journal} mål=${mal}`) } else { fel('deltagarsidan visar seedad journal/mål', 'ingen av texterna syns (kan ligga bakom en flik)') }

    await page.goto(`${BASE}/#/consultant`); await page.waitForTimeout(1500)
    const org = page.getByRole('navigation', { name: /konsultportal — avsnitt/i }).getByRole('link', { name: /inställningar/i })
    if (await org.isVisible().catch(() => false)) { await org.click(); await page.waitForTimeout(2500); await page.screenshot({ path: path.join(OUT, '04-installningar.png'), fullPage: true }); ok('inställningar/organisation nås') }
  } catch (e) { fel('oväntat', e) } finally { await b.close() }
  const antalFel = resultat.filter((r) => r[0] === 'FEL').length
  console.log(`\n${resultat.length - antalFel}/${resultat.length} steg OK`); process.exit(antalFel ? 1 : 0)
})()
