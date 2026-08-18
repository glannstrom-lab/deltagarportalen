/**
 * Mäter var sidans bredd tar vägen: innehållskolumn, rådgivarkolumn, skena.
 *
 *   node e2e/mat-kolumner.cjs [bredd]
 *
 * Frågan skriptet svarar på: reserverar layouten plats för en rådgivarkolumn
 * som inte har något att visa? En tom 300 px-kolumn ser exakt likadan ut som
 * marginal, men är innehåll som aldrig kommer.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const BAS = process.env.BASE_URL || 'http://localhost:3000'
const bredd = Number(process.argv[2] || 1440)

const SIDOR = [
  '/oversikt', '/jobb', '/karriar', '/resurser', '/min-vardag',
  '/job-search', '/applications', '/spontanansökan', '/cover-letter',
  '/interview-simulator', '/salary', '/linkedin-optimizer', '/international',
  '/career', '/interest-guide', '/skills-gap-analysis', '/personal-brand',
  '/education', '/knowledge-base', '/resources', '/print-resources',
  '/externa-resurser', '/ai-team', '/nätverk', '/wellness', '/diary',
  '/calendar', '/exercises', '/my-consultant', '/profile', '/help', '/settings',
]

;(async () => {
  const statePath = path.join(__dirname, '.auth', 'state.json')
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: bredd, height: 900 },
    storageState: fs.existsSync(statePath) ? statePath : undefined,
  })
  const page = await context.newPage()
  console.log('rutt'.padEnd(24), 'innehåll', 'rådgiv', 'tom?', 'skena')
  for (const rutt of SIDOR) {
    await page.goto(`${BAS}/#${rutt}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1300)
    const m = await page.evaluate(() => {
      const rad = document.querySelector('[data-focus-chrome="radgivare"]')
      const skena = document.querySelector('[data-skena]')
      const grid = rad?.parentElement
      const innehall = grid?.firstElementChild
      const r = (el) => (el ? Math.round(el.getBoundingClientRect().width) : null)
      return {
        innehall: r(innehall),
        radgivare: r(rad),
        radHojd: rad ? Math.round(rad.getBoundingClientRect().height) : null,
        radTom: rad ? rad.textContent.trim().length === 0 : null,
        skena: r(skena),
      }
    })
    console.log(
      rutt.padEnd(24),
      String(m.innehall).padStart(8),
      String(m.radgivare).padStart(6),
      String(m.radTom).padStart(5),
      String(m.skena).padStart(5)
    )
  }
  await browser.close()
})()
