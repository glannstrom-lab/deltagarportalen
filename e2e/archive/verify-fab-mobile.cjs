/**
 * Verify the mobile FAB fix against a local dev build.
 * Captures, per FAB-affected page: (a) initial top-of-page (FABs icon-only,
 * visible), (b) after scrolling down (FABs hidden).
 *
 *   E2E_BASE_URL=http://localhost:3001 node e2e/verify-fab-mobile.cjs
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const EMAIL = process.env.E2E_EMAIL || 'claude-playwright-test@jobin.se'
const PASSWORD = process.env.E2E_PASSWORD || process.env.TEST_USER_PASSWORD
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3001'
const OUT = path.join(__dirname, '..', 'audit-2026-05-28', 'fab-verify')

const ROUTES = [
  ['/career', 'career'],
  ['/salary', 'salary'],
  ['/job-search', 'job-search'],
  ['/calendar', 'calendar'],
]

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'sv-SE' })
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('jobin_cookie_consent', 'true')
      localStorage.setItem('jobin_cookie_preferences', JSON.stringify({ necessary: true, analytics: false }))
    } catch { /* ignore */ }
  })
  const page = await ctx.newPage()

  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' })
  await page.locator('input#email').fill(EMAIL)
  await page.locator('input#password').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 20000 }).catch(() => {})
  console.log('logged in ->', page.url())

  for (const [route, slug] of ROUTES) {
    await page.goto(`${BASE_URL}/#${route}`, { waitUntil: 'networkidle', timeout: 35000 })
    await page.waitForTimeout(1500)
    // (a) top — FABs should be visible, icon-only
    await page.screenshot({ path: path.join(OUT, `${slug}-top.png`) })
    // scroll down — use real wheel + window/element scroll to be safe
    await page.mouse.wheel(0, 700)
    await page.evaluate(() => {
      window.scrollTo({ top: 700 })
      const el = document.getElementById('main-content')
      if (el) el.scrollTop = 700
    })
    await page.waitForTimeout(700) // allow hide transition
    await page.screenshot({ path: path.join(OUT, `${slug}-scrolled.png`) })
    console.log('captured', slug)
  }

  await browser.close()
  console.log('done ->', OUT)
}

main().catch((e) => { console.error(e); process.exit(1) })
