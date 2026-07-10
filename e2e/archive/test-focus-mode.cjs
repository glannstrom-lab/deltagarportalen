/**
 * Manual test of focus mode wizards.
 * Run: node e2e/test-focus-mode.cjs
 */
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const BASE_URL = 'http://localhost:3000'
const TEST_EMAIL = 'claude-playwright-test@jobin.se'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD

const OUT_DIR = path.join(__dirname, '..', 'audit-2026-05-12', 'focus-mode')
fs.mkdirSync(OUT_DIR, { recursive: true })

const PAGES_TO_TEST = [
  { path: '/', name: 'dashboard' },
  { path: '/profile', name: 'profile' },
  { path: '/cover-letter', name: 'cover-letter' },
  { path: '/job-search', name: 'job-search' },
  { path: '/skills-gap-analysis', name: 'skills-gap' },
  { path: '/interview-simulator', name: 'interview' },
  { path: '/wellness', name: 'wellness' },
  { path: '/diary', name: 'diary' },
  { path: '/settings', name: 'settings' },
]

async function run() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()

  const results = []
  const consoleErrors = []
  page.on('pageerror', (e) => consoleErrors.push({ where: page.url(), msg: e.message }))
  page.on('console', (m) => {
    if (m.type() === 'error') {
      consoleErrors.push({ where: page.url(), msg: m.text() })
    }
  })

  console.log('1) Login')
  await page.goto(`${BASE_URL}/#/login`)
  await page.waitForLoadState('networkidle')
  await page.locator('input#email').fill(TEST_EMAIL)
  await page.locator('input#password').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /^logga in$/i }).click()
  try {
    await page.waitForURL(/localhost:3000\/(?:#?\/?)?(?:$|oversikt|dashboard)/, { timeout: 15000 })
  } catch (e) {
    console.log('   Login redirect timeout; current URL:', page.url())
  }
  await page.waitForLoadState('networkidle').catch(() => {})

  console.log('   logged in, URL:', page.url())

  for (const target of PAGES_TO_TEST) {
    console.log(`\n2) Visit ${target.path}`)
    const beforeErrors = consoleErrors.length
    try {
      await page.goto(`${BASE_URL}/#${target.path}`)
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
      await page.waitForTimeout(800)

      // Normal-mode screenshot
      await page.screenshot({
        path: path.join(OUT_DIR, `${target.name}-normal.png`),
        fullPage: false,
      })

      // Find focus toggle in TopBar — aria-label contains "fokusläge"
      const focusBtn = page.getByRole('button', { name: /fokusläge/i }).first()
      const focusBtnVisible = await focusBtn.isVisible().catch(() => false)
      if (!focusBtnVisible) {
        results.push({ page: target.name, status: 'no-toggle' })
        console.log('   ✗ no focus toggle visible')
        continue
      }

      await focusBtn.click()
      await page.waitForTimeout(800)

      // Check that focus-mode class landed on <html>
      const inFocus = await page.evaluate(() => document.documentElement.classList.contains('focus-mode'))
      // Check exit button visible
      const exitBtn = page.locator('button[aria-label="Avsluta fokusläge"]').first()
      const exitVisible = await exitBtn.isVisible().catch(() => false)

      // Look for a step indicator — wizards have "Steg X av N"
      const stepText = await page.locator('text=/steg \\d+ av \\d+/i').first().textContent().catch(() => null)

      await page.screenshot({
        path: path.join(OUT_DIR, `${target.name}-focus.png`),
        fullPage: false,
      })

      const errors = consoleErrors.slice(beforeErrors).map(e => e.msg)
      results.push({
        page: target.name,
        status: 'ok',
        inFocus,
        exitVisible,
        stepText: stepText?.trim() || null,
        errors: errors.length ? errors : undefined,
      })
      console.log(`   ✓ focus=${inFocus} exit=${exitVisible} step="${stepText?.trim() || '(none)'}"`)

      // Toggle off again so next page starts fresh
      if (exitVisible) {
        await exitBtn.click()
        await page.waitForTimeout(400)
      }
    } catch (e) {
      results.push({ page: target.name, status: 'error', error: e.message })
      console.log('   ✗ error:', e.message)
    }
  }

  await browser.close()

  fs.writeFileSync(path.join(OUT_DIR, 'results.json'), JSON.stringify({ results, consoleErrors }, null, 2))

  console.log('\n=== SUMMARY ===')
  for (const r of results) {
    const icon = r.status === 'ok' && r.inFocus && r.exitVisible ? '✓' : r.status === 'ok' ? '?' : '✗'
    console.log(`${icon} ${r.page.padEnd(15)} ${JSON.stringify({ ...r, page: undefined })}`)
  }
  const totalErrors = consoleErrors.length
  console.log(`\nConsole/page errors: ${totalErrors}`)
  if (totalErrors > 0) {
    consoleErrors.slice(0, 5).forEach(e => console.log(`  [${e.where}] ${e.msg.substring(0, 200)}`))
  }
}

run().catch(e => { console.error(e); process.exit(1) })
