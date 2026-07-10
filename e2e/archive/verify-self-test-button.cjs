/**
 * Snabb verifiering: konsulent-rollen ser SelfTestEnrollmentButton.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

async function main() {
  const out = path.join(__dirname, 'screenshots', 'sta-doa-self-flow')
  fs.mkdirSync(out, { recursive: true })
  const authPath = path.join(__dirname, '.auth', 'consultant.json')

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    storageState: authPath,
  })
  const page = await ctx.newPage()

  await page.goto('http://localhost:3000/#/steg-till-arbete', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(out, 'consultant-empty-state.png'), fullPage: true })

  const bodyText = await page.locator('body').innerText()
  const hasButton = bodyText.includes('Skapa testkoppling')
  console.log('Empty state visible:', bodyText.includes('Du är inte tilldelad'))
  console.log('"Skapa testkoppling"-knapp synlig:', hasButton)
  if (hasButton) {
    console.log('✓ Konsulenten kan nu skapa självkoppling')
  } else {
    console.log('✗ Knappen syns INTE — bugg eller cache')
  }

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
