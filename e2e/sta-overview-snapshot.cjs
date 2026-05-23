/**
 * Snapshot av STA-konsulent-översikten efter funktionalitetsfix.
 * Använder test-konsulent-state.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'

async function main() {
  const out = path.join(__dirname, 'screenshots', 'sta-overview')
  fs.mkdirSync(out, { recursive: true })
  const authState = path.join(__dirname, '.auth', 'consultant.json')

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    storageState: authState,
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  await page.goto(`${BASE}/#/konsulent/steg-till-arbete`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const cookieBtn = page.getByRole('button', { name: /Acceptera|Godkänn|Endast nödvändiga/i }).first()
  if (await cookieBtn.count()) {
    await cookieBtn.click({ timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(300)
  }

  console.log('URL:', page.url())
  await page.screenshot({ path: path.join(out, '01-overview.png'), fullPage: true })

  // Klicka "Utkast att granska" om värdet > 0 — fallback: bara screen
  const utkast = await page.locator('text=/Utkast att granska/').count()
  console.log('Hittade Utkast-KPI:', utkast)

  // Klicka "Aktiva deltagare"
  const aktiva = page.getByRole('button', { name: /Aktiva deltagare/i }).first()
  if (await aktiva.count()) {
    console.log('Klickar Aktiva-KPI…')
    await aktiva.click()
    await page.waitForTimeout(500)
    console.log('URL efter klick:', page.url())
    await page.screenshot({ path: path.join(out, '02-after-aktiva-click.png'), fullPage: false })
  } else {
    console.log('Aktiva-KPI ej klickbar (nollvärde) — OK')
  }

  console.log('Console errors:', errors.length)
  errors.slice(0, 5).forEach((e) => console.log('  ' + e.slice(0, 200)))
  await browser.close()
  console.log('Saved to:', out)
}

main().catch((e) => { console.error(e); process.exit(1) })
