/**
 * Snapshot av Deltagare-fliken med 4 test-deltagare.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'

async function main() {
  const out = path.join(__dirname, 'screenshots', 'sta-participants')
  fs.mkdirSync(out, { recursive: true })
  const authState = path.join(__dirname, '.auth', 'consultant.json')

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    storageState: authState,
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  await page.goto(`${BASE}/#/konsulent/steg-till-arbete`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const cookieBtn = page.getByRole('button', { name: /Acceptera|Godkänn|Endast nödvändiga/i }).first()
  if (await cookieBtn.count()) {
    await cookieBtn.click({ timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(300)
  }

  // Klicka Deltagare-fliken (via ConsultantTabs)
  const tab = page.locator('button:has-text("Deltagare")').filter({ hasNotText: /Importera|Lägg|Granska|Inbjud|Bjud/i }).first()
  await tab.waitFor({ state: 'visible', timeout: 10000 })
  await tab.click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(out, '01-default.png'), fullPage: true })

  // Klicka kolumnrubrik Tid kvar för att flippa sort-riktning
  const tidKvar = page.getByRole('button', { name: /^Tid kvar/i }).first()
  if (await tidKvar.count()) {
    await tidKvar.click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(out, '02-sort-tidkvar-desc.png'), fullPage: false })
  }

  // Klicka Namn för att sortera alfabetiskt
  const nameTh = page.getByRole('button', { name: /^Deltagare/i }).first()
  if (await nameTh.count()) {
    await nameTh.click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(out, '03-sort-name-asc.png'), fullPage: false })
  }

  // Status-filter: visa Pausade
  const statusSelect = page.locator('select[aria-label="Filtrera på status"]')
  if (await statusSelect.count()) {
    await statusSelect.selectOption('paused')
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(out, '04-filter-paused.png'), fullPage: false })
    await statusSelect.selectOption('active')
    await page.waitForTimeout(300)
  }

  // Link-status-filter: Inte på Jobin
  const linkSelect = page.locator('select[aria-label="Filtrera på koppling"]')
  if (await linkSelect.count()) {
    await linkSelect.selectOption('not_on_jobin')
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(out, '05-filter-not-on-jobin.png'), fullPage: false })
    await linkSelect.selectOption('all')
    await page.waitForTimeout(300)
  }

  console.log('Console errors:', errors.length)
  errors.slice(0, 5).forEach((e) => console.log('  ' + e.slice(0, 200)))
  await browser.close()
  console.log('Saved to:', out)
}

main().catch((e) => { console.error(e); process.exit(1) })
