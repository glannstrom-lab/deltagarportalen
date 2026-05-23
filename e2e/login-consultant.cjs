/**
 * Login as the test consultant and save storageState.
 *
 * Run once locally before any e2e that needs consultant auth:
 *   node e2e/login-consultant.cjs
 *
 * Outputs: e2e/.auth/consultant.json (gitignored).
 *
 * The test consultant was created via
 * audit-2026-05-23-create-test-consultant.sql in prod-DB:
 *   email:    claude-playwright-consultant@jobin.test
 *   password: Konsulent-Test-2026-05-23-Jobin!
 *   role:     CONSULTANT
 *
 * .test is a reserved TLD (RFC 2606) — the email can never reach a real
 * recipient, which makes it safe to keep this account in prod-DB for testing.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const EMAIL = 'claude-playwright-consultant@jobin.test'
const PASSWORD = 'Konsulent-Test-2026-05-23-Jobin!'
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

async function main() {
  const authDir = path.join(__dirname, '.auth')
  fs.mkdirSync(authDir, { recursive: true })
  const statePath = path.join(authDir, 'consultant.json')

  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()

  console.log(`Navigating to ${BASE_URL}/login …`)
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' })

  await page.fill('input#email', EMAIL)
  await page.fill('input#password', PASSWORD)
  await page.click('button[type="submit"]')

  // Wait until we either land on an authenticated route or see an error
  await Promise.race([
    page.waitForURL((url) => !url.toString().includes('/login') && !url.toString().includes('/register'), { timeout: 15000 }),
    page.waitForSelector('[role="alert"]', { timeout: 15000 }),
  ])

  const url = page.url()
  if (url.includes('/login')) {
    const errorText = await page.locator('[role="alert"]').first().innerText().catch(() => '')
    console.error('Login failed. Error on page:', errorText)
    process.exit(1)
  }

  console.log(`Logged in. Landed on: ${url}`)
  await ctx.storageState({ path: statePath })
  console.log(`Saved storage state to ${statePath}`)
  await browser.close()
}

main().catch((err) => {
  console.error('Login script failed:', err)
  process.exit(1)
})
