const { chromium } = require('playwright')

const BASE = 'https://jobin.se'
const TEST_USER = {
  email: 'claude-playwright-test@jobin.se',
  password: 'HjFxMLjrXzjHhOqS33j9vPzq',
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sv-SE' })
  const page = await ctx.newPage()

  const failed = []
  page.on('requestfailed', req => {
    if (/vendor-animation/.test(req.url())) {
      failed.push({
        url: req.url(),
        method: req.method(),
        error: req.failure()?.errorText,
      })
    }
  })

  await page.goto(`${BASE}/#/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  try {
    const cookies = page.getByRole('button', { name: /endast nödvändiga|godkänn alla|acceptera/i })
    if (await cookies.first().isVisible({ timeout: 1500 })) await cookies.first().click()
  } catch {}
  await page.locator('input#email').fill(TEST_USER.email)
  await page.locator('input#password').fill(TEST_USER.password)
  await page.getByRole('button', { name: /^logga in$/i }).first().click()
  await page.waitForFunction(() => !location.hash.includes('/login'), { timeout: 15000 })

  // Stay on dashboard, give chunks time to load
  await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(8000)

  console.log('vendor-animation request failures:', failed.length)
  failed.forEach(f => console.log(' -', f.method, f.url, f.error))

  // Check if Framer Motion is actually present
  const hasFramer = await page.evaluate(() => {
    return !!(window.__framer_motion__ || document.querySelector('[style*="transform"]'))
  })
  console.log('Page has framer-motion artifacts:', hasFramer)

  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
