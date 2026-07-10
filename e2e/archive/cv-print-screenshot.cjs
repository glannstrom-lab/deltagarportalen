/**
 * Tar screenshots av print-route i screen-mode för debugging.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEMPLATES = ['sidebar', 'nordic', 'budapest', 'manhattan', 'berlin']

async function main() {
  const outDir = path.join(__dirname, '..', 'audit-2026-05-22', 'cv-print-screen')
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1280, height: 1600 } })
  await context.addInitScript(() => {
    localStorage.setItem('jobin_cookie_consent', 'true')
    localStorage.setItem('jobin_cookie_preferences', JSON.stringify({ necessary: true, analytics: false }))
  })

  const page = await context.newPage()
  for (const tpl of TEMPLATES) {
    const url = `${BASE_URL}/#/print/cv?demo=mikael&template=${tpl}&manual=1`
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.locator('.cv-print-root').waitFor({ state: 'attached', timeout: 15000 })
    await page.waitForTimeout(800)

    const dims = await page.evaluate(() => {
      const r = document.querySelector('.cv-print-root')
      const p = document.querySelector('.cv-preview')
      return {
        rootWidth: r?.getBoundingClientRect().width,
        rootHeight: r?.scrollHeight,
        previewWidth: p?.getBoundingClientRect().width,
        previewHeight: p?.scrollHeight,
      }
    })
    console.log(`${tpl}: root=${dims.rootWidth}x${dims.rootHeight} preview=${dims.previewWidth}x${dims.previewHeight}`)
    await page.screenshot({ path: path.join(outDir, `${tpl}.png`), fullPage: true })
  }

  await browser.close()
}

main().catch((err) => { console.error(err); process.exit(1) })
