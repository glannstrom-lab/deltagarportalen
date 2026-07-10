/**
 * LCP-baseline mot prod (D6, ROADMAP). Mäter Largest Contentful Paint
 * med PerformanceObserver i riktig Chromium, 3 körningar per sida,
 * rapporterar median. Kör med kall cache per körning (ny context).
 *
 *   node e2e/lcp-baseline.cjs            # landning + inloggad översikt
 *   BASE_URL=... node e2e/lcp-baseline.cjs
 */
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const BASE = process.env.BASE_URL || 'https://www.jobin.se'
const STATE = path.join(__dirname, '.auth', 'spontan-prod.json')
const RUNS = 3

async function measureLCP(browser, url, storageState) {
  const samples = []
  for (let i = 0; i < RUNS; i++) {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      ...(storageState ? { storageState } : {}),
    })
    const page = await ctx.newPage()
    await page.addInitScript(() => {
      window.__lcp = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__lcp = entry.startTime
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    })
    await page.goto(url, { waitUntil: 'load' })
    await page.waitForTimeout(4000) // låt LCP stabiliseras
    const lcp = await page.evaluate(() => window.__lcp)
    samples.push(Math.round(lcp))
    await ctx.close()
  }
  samples.sort((a, b) => a - b)
  return { median: samples[Math.floor(samples.length / 2)], samples }
}

async function main() {
  const browser = await chromium.launch()

  const landing = await measureLCP(browser, `${BASE}/`)
  console.log(`Landning (utloggad):  median ${landing.median} ms  (körningar: ${landing.samples.join(', ')})`)

  if (fs.existsSync(STATE)) {
    const oversikt = await measureLCP(browser, `${BASE}/#/oversikt`, STATE)
    console.log(`Översikt (inloggad):  median ${oversikt.median} ms  (körningar: ${oversikt.samples.join(', ')})`)
  } else {
    console.log('Översikt: hoppar över (ingen cachad session i e2e/.auth/)')
  }

  await browser.close()
  console.log('\nMål (ROADMAP D6): LCP < 2500 ms. OBS: mätning från denna dator — CI/fältdata varierar.')
}

main().catch((e) => { console.error(e); process.exit(1) })
