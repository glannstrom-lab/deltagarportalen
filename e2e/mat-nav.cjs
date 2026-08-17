/**
 * Mäter navigationens höjd och tar skärmbild. (Steg 2-finjustering, 2026-08-17)
 *
 *   node e2e/mat-nav.cjs [route] [bredd]
 *
 * Chrome-höjd är inte en smaksak utan ett tal: allt som toppnaven tar går från
 * sidans innehåll. Att mäta det slår att titta och tycka.
 */
const { chromium } = require('@playwright/test')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const route = process.argv[2] || '/applications'
const bredd = Number(process.argv[3] || 1440)

;(async () => {
  const b = await chromium.launch()
  const ctx = await b.newContext({
    viewport: { width: bredd, height: 900 },
    storageState: path.join(ROOT, 'e2e/.auth/state.json'),
  })
  const p = await ctx.newPage()
  await p.goto(`http://localhost:3000/#${route}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1500)

  // Avfärda onboardingmodaler så de inte skymmer sidan i skärmbilden.
  for (const etikett of ['Hoppa över', 'Stäng', 'Skip']) {
    const knapp = p.getByRole('button', { name: new RegExp(etikett, 'i') }).first()
    if (await knapp.count().catch(() => 0)) {
      await knapp.click({ timeout: 1500 }).catch(() => {})
      await p.waitForTimeout(600)
    }
  }
  await p.keyboard.press('Escape').catch(() => {})
  await p.waitForTimeout(600)

  const m = await p.evaluate(() => {
    const r = (el) => (el ? Math.round(el.getBoundingClientRect().height) : null)
    const header = document.querySelector('header')
    const sub = document.querySelector('nav[aria-label*="ndersidor"]')
    const kat = document.querySelector('nav[aria-label*="uvudkategorier"]')
    const main = document.querySelector('#main-content')
    return {
      topbar: r(header),
      undersidesrad: r(sub),
      kategorirad: r(kat),
      totalChrome: (r(header) || 0) + (r(sub) || 0),
      innehallBorjar: main ? Math.round(main.getBoundingClientRect().top) : null,
      // Klipps någon kategoritext?
      klippta: [...document.querySelectorAll('nav a')]
        .filter((a) => a.scrollWidth > a.clientWidth + 1)
        .map((a) => a.textContent.trim()),
    }
  })
  console.log(JSON.stringify(m, null, 2))
  await p.screenshot({ path: path.join(ROOT, `e2e/screenshots/nav-${bredd}.png`) })
  await b.close()
})()
