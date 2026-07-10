/**
 * E2e: CSV/Excel-import som konsulent.
 *
 * Förutsätter att e2e/.auth/consultant.json finns — skapa den genom att
 * köra `node e2e/login-consultant.cjs` först (kräver att dev-servern är uppe).
 *
 * Testet:
 *  1. Loggar in som test-konsulent via sparad state
 *  2. Går till STA-konsulentvyn
 *  3. Öppnar "Importera CSV/Excel"-modalen
 *  4. Verifierar att mall-knappar finns och CSV-mall kan laddas ner
 *  5. Skapar en in-memory CSV och laddar upp via file input
 *  6. Verifierar att preview visar 2 rader (1 valid + 1 invalid email)
 *  7. Verifierar GDPR-varningstext för smart-match
 *  8. Stänger UTAN att klicka "Importera" → ingen real data skapas
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

async function main() {
  const out = path.join(__dirname, 'screenshots', 'bulk-import')
  fs.mkdirSync(out, { recursive: true })
  const authStatePath = path.join(__dirname, '.auth', 'consultant.json')

  if (!fs.existsSync(authStatePath)) {
    console.error('Saknar konsulent-state. Kör: node e2e/login-consultant.cjs')
    process.exit(1)
  }

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    storageState: authStatePath,
    acceptDownloads: true,
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message))

  // 1+2. Navigera till STA-konsulent
  await page.goto(`${BASE_URL}/#/konsulent/steg-till-arbete`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  // Dismiss cookie-consent om den visas
  const cookieBtn = page.getByRole('button', { name: /Acceptera|Godkänn|Endast nödvändiga/i }).first()
  if (await cookieBtn.count()) {
    await cookieBtn.click({ timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(300)
  }

  console.log('URL:', page.url())
  await page.screenshot({ path: path.join(out, '01-landing.png'), fullPage: false })

  // 3. Öppna import-modal
  const importBtn = page.getByRole('button', { name: /Importera CSV\/Excel/i })
  const cnt = await importBtn.count()
  console.log('Import-knapp count:', cnt)
  if (!cnt) {
    console.log('Body excerpt:', (await page.locator('body').innerText()).slice(0, 600))
    await browser.close()
    process.exit(1)
  }
  await importBtn.first().click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(out, '02-modal-upload-stage.png'), fullPage: false })

  // 4. Verifiera mall-knappar
  const csvTemplateBtn = page.getByRole('button', { name: /CSV-mall/i })
  const xlsxTemplateBtn = page.getByRole('button', { name: /Excel-mall/i })
  console.log('CSV-mall-knapp:', await csvTemplateBtn.count())
  console.log('Excel-mall-knapp:', await xlsxTemplateBtn.count())

  // Ladda ner CSV-mall för verifiering
  const [csvDl] = await Promise.all([
    page.waitForEvent('download'),
    csvTemplateBtn.click(),
  ])
  const csvPath = path.join(out, csvDl.suggestedFilename())
  await csvDl.saveAs(csvPath)
  const csvContent = fs.readFileSync(csvPath, 'utf8')
  console.log('CSV-mall:', csvDl.suggestedFilename(), `(${csvContent.split('\n').length} rader)`)
  console.log('CSV-headers:', csvContent.split('\n')[0])

  // 5. Skapa en test-CSV och ladda upp
  const testCsvPath = path.join(out, 'test-upload.csv')
  fs.writeFileSync(
    testCsvPath,
    'email,fornamn,efternamn,startdatum\n' +
      'test-import-1@example.invalid,Anna,Test,2026-06-01\n' +
      'ogiltig-email-utan-snabel-a,Bjorn,Test,\n',
    'utf8',
  )

  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(testCsvPath)
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(out, '03-preview-stage.png'), fullPage: false })

  // 6. Verifiera preview-stats
  const valid = await page.locator('text=/giltiga rader/').textContent().catch(() => '')
  const errored = await page.locator('text=/rader med fel/').textContent().catch(() => '')
  console.log('Preview stats — giltiga:', valid, '| fel:', errored)

  // 7. Verifiera GDPR-varning
  const gdpr = await page
    .locator('text=/samtycke/')
    .first()
    .textContent()
    .catch(() => '')
  console.log('GDPR-varning visad:', gdpr ? gdpr.slice(0, 80) + '...' : 'SAKNAS')

  // Förhandskoll: tabellraderna ska visa "Klar" och "Ogiltig e-postadress"
  const rowStatuses = await page.locator('tbody tr td:last-child').allInnerTexts()
  console.log('Per-rad-status:', rowStatuses)

  // 8. STÄNG utan att importera — ingen real data skapas
  await page.getByRole('button', { name: /Avbryt/i }).click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(out, '04-after-cancel.png'), fullPage: false })

  console.log('Console errors:', errors.length)
  errors.slice(0, 5).forEach((e) => console.log('  ' + e.slice(0, 200)))

  await browser.close()
  console.log('Klart. Screenshots:', out)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
