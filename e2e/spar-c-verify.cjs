/**
 * Verifiering av spår C mot prod: navigationen fungerar efter att
 * VITE_HUB_NAV_ENABLED + legacy-grenarna togs bort.
 *  1. Index-redirect: / → /oversikt
 *  2. Desktop-sidebar: 5 hubblänkar, aktiv hub expanderar underlänkar
 *  3. Mobil: HubBottomNav (5 flikar) + hamburgermenyn (navGroups) öppnas
 *
 *   node e2e/spar-c-verify.cjs
 */
const { chromium } = require('@playwright/test')
const path = require('path')

const BASE = process.env.BASE_URL || 'https://www.jobin.se'
const STATE = path.join(__dirname, '.auth', 'spontan-prod.json')
const SHOTS = path.join(__dirname, 'screenshots', 'spontan-verify')

const results = []
const pass = (n) => { results.push(['PASS', n]); console.log('  PASS', n) }
const fail = (n, e) => { results.push(['FAIL', `${n} — ${e}`]); console.log('  FAIL', n, '—', String(e).split('\n')[0]) }
async function check(name, fn) { try { await fn(); pass(name) } catch (e) { fail(name, e) } }

async function main() {
  const browser = await chromium.launch()

  // Desktop
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: STATE })
  const page = await ctx.newPage()

  await check('Index-redirect / → /oversikt', async () => {
    await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3500)
    if (!page.url().includes('/oversikt')) throw new Error(`hamnade på ${page.url()}`)
  })

  await check('Sidebar: 5 hubblänkar', async () => {
    for (const label of ['Översikt', 'Söka jobb', 'Karriär', 'Resurser', 'Din vardag']) {
      await page.locator('aside').getByRole('link', { name: new RegExp(label, 'i') }).first().waitFor({ state: 'visible', timeout: 5000 })
    }
  })

  await check('Aktiv hub expanderar underlänkar (/cv → Söka jobb)', async () => {
    await page.goto(`${BASE}/#/cv`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
    await page.locator('aside').getByRole('link', { name: /^CV$/i }).first().waitFor({ state: 'visible', timeout: 5000 })
  })
  await page.screenshot({ path: path.join(SHOTS, '18-sidebar-c3.png') })
  await ctx.close()

  // Mobil
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: STATE })
  const mpage = await mctx.newPage()

  await check('Mobil: HubBottomNav med 5 flikar', async () => {
    await mpage.goto(`${BASE}/#/oversikt`, { waitUntil: 'domcontentloaded' })
    await mpage.waitForTimeout(3500)
    const nav = mpage.getByRole('navigation', { name: /hubnavigering/i })
    await nav.waitFor({ state: 'visible', timeout: 5000 })
    const links = await nav.getByRole('link').count()
    if (links !== 5) throw new Error(`${links} flikar`)
  })

  await check('Mobil: hamburgermenyn (navGroups) öppnas', async () => {
    await mpage.getByRole('button', { name: /meny/i }).first().click()
    await mpage.waitForTimeout(800)
    // Menyn ska visa gruppnavigation med sidlänkar
    const dialog = mpage.getByRole('dialog')
    await dialog.waitFor({ state: 'visible', timeout: 5000 })
    const linkCount = await dialog.getByRole('link').count()
    if (linkCount < 10) throw new Error(`bara ${linkCount} länkar i menyn`)
  })
  await mpage.screenshot({ path: path.join(SHOTS, '19-mobilmeny-c3.png') })
  await mctx.close()

  await browser.close()
  console.log('\n================ RESULTAT ================')
  for (const [s, n] of results) console.log(`${s}  ${n}`)
  process.exit(results.some(r => r[0] === 'FAIL') ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
