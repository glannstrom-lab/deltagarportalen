const { chromium } = require('playwright')
const path = require('path')

const BASE = 'https://jobin.se'
const TEST_USER = {
  email: 'claude-playwright-test@jobin.se',
  password: 'HjFxMLjrXzjHhOqS33j9vPzq',
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'sv-SE',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  })
  const page = await ctx.newPage()

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
  await page.waitForTimeout(2000)

  await page.goto(`${BASE}/#/oversikt`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)

  // Scroll to bottom and take viewport screenshot (not fullPage)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'verify-mobile-bottom.png'), fullPage: false })

  // Measure bottom nav height & check overlap
  const result = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Hubnavigering"]') || document.querySelector('[role="navigation"][class*="fixed"][class*="bottom-0"]')
    const main = document.querySelector('main')
    const cards = document.querySelectorAll('a[href*="/min-vardag"]')
    const lastCard = cards[cards.length - 1]
    return {
      navHeight: nav ? nav.getBoundingClientRect().height : null,
      navTop: nav ? nav.getBoundingClientRect().top : null,
      mainPaddingBottom: main ? getComputedStyle(main).paddingBottom : null,
      bodyScrollHeight: document.body.scrollHeight,
      windowInnerHeight: window.innerHeight,
      lastCardBottom: lastCard ? lastCard.getBoundingClientRect().bottom : null,
      lastCardText: lastCard ? lastCard.textContent.slice(0, 80) : null,
    }
  })
  console.log(JSON.stringify(result, null, 2))

  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
