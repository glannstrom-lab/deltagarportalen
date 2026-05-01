/**
 * Fota landningssidan på mobil-viewport, fullsida + sektion-zooms.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

async function main() {
  const out = path.join(__dirname, 'screenshots')
  fs.mkdirSync(out, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 375, height: 800 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  await context.addInitScript(() => {
    localStorage.setItem('jobin_cookie_consent', 'true')
    localStorage.setItem('jobin_cookie_preferences', JSON.stringify({ necessary: true, analytics: false }))
  })
  const page = await context.newPage()

  await page.goto('http://localhost:3000/?bust=' + Date.now(), { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  // Hela sidan
  await page.screenshot({ path: path.join(out, 'landing-mobile-full.png'), fullPage: true })
  console.log('saved landing-mobile-full.png')

  // Hero (top)
  await page.screenshot({ path: path.join(out, 'landing-mobile-hero.png'), fullPage: false })
  console.log('saved landing-mobile-hero.png')

  // FAQ-sektion
  await page.locator('#faq').scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(out, 'landing-mobile-faq.png'), fullPage: false })
  console.log('saved landing-mobile-faq.png')

  await browser.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
