const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'

async function main() {
  const out = path.join(__dirname, 'screenshots', 'sta-workplaces')
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
  const cookie = page.getByRole('button', { name: /Acceptera|Godkänn|Endast nödvändiga/i }).first()
  if (await cookie.count()) { await cookie.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(300) }

  const wpTab = page.locator('button:has-text("Arbetsplatser")').first()
  await wpTab.click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(out, '01-default.png'), fullPage: true })

  console.log('Console errors:', errors.length)
  errors.slice(0, 5).forEach((e) => console.log('  ' + e.slice(0, 200)))
  await browser.close()
  console.log('Saved to:', out)
}

main().catch((e) => { console.error(e); process.exit(1) })
