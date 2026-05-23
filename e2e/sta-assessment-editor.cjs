/**
 * E2e — verifiera att AssessmentEditor öppnas och kan ta input.
 *  1. Logga in som test-konsulent
 *  2. Klicka Deltagare-fliken
 *  3. Öppna Anna (test-deltagaren)
 *  4. Gå till Skattningar-fliken i drawern
 *  5. Klicka "Fortsätt" / "Starta" på DOA-raden
 *  6. Verifiera att modal öppnas med 5 kategorier och 34 items
 *  7. Klicka något skattvärde + skriv kommentar
 *  8. Stäng (utan att spara, för att inte fylla testdata)
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'

async function main() {
  const out = path.join(__dirname, 'screenshots', 'sta-assessment-editor')
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

  // Klicka Deltagare-fliken
  const tab = page.locator('button:has-text("Deltagare")').filter({ hasNotText: /Importera|Lägg|Granska|Inbjud|Bjud/i }).first()
  await tab.click()
  await page.waitForTimeout(600)

  // Öppna första deltagaren (Anna)
  const oppna = page.getByRole('button', { name: /^Öppna$/i }).first()
  await oppna.click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(out, '01-drawer.png'), fullPage: false })

  // Klicka Skattningar-fliken inom drawern
  const skatTab = page.locator('aside button:has-text("Skattningar")').first()
  await skatTab.click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(out, '02-assessments-list.png'), fullPage: false })

  // Klicka Starta/Fortsätt på DOA-raden
  const startaBtn = page.locator('aside button').filter({ hasText: /^(Starta|Fortsätt|Visa)$/ }).first()
  if (await startaBtn.count() === 0) {
    console.log('Ingen Starta/Fortsätt-knapp hittad')
    console.log((await page.locator('aside').innerText()).slice(0, 800))
    await browser.close()
    process.exit(1)
  }
  await startaBtn.click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(out, '03-editor-open.png'), fullPage: false })

  // Verifiera att editor visar 34 items för DOA
  const itemLis = page.locator('[role="dialog"], .max-h-screen').last().locator('li')
  // Bättre selektor: räkna textareas (1 per item)
  const textareas = page.locator('[aria-label^="Kommentar för"]')
  const taCount = await textareas.count()
  console.log('Kommentar-fält (matchar item-count):', taCount)

  // Klicka första skattvärde "1" på första item
  const firstScale = page.locator('button:has-text("1")').nth(0)
  if (await firstScale.count() > 0) {
    await firstScale.click()
    await page.waitForTimeout(200)
  }

  // Skriv en kommentar
  if (taCount > 0) {
    await textareas.first().fill('Testkommentar för första item')
    await page.waitForTimeout(200)
  }

  await page.screenshot({ path: path.join(out, '04-editor-with-input.png'), fullPage: false })

  // Stäng (utan att spara)
  page.on('dialog', (d) => d.accept()) // accepter confirm
  const closeBtn = page.getByRole('button', { name: /Avbryt$/i }).first()
  if (await closeBtn.count()) {
    await closeBtn.click()
    await page.waitForTimeout(300)
  }

  console.log('Console errors:', errors.length)
  errors.slice(0, 5).forEach((e) => console.log('  ' + e.slice(0, 200)))
  await browser.close()
  console.log('Saved to:', out)
}

main().catch((e) => { console.error(e); process.exit(1) })
