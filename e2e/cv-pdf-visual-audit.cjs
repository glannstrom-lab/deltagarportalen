/**
 * CV PDF visuell audit — genererar PDF för ALLA mallar i tre varianter via
 * samma pipeline som prod (Chrome page.pdf med preferCSSPageSize +
 * printBackground, se client/api/cv-pdf.js):
 *
 *   - std:  demo=mikael (4 jobb → 1 sida)
 *   - long: demo=mikael&jobs=12 (→ 2 sidor, testar sidbrytningar)
 *   - 3p:   demo=mikael&jobs=20 (→ 3 sidor, testar mellansidor)
 *
 * Konverterar varje PDF till en PNG per sida via pdftoppm (poppler) om det
 * finns i PATH. Detta är den visuella verifieringsloopen för print-layouten
 * i CVPrintLayout.tsx (säkerhetszoner sida 2+, canvas-bg på alla sidor).
 *
 * Körning:  node e2e/cv-pdf-visual-audit.cjs        (kräver dev-server på :3000)
 * Output:   cv-prints/visual-audit/<template>-<variant>[-<sida>].pdf/png
 */

const { chromium } = require('@playwright/test')
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const OUT_DIR = path.join(__dirname, '..', 'cv-prints', 'visual-audit')
const TEMPLATES = [
  'sidebar', 'centered', 'minimal', 'creative', 'executive',
  'nordic', 'budapest', 'rotterdam', 'chicago',
  'atelier', 'manhattan', 'berlin',
]
const VARIANTS = [
  { suffix: 'std', query: '' },
  { suffix: 'long', query: '&jobs=12' },
  { suffix: '3p', query: '&jobs=20' },
]

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  // channel: 'chrome' = systemets Chrome — samma motor som prod-pipelinen
  const browser = await chromium.launch({ channel: 'chrome' })
  const context = await browser.newContext({ viewport: { width: 1280, height: 1600 } })
  await context.addInitScript(() => {
    localStorage.setItem('jobin_cookie_consent', 'true')
    localStorage.setItem('jobin_cookie_preferences', JSON.stringify({ necessary: true, analytics: false }))
  })
  const page = await context.newPage()
  page.on('pageerror', (err) => console.log(`  [pageerror] ${err.message}`))

  for (const tpl of TEMPLATES) {
    for (const v of VARIANTS) {
      const url = `${BASE_URL}/#/print/cv?demo=mikael&template=${tpl}&manual=1${v.query}`
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      // Hash-navigering laddar inte om SPA:n — utan reload läcker förra
      // körningens jobs-expanderade state in i nästa (titlar som "#1 #9").
      await page.reload({ waitUntil: 'domcontentloaded' })
      try {
        await page.locator('.cv-preview').first().waitFor({ state: 'attached', timeout: 15000 })
      } catch {
        console.log(`✗ ${tpl}-${v.suffix}: ingen cv-preview`)
        continue
      }
      await page.waitForTimeout(900)
      try { await page.evaluate(() => document.fonts && document.fonts.ready) } catch { /* ignore */ }
      // extra settle efter jobs-expansion (andra useEffect-pass i PrintCV)
      await page.waitForTimeout(400)
      const pdfOut = path.join(OUT_DIR, `${tpl}-${v.suffix}.pdf`)
      try {
        await page.pdf({ path: pdfOut, printBackground: true, preferCSSPageSize: true })
        console.log(`✓ ${tpl}-${v.suffix}.pdf (${(fs.statSync(pdfOut).size / 1024).toFixed(0)} kB)`)
      } catch (e) {
        console.log(`✗ ${tpl}-${v.suffix}: pdf() failed: ${e.message.slice(0, 150)}`)
      }
    }
  }
  await browser.close()

  // PDF → PNG per sida (för visuell granskning)
  try {
    for (const f of fs.readdirSync(OUT_DIR).filter((n) => n.endsWith('.pdf'))) {
      const base = f.replace(/\.pdf$/, '')
      execFileSync('pdftoppm', ['-png', '-r', '100', path.join(OUT_DIR, f), path.join(OUT_DIR, base)])
    }
    console.log('PNG-konvertering klar.')
  } catch {
    console.log('pdftoppm saknas — hoppar över PNG-konvertering.')
  }
  console.log(`Output: ${OUT_DIR}`)
}

main().catch((err) => { console.error(err); process.exit(1) })
