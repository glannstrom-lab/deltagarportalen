/**
 * Tar screenshots av CV-sidans steg och flikar för visuell verifiering
 * av designenhetligheten efter token-migrationen.
 *
 * Usage: node e2e/cv-screenshot.cjs
 */

const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

function loadEnv() {
  const envPath = path.join(ROOT, '.env.test.local')
  if (!fs.existsSync(envPath)) throw new Error(`Missing ${envPath}`)
  const env = {}
  for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
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

async function performLogin(page, baseUrl, email, password) {
  await page.goto(`${baseUrl}/#/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1000)
  await dismissCookieConsent(page)
  await page.locator('input#email').waitFor({ state: 'visible', timeout: 10000 })
  await page.locator('input#email').fill(email)
  await page.locator('input#password').fill(password)
  await page.getByRole('button', { name: /^logga in$/i }).click()
  await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 20000 })
  await page.waitForTimeout(1500)
}

async function isAuthenticated(page) {
  const landingHeadingCount = await page.getByRole('heading', { name: /stärk dina deltagare/i }).count()
  return landingHeadingCount === 0
}

async function ensureLoggedIn(page, context, baseUrl, email, password, statePath) {
  await page.goto(`${baseUrl}/#/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await dismissCookieConsent(page)
  if (await isAuthenticated(page)) return
  await performLogin(page, baseUrl, email, password)
  await context.storageState({ path: statePath })
}

async function dismissOnboardingModal(page) {
  // Welcome modal eller CV-onboarding kan blockera kliks
  for (let i = 0; i < 3; i++) {
    const modal = page.locator('[role="dialog"]').first()
    if (!(await modal.count())) return
    if (!(await modal.isVisible())) return
    const skip = page.getByRole('button', { name: /hoppa över|skip|stäng|kom igång/i }).first()
    if (await skip.count() && await skip.isVisible()) {
      await skip.click().catch(() => {})
      await page.waitForTimeout(400)
    } else {
      // Försök Escape
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    }
  }
}

async function navigateAndShoot(page, hash, slug, screenshotsDir) {
  await page.goto(`${BASE_URL}/#${hash}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  try { await page.waitForLoadState('networkidle', { timeout: 4000 }) } catch {}
  await dismissOnboardingModal(page)
  await page.waitForTimeout(500)
  const out = path.join(screenshotsDir, `${slug}.png`)
  await page.screenshot({ path: out, fullPage: false })
  console.log(`  ${slug}.png`)
}

async function clickStep(page, stepNum) {
  const btn = page.getByRole('button', { name: new RegExp(`Gå till steg ${stepNum}`, 'i') })
  if (await btn.count()) {
    await btn.click()
    await page.waitForTimeout(800)
  }
}

async function main() {
  const env = loadEnv()
  const authDir = path.join(__dirname, '.auth')
  const statePath = path.join(authDir, 'state.json')
  const screenshotsDir = path.join(__dirname, 'screenshots')
  fs.mkdirSync(authDir, { recursive: true })
  fs.mkdirSync(screenshotsDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: fs.existsSync(statePath) ? statePath : undefined,
  })
  const page = await context.newPage()

  const errors = []
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`))
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })

  await ensureLoggedIn(page, context, BASE_URL, env.TEST_USER_EMAIL, env.TEST_USER_PASSWORD, statePath)

  // Förhindra CV-onboarding-modalen från att blockera screenshots
  await page.evaluate(() => {
    localStorage.setItem('cv-onboarding-completed', 'true')
    localStorage.setItem('welcome-seen', 'true')
  })

  console.log('Screenshots:')

  // CV-builder steg 1-5
  await navigateAndShoot(page, '/cv', 'cv-step1-design', screenshotsDir)

  // Hoppa förbi quick mode om det visas
  const quickModeHeading = page.getByRole('heading', { name: /välkommen till cv-byggaren/i })
  if (await quickModeHeading.count()) {
    const switchBtn = page.getByRole('button', { name: /fullständiga cv-byggaren/i }).first()
    if (await switchBtn.count()) {
      await switchBtn.click()
      await page.waitForTimeout(1000)
    }
  }

  await clickStep(page, 2)
  await page.screenshot({ path: path.join(screenshotsDir, 'cv-step2-omdig.png'), fullPage: false })
  console.log('  cv-step2-omdig.png')

  await clickStep(page, 3)
  await page.screenshot({ path: path.join(screenshotsDir, 'cv-step3-profil.png'), fullPage: false })
  console.log('  cv-step3-profil.png')

  await clickStep(page, 4)
  await page.screenshot({ path: path.join(screenshotsDir, 'cv-step4-erfarenhet.png'), fullPage: false })
  console.log('  cv-step4-erfarenhet.png')

  // Lägg till en erfarenhet och fota med expanded card
  const addExp = page.getByRole('button', { name: /Lägg till jobb|Lägg till ytterligare ett jobb/i }).first()
  if (await addExp.count()) {
    await addExp.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(screenshotsDir, 'cv-step4-erfarenhet-expanded.png'), fullPage: false })
    console.log('  cv-step4-erfarenhet-expanded.png')
  }

  await clickStep(page, 5)
  await page.screenshot({ path: path.join(screenshotsDir, 'cv-step5-kompetenser.png'), fullPage: false })
  console.log('  cv-step5-kompetenser.png')

  // Andra flikar
  await navigateAndShoot(page, '/cv/my-cvs', 'cv-mina-cv', screenshotsDir)
  await navigateAndShoot(page, '/cv/adapt', 'cv-anpassa', screenshotsDir)
  await navigateAndShoot(page, '/cv/ats', 'cv-ats', screenshotsDir)
  await navigateAndShoot(page, '/cv/tips', 'cv-tips', screenshotsDir)

  if (errors.length) {
    console.log(`\nConsole errors (${errors.length}):`)
    for (const e of errors.slice(0, 10)) console.log('  ' + e.slice(0, 200))
  } else {
    console.log('\nInga console errors.')
  }

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
