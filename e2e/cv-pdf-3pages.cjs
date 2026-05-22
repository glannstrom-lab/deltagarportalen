/**
 * Testar 3-sidors-rendering genom att lägga 12 jobb via ?jobs=12-flaggan.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEMPLATES = ['sidebar', 'nordic', 'budapest', 'manhattan', 'berlin', 'centered']

async function main() {
  const outDir = path.join(__dirname, '..', 'audit-2026-05-22', 'cv-pdf-3pages')
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1280, height: 1600 } })
  await context.addInitScript(() => {
    localStorage.setItem('jobin_cookie_consent', 'true')
    localStorage.setItem('jobin_cookie_preferences', JSON.stringify({ necessary: true, analytics: false }))
  })

  const page = await context.newPage()
  page.on('pageerror', (e) => console.log(`  [pageerror] ${e.message}`))

  for (const tpl of TEMPLATES) {
    console.log(`\n=== ${tpl} (12 jobs) ===`)
    const url = `${BASE_URL}/#/print/cv?demo=mikael&template=${tpl}&jobs=12&manual=1`
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    try {
      await page.locator('.cv-print-root').waitFor({ state: 'attached', timeout: 15000 })
    } catch (e) {
      console.log(`  ✗ ${e.message.slice(0, 100)}`)
      continue
    }
    await page.waitForTimeout(1200)

    const dims = await page.evaluate(() => {
      const r = document.querySelector('.cv-print-root')
      return { dataPages: r?.getAttribute('data-pages'), dataNatural: r?.getAttribute('data-natural') }
    })
    console.log(`  pages=${dims.dataPages}, natural=${dims.dataNatural}px`)

    const pdfOut = path.join(outDir, `${tpl}-12jobs.pdf`)
    try {
      await page.pdf({ path: pdfOut, printBackground: true, preferCSSPageSize: true })
      console.log(`  ✓ pdf saved`)
    } catch (e) {
      console.log(`  ✗ pdf failed: ${e.message.slice(0, 200)}`)
    }
  }

  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
