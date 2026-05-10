const { chromium } = require('playwright')
const path = require('path')

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto('http://localhost:3003/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  try {
    const cookies = page.getByRole('button', { name: /endast nödvändiga|godkänn alla|acceptera/i })
    if (await cookies.first().isVisible({ timeout: 1500 })) await cookies.first().click()
  } catch {}
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'landing-new.png'), fullPage: true })
  console.log('Saved landing-new.png')

  // Mobile
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const mp = await mobile.newPage()
  await mp.goto('http://localhost:3003/', { waitUntil: 'domcontentloaded' })
  await mp.waitForTimeout(3000)
  try {
    const cookies = mp.getByRole('button', { name: /endast nödvändiga|godkänn alla|acceptera/i })
    if (await cookies.first().isVisible({ timeout: 1500 })) await cookies.first().click()
  } catch {}
  await mp.screenshot({ path: path.join(__dirname, 'screenshots-mobile', 'landing-new.png'), fullPage: true })
  console.log('Saved landing-new-mobile.png')

  await browser.close()
}
main().catch(e => { console.error(e); process.exit(1) })
