/**
 * Mäter cv-print-root i print-mode för att förstå varför Budapest renderar
 * smalt. Aktiverar print-media och mäter dimensioner.
 */
const { chromium } = require('@playwright/test')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 794, height: 1123 } })
  await context.addInitScript(() => {
    localStorage.setItem('jobin_cookie_consent', 'true')
  })
  const page = await context.newPage()

  for (const tpl of ['budapest', 'sidebar', 'nordic', 'manhattan']) {
    const url = `${BASE_URL}/#/print/cv?demo=mikael&template=${tpl}&manual=1`
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.locator('.cv-print-root').waitFor({ state: 'attached', timeout: 15000 })
    await page.waitForTimeout(800)

    await page.emulateMedia({ media: 'print' })
    await page.waitForTimeout(300)

    const dims = await page.evaluate(() => {
      const r = document.querySelector('.cv-print-root')
      const p = document.querySelector('.cv-preview')
      const aside = document.querySelector('.cv-preview > aside')
      const main = document.querySelector('.cv-preview > main')
      const rRect = r?.getBoundingClientRect()
      const pRect = p?.getBoundingClientRect()
      const aRect = aside?.getBoundingClientRect()
      const mRect = main?.getBoundingClientRect()
      return {
        root: rRect ? `${rRect.width.toFixed(0)}x${rRect.height.toFixed(0)}` : null,
        preview: pRect ? `${pRect.width.toFixed(0)}x${pRect.height.toFixed(0)}` : null,
        aside: aRect ? `${aRect.width.toFixed(0)}x${aRect.height.toFixed(0)}` : null,
        main: mRect ? `${mRect.width.toFixed(0)}x${mRect.height.toFixed(0)}` : null,
        rootMinHeight: r ? r.style.minHeight : null,
        dataPages: r?.getAttribute('data-pages'),
        dataNatural: r?.getAttribute('data-natural'),
      }
    })
    console.log(`\n=== ${tpl} ===`)
    console.log(JSON.stringify(dims, null, 2))

    await page.emulateMedia({ media: 'screen' })
  }
  await browser.close()
}
main().catch(e => { console.error(e); process.exit(1) })
