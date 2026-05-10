/**
 * Quick smoke test: can we log in to production?
 */
const { chromium } = require('playwright')
const path = require('path')

const BASE = 'https://jobin.se'
const TEST_USER = {
  email: 'claude-playwright-test@jobin.se',
  password: 'HjFxMLjrXzjHhOqS33j9vPzq',
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sv-SE' })
  const page = await ctx.newPage()

  page.on('console', m => {
    if (m.type() === 'error') console.log('CONSOLE ERROR:', m.text())
  })
  page.on('pageerror', e => console.log('PAGE ERROR:', e.message))

  console.log('Goto login...')
  await page.goto(`${BASE}/#/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(3000)
  console.log('URL:', page.url())
  console.log('Title:', await page.title())

  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'smoke-1-login-page.png'), fullPage: true })

  // Dismiss cookies if visible
  try {
    const cookies = page.getByRole('button', { name: /endast nödvändiga|godkänn alla|acceptera/i })
    if (await cookies.first().isVisible({ timeout: 1500 })) {
      await cookies.first().click()
      console.log('✓ Cookies dismissed')
      await page.waitForTimeout(500)
    }
  } catch {}

  // Look for email input
  const emailInput = page.locator('input#email, input[type="email"], input[name="email"]').first()
  const visible = await emailInput.isVisible({ timeout: 5000 }).catch(() => false)
  console.log('Email input visible:', visible)

  if (!visible) {
    const html = await page.content()
    console.log('First 1000 chars of body:')
    console.log(html.slice(0, 1000))
    await browser.close()
    return
  }

  await emailInput.fill(TEST_USER.email)
  await page.locator('input#password, input[type="password"]').first().fill(TEST_USER.password)
  console.log('Filled login form')

  const loginBtn = page.getByRole('button', { name: /^logga in$/i }).first()
  await loginBtn.click()
  console.log('Clicked login')

  try {
    await page.waitForFunction(() => !location.hash.includes('/login'), { timeout: 15000 })
    console.log('✓ Redirected:', page.url())
  } catch (e) {
    console.log('✗ No redirect:', page.url())
    const errors = await page.locator('[role="alert"], .error, [class*="error"]').allTextContents()
    console.log('Errors on page:', errors)
  }

  await page.waitForTimeout(3000)
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'smoke-2-after-login.png'), fullPage: true })
  console.log('Final URL:', page.url())

  await browser.close()
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
