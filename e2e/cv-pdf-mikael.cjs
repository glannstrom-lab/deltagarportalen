/**
 * Genererar PDF för alla 9 mallar med Mikaels CV-data (5 jobb, 2 utb)
 * via dev-routen /#/pdf-test/<id>. Sparar till e2e/screenshots/mikael-<id>.pdf
 *
 * Test-fixturen ligger i client/src/pages/PDFTestSnapshot.tsx.
 *
 * Usage: node e2e/cv-pdf-mikael.cjs
 */

const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEMPLATES = ['sidebar', 'centered', 'minimal', 'creative', 'executive', 'nordic', 'budapest', 'rotterdam', 'chicago']

async function main() {
  const outDir = path.join(__dirname, 'screenshots')
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    acceptDownloads: true,
  })
  await context.addInitScript(() => {
    localStorage.setItem('jobin_cookie_consent', 'true')
    localStorage.setItem('jobin_cookie_preferences', JSON.stringify({ necessary: true, analytics: false }))
  })
  const page = await context.newPage()
  page.on('pageerror', (err) => console.log(`[pageerror] ${err.message}`))

  for (const tpl of TEMPLATES) {
    console.log(`\n${tpl}`)
    await page.goto(`${BASE_URL}/#/pdf-test/${tpl}`, { waitUntil: 'domcontentloaded' })
    // Vänta tills download-länken renderats (PDF genererad)
    try {
      await page.locator('#download-pdf').waitFor({ state: 'visible', timeout: 30000 })
    } catch (e) {
      console.log(`  ✗ Inte renderat: ${e.message.slice(0, 100)}`)
      continue
    }
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 })
    await page.locator('#download-pdf').click()
    try {
      const download = await downloadPromise
      const out = path.join(outDir, `mikael-${tpl}.pdf`)
      await download.saveAs(out)
      const size = fs.statSync(out).size
      console.log(`  ✓ ${path.basename(out)} (${(size / 1024).toFixed(1)} kB)`)
    } catch (e) {
      console.log(`  ✗ Download-fel: ${e.message.slice(0, 100)}`)
    }
  }

  await browser.close()
}

main().catch((err) => { console.error(err); process.exit(1) })
