const { chromium } = require('playwright')
const path = require('path')

const BASE = 'https://jobin.se'
const TEST_USER = {
  email: 'claude-playwright-test@jobin.se',
  password: process.env.TEST_USER_PASSWORD,
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sv-SE' })
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
  console.log('Logged in')

  // Go to ai-team via dashboard first (mimics normal flow)
  await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  await page.goto(`${BASE}/#/ai-team`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000) // wait for transitions to settle
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'verify-aiteam-after-5s.png'), fullPage: true })

  // Count number of AgentSelector elements
  const agentSelectors = await page.locator('[role="radiogroup"], [class*="AgentSelector"]').count()
  const headings = await page.getByRole('heading', { name: /Mitt AI Team|aiTeam/i }).count()
  const onboardingModals = await page.locator('[role="dialog"]').count()
  const pageLayouts = await page.locator('main').count()

  console.log(`AgentSelectors: ${agentSelectors}`)
  console.log(`Headings: ${headings}`)
  console.log(`Open modals: ${onboardingModals}`)
  console.log(`Mains: ${pageLayouts}`)

  // Click the "Hoppa över" or "X" on onboarding to dismiss
  try {
    const dismiss = page.getByRole('button', { name: /hoppa över|stäng/i })
    if (await dismiss.first().isVisible({ timeout: 2000 })) {
      await dismiss.first().click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: path.join(__dirname, 'screenshots', 'verify-aiteam-dismissed.png'), fullPage: true })
      console.log('Dismissed onboarding')
    }
  } catch {}

  // Direct navigation again
  await page.goto(`${BASE}/#/ai-team`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'verify-aiteam-second-visit.png'), fullPage: true })

  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
