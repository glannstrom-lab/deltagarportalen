/**
 * Genererar PDF för alla 9 CV-mallar via Playwright + Chrome page.pdf().
 * Det är samma kodpath som vi använder server-side i prod (Vercel function
 * med Puppeteer + @sparticuz/chromium).
 *
 * Använder /#/print/cv?demo=mikael&template=<id>&manual=1 så vi får
 * Mikaels rich test-data (5 jobb, 2 utb) utan login, och `manual=1`
 * stoppar auto window.print() som skulle blocka.
 *
 * Output: e2e/screenshots/print-<id>.pdf
 *
 * Usage: node e2e/cv-print-pdf.cjs
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
  })
  await context.addInitScript(() => {
    localStorage.setItem('jobin_cookie_consent', 'true')
    localStorage.setItem('jobin_cookie_preferences', JSON.stringify({ necessary: true, analytics: false }))
  })

  const page = await context.newPage()
  page.on('pageerror', (err) => console.log(`[pageerror] ${err.message}`))

  for (const tpl of TEMPLATES) {
    console.log(`\n${tpl}`)
    const url = `${BASE_URL}/#/print/cv?demo=mikael&template=${tpl}&manual=1`
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    // Vänta tills .cv-preview är synlig (CVPreview render klar)
    try {
      await page.locator('.cv-preview').waitFor({ state: 'visible', timeout: 15000 })
    } catch (e) {
      console.log(`  ✗ .cv-preview never appeared: ${e.message.slice(0, 100)}`)
      continue
    }
    // Vänta lite för fonts/images
    await page.waitForTimeout(500)

    // Aktivera print-media så @media print regler appliceras
    await page.emulateMedia({ media: 'print' })
    await page.waitForTimeout(200)

    const out = path.join(outDir, `print-${tpl}.pdf`)
    try {
      await page.pdf({
        path: out,
        format: 'A4',
        margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' },
        printBackground: true,
      })
      const size = fs.statSync(out).size
      console.log(`  ✓ ${path.basename(out)} (${(size / 1024).toFixed(1)} kB)`)
    } catch (e) {
      console.log(`  ✗ pdf() failed: ${e.message.slice(0, 100)}`)
    }

    // Återställ media
    await page.emulateMedia({ media: 'screen' })
  }

  await browser.close()
}

main().catch((err) => { console.error(err); process.exit(1) })
