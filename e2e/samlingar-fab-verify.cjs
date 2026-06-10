/**
 * Visuell verifiering av SamlingarFab:
 * 1. Logga in med sparad auth-state
 * 2. Gå till /oversikt (en hub-sida där både Coach och Samlingar bör synas)
 * 3. Screenshot stängt läge
 * 4. Klicka på Mina samlingar
 * 5. Screenshot öppen panel
 * 6. Klicka på "Mina CV" → ska navigera till /cv
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

async function main() {
  const out = path.join(__dirname, 'screenshots', 'samlingar-fab')
  fs.mkdirSync(out, { recursive: true })
  const authStatePath = path.join(__dirname, '.auth', 'state.json')

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    storageState: authStatePath,
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()))
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message))

  await page.goto('http://localhost:3000/#/oversikt', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  console.log('URL:', page.url())
  await page.screenshot({ path: path.join(out, '01-closed.png'), fullPage: false })

  // Klicka FAB
  const fab = page.getByRole('button', { name: /Öppna mina samlingar/i })
  const fabCount = await fab.count()
  console.log('Samlingar FAB count:', fabCount)
  if (!fabCount) {
    console.log('FAB not found — dumping body text')
    console.log((await page.locator('body').innerText()).slice(0, 600))
    await browser.close()
    process.exit(1)
  }
  await fab.click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(out, '02-open.png'), fullPage: false })

  // Räkna destinationer i panelen
  const links = await page.locator('[role="dialog"] a').allInnerTexts()
  console.log('Destinations visible:', links.length)
  links.forEach((t, i) => console.log(`  ${i + 1}. ${t.split('\n')[0]}`))

  // Klicka Mina CV
  const cvLink = page.getByRole('link', { name: /Mina CV/i })
  await cvLink.click()
  await page.waitForTimeout(1500)
  console.log('After click URL:', page.url())
  await page.screenshot({ path: path.join(out, '03-navigated-to-cv.png'), fullPage: false })

  console.log('Console errors:', errors.length)
  errors.slice(0, 5).forEach((e) => console.log('  ' + e.slice(0, 200)))

  await browser.close()
  console.log('Saved to:', out)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
