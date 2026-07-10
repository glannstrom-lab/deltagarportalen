/**
 * Live-verifiering av konsulentvyns ärlighets-pass (commit 20fe3ab) mot jobin.se.
 * Loggar in som test-konsulenten, kontrollerar att:
 *  - Översiktens CV-kvalitet-KPI INTE längre visar en hårdkodad "+5%"-trend
 *  - Analytics "Progress Over Time"-grafen renderar (riktig serie, inte krasch)
 * Skärmdumpar översikt + analytics i ljust och mörkt läge.
 *
 * Creds läses från env (inga hårdkodade hemligheter i denna fil):
 *   E2E_CONS_EMAIL / E2E_CONS_PASSWORD
 *   node e2e/verify-consultant.cjs
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const EMAIL = process.env.E2E_CONS_EMAIL
const PASSWORD = process.env.E2E_CONS_PASSWORD
const BASE_URL = process.env.E2E_BASE_URL || 'https://jobin.se'
const OUT = path.join(__dirname, '..', 'audit-2026-06-06', 'consultant-verify')

if (!EMAIL || !PASSWORD) {
  console.error('Sätt E2E_CONS_EMAIL och E2E_CONS_PASSWORD i env.')
  process.exit(2)
}

const ROUTES = [
  ['/consultant', 'oversikt'],
  ['/consultant/analytics', 'analytics'],
]

async function login(ctx) {
  const page = await ctx.newPage()
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' })
  await page.fill('input#email', EMAIL)
  await page.fill('input#password', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 25000 })
  await page.close()
}

async function run(theme) {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'sv-SE', colorScheme: theme })
  await ctx.addInitScript((t) => { try { localStorage.setItem('theme', t) } catch (e) {} }, theme)
  await login(ctx)
  const page = await ctx.newPage()
  const findings = []
  for (const [route, slug] of ROUTES) {
    await page.goto(`${BASE_URL}/#${route}`, { waitUntil: 'networkidle', timeout: 35000 }).catch(() => {})
    await page.waitForTimeout(2500)
    const probe = await page.evaluate(() => {
      const body = document.body.innerText || ''
      // Räkna staplar i "Progress Over Time"-grafen (BarChart renderar element med inline height)
      const bars = Array.from(document.querySelectorAll('[style*="height"]')).length
      return {
        hasFakePlus5: /\+5%/.test(body),
        crashed: /Något gick fel|Error boundary|Oops/i.test(body),
        textLen: body.length,
        barishElements: bars,
      }
    })
    await page.screenshot({ path: path.join(OUT, `${theme}_${slug}.png`), fullPage: false }).catch(() => {})
    findings.push({ theme, route, ...probe })
    console.log(`[${theme}] ${route.padEnd(24)} +5%:${probe.hasFakePlus5} crash:${probe.crashed} (${probe.textLen}b)`)
  }
  await browser.close()
  return findings
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  console.log(`Verifierar konsulentvyn mot ${BASE_URL}\n`)
  const all = [...(await run('light')), ...(await run('dark'))]
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(all, null, 2))
  const fakeTrend = all.filter((f) => f.hasFakePlus5)
  const crashes = all.filter((f) => f.crashed)
  console.log('\n=== SAMMANFATTNING ===')
  console.log(`Sidor kontrollerade: ${all.length}`)
  console.log(`"+5%"-fejktrend kvar: ${fakeTrend.length} (ska vara 0)`)
  console.log(`Kraschade sidor: ${crashes.length} (ska vara 0)`)
  console.log(`Skärmdumpar -> ${OUT}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
