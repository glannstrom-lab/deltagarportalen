/**
 * Visuell regression — Fas 3 hub-landningar mot lokal dev-server.
 * Screenshot:ar de 5 huvarna + några kärnasidor som rörts av Fas 1-3.
 */
const { chromium } = require('playwright')
const path = require('path')

const BASE = 'http://localhost:3002'
const USER = {
  email: process.env.TEST_USER_EMAIL || 'claude-playwright-test@jobin.se',
  password: process.env.TEST_USER_PASSWORD || process.env.TEST_USER_PASSWORD,
}

async function dismissCookies(page) {
  try {
    const btn = page.getByRole('button', { name: /endast nödvändiga|godkänn alla|acceptera/i }).first()
    if (await btn.isVisible({ timeout: 1000 })) await btn.click({ timeout: 1500 })
  } catch {}
}

async function login(page) {
  await page.goto(`${BASE}/#/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(2000)
  await dismissCookies(page)
  await page.locator('input#email, input[type="email"]').first().fill(USER.email)
  await page.locator('input#password, input[type="password"]').first().fill(USER.password)
  await page.getByRole('button', { name: /^logga in$/i }).first().click()
  await page.waitForFunction(() => !location.hash.includes('/login'), { timeout: 20000 })
}

async function shot(page, route, name) {
  console.log(` → ${route}`)
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.waitForTimeout(2500)
  await page.screenshot({
    path: path.join(__dirname, 'screenshots', `fas3-${name}.png`),
    fullPage: true,
  })
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sv-SE' })
  const page = await ctx.newPage()

  const errors = []
  page.on('pageerror', e => errors.push(`PAGE: ${e.message}`))
  page.on('console', m => {
    if (m.type() === 'error') errors.push(`CONSOLE: ${m.text().slice(0, 200)}`)
  })

  console.log('Logga in...')
  await login(page)

  console.log('Hub-landningar:')
  await shot(page, '/#/oversikt', 'hub-oversikt')
  await shot(page, '/#/jobb', 'hub-jobb')
  await shot(page, '/#/karriar', 'hub-karriar')
  await shot(page, '/#/resurser', 'hub-resurser')
  await shot(page, '/#/min-vardag', 'hub-vardag')

  console.log('Verktygssidor (verifiera 4 px hub-kant):')
  await shot(page, '/#/cv', 'tool-cv')
  await shot(page, '/#/job-search', 'tool-jobsearch')
  await shot(page, '/#/wellness', 'tool-wellness')
  await shot(page, '/#/applications', 'tool-applications')

  console.log('Gradient-utrotning verifiering:')
  await shot(page, '/#/interest-guide', 'tool-interest-guide')
  await shot(page, '/#/skills-gap-analysis', 'tool-skills-gap')
  await shot(page, '/#/ai-team', 'tool-ai-team')
  await shot(page, '/#/my-consultant', 'tool-my-consultant')

  console.log()
  console.log(`Errors: ${errors.length}`)
  errors.slice(0, 10).forEach(e => console.log(' ', e))

  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
