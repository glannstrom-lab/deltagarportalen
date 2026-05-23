/** Snapshot av AWP-editor med multi-bedömning. */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'

async function main() {
  const out = path.join(__dirname, 'screenshots', 'sta-awp-multi')
  fs.mkdirSync(out, { recursive: true })
  const auth = path.join(__dirname, '.auth', 'consultant.json')

  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, storageState: auth })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  await page.goto(`${BASE}/#/konsulent/steg-till-arbete`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  const cookie = page.getByRole('button', { name: /Acceptera|Godkänn|Endast nödvändiga/i }).first()
  if (await cookie.count()) { await cookie.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(300) }

  const tab = page.locator('button:has-text("Deltagare")').filter({ hasNotText: /Importera|Lägg|Granska|Inbjud|Bjud/i }).first()
  await tab.click()
  await page.waitForTimeout(600)

  const row = page.locator('tr, li').filter({ hasText: 'Test Multi Pelle' }).first()
  await row.locator('button').filter({ hasText: /^Öppna$/ }).first().click()
  await page.waitForTimeout(800)

  const skatTab = page.locator('aside button:has-text("Skattningar")').first()
  await skatTab.click()
  await page.waitForTimeout(400)

  const startaBtn = page.locator('aside button').filter({ hasText: /^(Starta|Fortsätt|Visa)$/ }).first()
  await startaBtn.click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(out, '01-editor-bed1.png'), fullPage: false })

  // Lägg till bedömning 2
  const addBtn = page.getByRole('button', { name: /Lägg till bedömning/i })
  if (await addBtn.count()) {
    await addBtn.click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(out, '02-editor-bed2.png'), fullPage: false })
  }

  // Lägg till bedömning 3
  if (await addBtn.count()) {
    await addBtn.click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(out, '03-editor-bed3.png'), fullPage: false })
  }

  // Klicka tillbaka till bedömning 1
  const bed1 = page.getByRole('button', { name: /Bedömning 1/i }).first()
  if (await bed1.count()) {
    await bed1.click()
    await page.waitForTimeout(200)
    await page.screenshot({ path: path.join(out, '04-back-to-bed1.png'), fullPage: false })
  }

  console.log('Console errors:', errors.length)
  errors.slice(0, 5).forEach((e) => console.log('  ' + e.slice(0, 200)))
  await browser.close()
  console.log('Saved to:', out)
}

main().catch((e) => { console.error(e); process.exit(1) })
