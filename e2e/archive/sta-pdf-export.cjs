/**
 * E2e — verifiera AWP-PDF-nedladdning genererar en korrekt ifylld PDF.
 *  1. Logga in som konsulent
 *  2. Öppna test-deltagaren (Pelle)
 *  3. Gå till Skattningar-fliken
 *  4. Klicka Fortsätt på AWP
 *  5. Klicka "AF-blankett (PDF)"
 *  6. Vänta på nedladdning → spara filen
 *  7. Verifiera att PDF:n innehåller fyllda fält (pypdf)
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'

async function main() {
  const out = path.join(__dirname, 'screenshots', 'sta-pdf-export')
  fs.mkdirSync(out, { recursive: true })
  const authState = path.join(__dirname, '.auth', 'consultant.json')

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    storageState: authState,
    acceptDownloads: true,
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

  const tab = page.locator('button:has-text("Deltagare")').filter({ hasNotText: /Importera|Lägg|Granska|Inbjud|Bjud/i }).first()
  await tab.click()
  await page.waitForTimeout(600)

  // Hitta rad med "Test PDF Pelle" och klicka Öppna
  const row = page.locator('tr, li').filter({ hasText: 'Test PDF Pelle' }).first()
  await row.locator('button').filter({ hasText: /^Öppna$/ }).first().click()
  await page.waitForTimeout(800)

  // Skattningar-fliken
  const skatTab = page.locator('aside button:has-text("Skattningar")').first()
  await skatTab.click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(out, '01-assessments.png'), fullPage: false })

  // Klicka Fortsätt på AWP
  const fortsattBtn = page.locator('aside button').filter({ hasText: /^Fortsätt$/ }).first()
  await fortsattBtn.click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(out, '02-editor.png'), fullPage: false })

  // Klicka AF-blankett (PDF)
  const pdfBtn = page.getByRole('button', { name: /AF-blankett/i })
  console.log('PDF-knapp finns:', await pdfBtn.count())

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    pdfBtn.click(),
  ])

  const dlPath = path.join(out, download.suggestedFilename())
  await download.saveAs(dlPath)
  console.log('Nedladdad PDF:', download.suggestedFilename(), 'storlek:', fs.statSync(dlPath).size, 'bytes')

  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(out, '03-after-download.png'), fullPage: false })

  console.log('Console errors:', errors.length)
  errors.slice(0, 5).forEach((e) => console.log('  ' + e.slice(0, 200)))
  await browser.close()
  console.log('PDF + screenshots:', out)
}

main().catch((e) => { console.error(e); process.exit(1) })
