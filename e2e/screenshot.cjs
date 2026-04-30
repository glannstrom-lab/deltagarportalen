/**
 * Standalone screenshot helper.
 *
 * Usage:
 *   node e2e/screenshot.cjs <route> [WIDTHxHEIGHT]
 *
 * Examples:
 *   node e2e/screenshot.cjs /oversikt
 *   node e2e/screenshot.cjs /jobb 1280x800
 *   BASE_URL=https://jobin.se node e2e/screenshot.cjs /oversikt
 *
 * Reads TEST_USER_EMAIL/PASSWORD from .env.test.local at project root.
 * Caches login session in e2e/.auth/state.json (gitignored).
 * Saves screenshot to e2e/screenshots/<slug>.png (gitignored).
 */

const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

function loadEnv() {
  const envPath = path.join(ROOT, '.env.test.local')
  if (!fs.existsSync(envPath)) {
    console.error(`Missing ${envPath}`)
    process.exit(1)
  }
  const env = {}
  for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  if (!env.TEST_USER_EMAIL || !env.TEST_USER_PASSWORD) {
    console.error('Missing TEST_USER_EMAIL / TEST_USER_PASSWORD')
    process.exit(1)
  }
  return env
}

async function dismissCookieConsent(page) {
  try {
    const btn = page.getByRole('button', { name: /endast nödvändiga|acceptera/i }).first()
    if (await btn.isVisible({ timeout: 1500 })) {
      await btn.click()
      await page.waitForTimeout(300)
    }
  } catch {}
}

async function performLogin(page, context, baseUrl, email, password, statePath) {
  console.log('Logging in...')
  await page.goto(`${baseUrl}/#/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1000)
  await dismissCookieConsent(page)
  await page.locator('input#email').waitFor({ state: 'visible', timeout: 10000 })
  await page.locator('input#email').fill(email)
  await page.locator('input#password').fill(password)
  await page.getByRole('button', { name: /^logga in$/i }).click()
  await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 20000 })
  await page.waitForTimeout(1000)
  await context.storageState({ path: statePath })
  console.log('Login successful, storage state cached')
}

async function isAuthenticated(page) {
  // The unauthenticated landing page shows "Stärk dina deltagare"; auth'd app does not.
  const landingHeadingCount = await page.getByRole('heading', { name: /stärk dina deltagare/i }).count()
  return landingHeadingCount === 0
}

async function ensureLoggedIn(page, context, baseUrl, email, password, statePath) {
  // First, try the home route. If state.json was loaded, we should land in the auth'd app.
  await page.goto(`${baseUrl}/#/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await dismissCookieConsent(page)

  if (await isAuthenticated(page)) return

  await performLogin(page, context, baseUrl, email, password, statePath)
}

async function main() {
  const env = loadEnv()
  const route = process.argv[2] || '/'
  const viewport = process.argv[3] || '1440x900'
  const [w, h] = viewport.split('x').map(Number)
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173'

  const authDir = path.join(__dirname, '.auth')
  const statePath = path.join(authDir, 'state.json')
  const screenshotsDir = path.join(__dirname, 'screenshots')
  fs.mkdirSync(authDir, { recursive: true })
  fs.mkdirSync(screenshotsDir, { recursive: true })

  const slug = (route === '/' ? 'home' : route)
    .replace(/^\//, '')
    .replace(/\//g, '-')
    .replace(/[^a-z0-9-]/gi, '') || 'home'

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: w, height: h },
    storageState: fs.existsSync(statePath) ? statePath : undefined,
  })
  const page = await context.newPage()

  // Capture browser-side errors so we can diagnose render failures
  const consoleMessages = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`)
    }
  })
  page.on('pageerror', (err) => {
    consoleMessages.push(`[pageerror] ${err.message}\n${err.stack || ''}`)
  })

  await ensureLoggedIn(page, context, baseUrl, env.TEST_USER_EMAIL, env.TEST_USER_PASSWORD, statePath)

  console.log(`Navigating to ${route}...`)
  await page.goto(`${baseUrl}/#${route === '/' ? '/' : route}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await dismissCookieConsent(page)

  // Wait for app loading indicators to clear
  try {
    await page.waitForSelector('text=Laddar Jobin...', { state: 'detached', timeout: 5000 })
  } catch {}
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 })
  } catch {}
  await page.waitForTimeout(800)

  const outPath = path.join(screenshotsDir, `${slug}.png`)
  await page.screenshot({ path: outPath, fullPage: false })
  console.log(`Saved: ${path.relative(process.cwd(), outPath)}`)
  console.log(`URL: ${page.url()}`)

  if (consoleMessages.length) {
    console.log(`\n--- Browser console (${consoleMessages.length} entries) ---`)
    for (const m of consoleMessages.slice(0, 30)) console.log(m)
    if (consoleMessages.length > 30) console.log(`... ${consoleMessages.length - 30} more`)
  }

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
