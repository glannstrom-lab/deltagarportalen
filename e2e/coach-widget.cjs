/**
 * Verifierar CoachWidget på 4 representativa sidor:
 *  1. /profile — Jobbcoach + Digital coach
 *  2. /cv — Jobbcoach + Digital coach
 *  3. /wellness — Mental coach + Arbetsterapeut
 *  4. /interest-guide — Studievägledare + Mental coach
 *
 * Och verifierar att toggle i Settings stänger av widgeten överallt.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

async function visitAndShoot(page, out, url, name) {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  // Stäng eventuell onboarding-dialog
  try {
    const skip = page.getByRole('button', { name: /Hoppa över|Skip|Stäng|Close/i }).first()
    if (await skip.count()) await skip.click({ timeout: 1500 })
  } catch {}
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(out, `${name}-collapsed.png`), fullPage: false })

  // Hitta widget-launcher
  const launcher = page.getByRole('button', { name: /Öppna coachtips/i }).first()
  const launcherCount = await launcher.count()
  console.log(`  ${name}: launcher count=${launcherCount}`)

  if (launcherCount > 0) {
    await launcher.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(out, `${name}-open.png`), fullPage: false })
    // Räkna coach-tabs
    const tabs = await page.locator('[role="dialog"] button[aria-pressed]').count()
    console.log(`  ${name}: coach tabs=${tabs}`)
    // Stäng
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }
  return launcherCount > 0
}

async function main() {
  const out = path.join(__dirname, 'screenshots', 'coach-widget')
  fs.mkdirSync(out, { recursive: true })
  const authStatePath = path.join(__dirname, '.auth', 'state.json')

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    storageState: authStatePath,
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()))
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message))

  console.log('=== Visiting pages with coach widget ===')
  await visitAndShoot(page, out, 'http://localhost:3000/#/profile', 'profile')
  await visitAndShoot(page, out, 'http://localhost:3000/#/cv', 'cv')
  await visitAndShoot(page, out, 'http://localhost:3000/#/wellness', 'wellness')
  await visitAndShoot(page, out, 'http://localhost:3000/#/interest-guide', 'interest-guide')

  console.log('\n=== Toggle off in Settings ===')
  await page.goto('http://localhost:3000/#/settings', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  // Navigera till Appearance-sektion
  const appearanceBtn = page.getByRole('button', { name: /Utseende|Appearance|Tema/i }).first()
  if (await appearanceBtn.count()) {
    try { await appearanceBtn.click({ timeout: 2000 }) } catch {}
    await page.waitForTimeout(500)
  }
  await page.screenshot({ path: path.join(out, 'settings-appearance.png'), fullPage: true })

  // Hitta toggle via label-texten — Toggle-komponenten är en <label><input type="checkbox"></label>
  const toggleLabel = page.locator('label', { hasText: 'Visa coach-tips' }).first()
  const toggleCount = await toggleLabel.count()
  console.log('  Toggle count:', toggleCount)
  if (toggleCount > 0) {
    await toggleLabel.click()
    await page.waitForTimeout(1000)
    console.log('  Clicked toggle')
  }

  // Verifiera att widget försvunnit på /profile
  await page.goto('http://localhost:3000/#/profile', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  const launcherAfterToggle = await page.getByRole('button', { name: /Öppna coachtips/i }).count()
  console.log('  Launcher count after toggle off:', launcherAfterToggle)
  await page.screenshot({ path: path.join(out, 'profile-after-toggle-off.png'), fullPage: false })

  // Slå på igen
  await page.goto('http://localhost:3000/#/settings', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  if (await appearanceBtn.count()) try { await appearanceBtn.click({ timeout: 2000 }) } catch {}
  await page.waitForTimeout(400)
  const toggleLabel2 = page.locator('label', { hasText: 'Visa coach-tips' }).first()
  if (await toggleLabel2.count()) await toggleLabel2.click()

  console.log('\nConsole errors:', errors.length)
  errors.slice(0, 5).forEach((e) => console.log('  ' + e.slice(0, 250)))

  await browser.close()
  console.log('\nSaved to:', out)
}

main().catch((err) => { console.error(err); process.exit(1) })
