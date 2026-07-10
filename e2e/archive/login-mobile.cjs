/**
 * Fota login-sidan på mobil viewport för att verifiera placeholder/ikon-spacing.
 */

const { chromium, devices } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

async function main() {
  const out = path.join(__dirname, 'screenshots')
  fs.mkdirSync(out, { recursive: true })

  const browser = await chromium.launch()
  const widths = [{ w: 360, h: 640, name: 'mobile-360' }, { w: 414, h: 896, name: 'mobile-414' }, { w: 768, h: 1024, name: 'tablet-768' }]

  for (const { w, h, name } of widths) {
    const context = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    })
    const page = await context.newPage()
    await context.addInitScript(() => {
      localStorage.setItem('jobin_cookie_consent', 'true')
      localStorage.setItem('jobin_cookie_preferences', JSON.stringify({ necessary: true, analytics: false }))
    })
    await page.goto('http://localhost:3000/#/login?bust=' + Date.now(), { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)
    // Verifiera vilken pl-klass som faktiskt är applicerad
    const padding = await page.locator('input[name="email"]').evaluate((el) => {
      const cs = window.getComputedStyle(el)
      return { padLeft: cs.paddingLeft, classes: el.className.split(' ').filter(c => c.startsWith('pl-')).join(',') }
    }).catch(() => null)
    console.log(`  ${name}: ${JSON.stringify(padding)}`)
    await page.screenshot({ path: path.join(out, `login-${name}.png`), fullPage: false })
    console.log(`saved login-${name}.png`)
    await context.close()
  }

  await browser.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
