/**
 * STA smoke-test — verifierar att routes är registrerade, att appen laddar
 * utan JS-fel, och att auth-gating fungerar.
 *
 * Kör: node e2e/sta-smoke.cjs
 */
const { chromium } = require('@playwright/test')

const BASE = process.env.BASE || 'http://localhost:3000'

async function probeRoute(page, path, expectations) {
  const errors = []
  page.removeAllListeners('pageerror')
  page.removeAllListeners('console')
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      // Filtrera bort förväntade auth-relaterade fel
      if (!text.includes('401') && !text.includes('UNAUTHORIZED')) {
        errors.push(`console.error: ${text.slice(0, 200)}`)
      }
    }
  })

  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForTimeout(800)

  const url = page.url()
  const title = await page.title()
  const bodyText = (await page.locator('body').innerText()).slice(0, 200)

  return { url, title, bodyText, errors, ...expectations }
}

;(async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  const page = await context.newPage()

  const results = []

  // 1. Landing/login — borde rendera utan fel
  results.push({ test: 'landing', ...(await probeRoute(page, '/', {})) })

  // 2. /steg-till-arbete — utan auth → redirect till login
  results.push({ test: 'sta-participant (utan auth)', ...(await probeRoute(page, '/steg-till-arbete', {})) })

  // 3. /konsulent/steg-till-arbete — utan auth → redirect
  results.push({ test: 'sta-consultant (utan auth)', ...(await probeRoute(page, '/konsulent/steg-till-arbete', {})) })

  // 4. /konsulent/steg-till-arbete/dokument/X/Y — auth-gated route med params
  results.push({
    test: 'sta-document (utan auth)',
    ...(await probeRoute(page, '/konsulent/steg-till-arbete/dokument/test-id/delredovisning_1', {})),
  })

  await browser.close()

  console.log('\n=== STA Smoke-test resultat ===\n')
  for (const r of results) {
    console.log(`▶ ${r.test}`)
    console.log(`  URL efter navigering: ${r.url}`)
    console.log(`  Sidotitel: ${r.title}`)
    console.log(`  Innehåll (start): ${r.bodyText.replace(/\s+/g, ' ').slice(0, 120)}…`)
    if (r.errors.length === 0) {
      console.log(`  Fel: inga`)
    } else {
      console.log(`  Fel (${r.errors.length}):`)
      r.errors.forEach((e) => console.log(`    - ${e}`))
    }
    console.log()
  }
})()
