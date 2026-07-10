/**
 * CV PDF Audit — renderar PDF för ALLA mallar via samma Chrome-pipeline
 * som prod (Puppeteer + Chrome → page.pdf med preferCSSPageSize).
 *
 * Output:
 *   audit-2026-05-22/cv-pdf/<template>.pdf
 *   audit-2026-05-22/cv-pdf/<template>-page<N>.png
 *
 * Konverterar varje PDF till en lång PNG per sida via Chrome:s pdf-viewer.
 * Detta är vår "visuell verifiering"-loop.
 */

const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEMPLATES = [
  'sidebar', 'centered', 'minimal', 'creative', 'executive',
  'nordic', 'budapest', 'rotterdam', 'chicago',
  'atelier', 'manhattan', 'berlin',
]

async function main() {
  const outDir = path.join(__dirname, '..', 'audit-2026-05-22', 'cv-pdf')
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1600 },
  })
  await context.addInitScript(() => {
    localStorage.setItem('jobin_cookie_consent', 'true')
    localStorage.setItem('jobin_cookie_preferences', JSON.stringify({ necessary: true, analytics: false }))
  })

  const page = await context.newPage()
  page.on('pageerror', (err) => console.log(`  [pageerror] ${err.message}`))

  for (const tpl of TEMPLATES) {
    console.log(`\n=== ${tpl} ===`)
    const url = `${BASE_URL}/#/print/cv?demo=mikael&template=${tpl}&manual=1`
    await page.goto(url, { waitUntil: 'domcontentloaded' })

    // Vänta tills någon .cv-preview-instans renderats (PagedCVPrint kan ha flera)
    try {
      await page.locator('.cv-preview').first().waitFor({ state: 'attached', timeout: 15000 })
    } catch (e) {
      console.log(`  ✗ ingen cv-preview: ${e.message.slice(0, 100)}`)
      continue
    }
    // Vänta lite för fonts och layout-stabilisering
    await page.waitForTimeout(800)
    // Vänta tills fonts är klara
    try {
      await page.evaluate(() => document.fonts && document.fonts.ready)
    } catch { /* ignore */ }

    const pdfOut = path.join(outDir, `${tpl}.pdf`)
    try {
      // preferCSSPageSize=true så @page-regeln i print-CSS äger sidstorlek/margin
      // (matchar prod-pipelinen i client/api/cv-pdf.js).
      await page.pdf({
        path: pdfOut,
        printBackground: true,
        preferCSSPageSize: true,
      })
      const size = fs.statSync(pdfOut).size
      console.log(`  ✓ ${tpl}.pdf (${(size / 1024).toFixed(1)} kB)`)
    } catch (e) {
      console.log(`  ✗ pdf() failed: ${e.message.slice(0, 200)}`)
      continue
    }
  }

  // PNG-rendering: öppna varje PDF i en ny page och screenshota per sida
  const png = await context.newPage()
  const pdfs = fs.readdirSync(outDir).filter(f => f.endsWith('.pdf'))
  for (const pdfName of pdfs) {
    const tpl = pdfName.replace('.pdf', '')
    const url = `file:///${path.join(outDir, pdfName).replace(/\\/g, '/')}`
    await png.goto(url, { waitUntil: 'load' })
    await png.waitForTimeout(1200)
    const total = await png.evaluate(() => document.body.scrollHeight).catch(() => 0)
    const A4_PX = 1131 // viewport-höjd för 1 A4 @ 96dpi i Chrome:s pdfviewer
    const pages = Math.max(1, Math.ceil(total / A4_PX))
    console.log(`  ${tpl}: ~${pages} sidor (totalt ${total}px)`)
    for (let i = 0; i < Math.min(pages, 4); i++) {
      await png.evaluate((y) => window.scrollTo(0, y), i * A4_PX)
      await png.waitForTimeout(400)
      const pngOut = path.join(outDir, `${tpl}-page${i + 1}.png`)
      await png.screenshot({ path: pngOut, fullPage: false })
    }
  }

  await browser.close()
  console.log(`\nKlar. Output i ${outDir}`)
}

main().catch((err) => { console.error(err); process.exit(1) })
