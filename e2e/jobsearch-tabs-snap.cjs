/**
 * Screenshots av jobbsöksidans alla flikar (desktop + mobil) för visuell
 * granskning. Återanvänder inloggat state från e2e/.auth/state.json
 * (skapas av cv-screenshot.cjs vid behov).
 *
 * Usage: node e2e/jobsearch-tabs-snap.cjs   (kräver dev-server på :3000)
 * Output: e2e/screenshots/jobsearch-*.png
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const OUT = path.join(__dirname, 'screenshots')
const STATE = path.join(__dirname, '.auth', 'state.json')

const TABS = [
  { hash: '/job-search', slug: 'sok' },
  { hash: '/job-search/daily', slug: 'daily' },
  { hash: '/job-search/slumpjobbet', slug: 'slumpjobbet' },
  { hash: '/job-search/saved', slug: 'saved' },
  { hash: '/job-search/matches', slug: 'matches' },
  { hash: '/job-search/alerts', slug: 'alerts-orphan' },
]

async function shootAll(context, sizeSlug) {
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  for (const tab of TABS) {
    await page.goto(`${BASE_URL}/#${tab.hash}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3500)
    await page.keyboard.press('Escape').catch(() => {})
    const out = path.join(OUT, `jobsearch-${tab.slug}-${sizeSlug}.png`)
    await page.screenshot({ path: out, fullPage: true })
    console.log(`  ✓ jobsearch-${tab.slug}-${sizeSlug}.png`)
  }
  // Extra desktop: öppna första jobbkortet (detaljmodal)
  if (sizeSlug === 'desktop') {
    await page.goto(`${BASE_URL}/#/job-search`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3500)
    const card = page.locator('[role="button"][aria-label]').first()
    if (await card.count()) {
      await card.click()
      await page.waitForTimeout(1500)
      await page.screenshot({ path: path.join(OUT, 'jobsearch-detaljmodal-desktop.png'), fullPage: false })
      console.log('  ✓ jobsearch-detaljmodal-desktop.png')
    }
  }
  if (errors.length) {
    console.log(`  Console errors (${sizeSlug}): ${errors.length}`)
    for (const e of [...new Set(errors)].slice(0, 6)) console.log('   - ' + e.slice(0, 160))
  }
  await page.close()
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  if (!fs.existsSync(STATE)) throw new Error('Kör e2e/cv-screenshot.cjs först (skapar login-state)')
  const browser = await chromium.launch({ channel: 'chrome' })

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: STATE })
  await desktop.addInitScript(() => { localStorage.setItem('jobin_cookie_consent', 'true') })
  console.log('Desktop:')
  await shootAll(desktop, 'desktop')

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: STATE, isMobile: true, hasTouch: true })
  await mobile.addInitScript(() => { localStorage.setItem('jobin_cookie_consent', 'true') })
  console.log('Mobil:')
  await shootAll(mobile, 'mobil')

  await browser.close()
}

main().catch((err) => { console.error(err); process.exit(1) })
