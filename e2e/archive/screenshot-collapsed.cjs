const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

async function main() {
  const env = {}
  for (const line of fs.readFileSync('.env.test.local', 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001'
  const statePath = path.join(__dirname, '.auth', 'state.json')

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: fs.existsSync(statePath) ? statePath : undefined,
  })
  const page = await ctx.newPage()

  await page.goto(`${baseUrl}/#/job-search`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  const minimera = page.getByRole('button', { name: /minimera/i }).first()
  if (await minimera.isVisible({ timeout: 1000 }).catch(() => false)) {
    await minimera.click()
    await page.waitForTimeout(500)
  }
  await page.evaluate(() => {
    window.scrollTo(0, 0)
    document.querySelectorAll('aside, aside *').forEach(el => { if (el.scrollTop) el.scrollTop = 0 })
  })
  await page.waitForTimeout(300)
  await page.locator('aside nav a').first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'sidebar-collapsed.png') })
  console.log('Saved sidebar-collapsed.png')
  await browser.close()
}
main().catch(e => { console.error(e); process.exit(1) })
