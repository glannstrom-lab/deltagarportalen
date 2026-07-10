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
  await page.waitForTimeout(3000)

  const beforeText = await page.locator('text=/Visar \d+ av \d+ jobb/').first().textContent()
  console.log('FORE scroll:', beforeText?.trim())

  await page.evaluate(() => {
    const el = document.querySelector('main')
    if (el) el.scrollTo(0, el.scrollHeight)
    else window.scrollTo(0, document.body.scrollHeight)
  })
  await page.waitForTimeout(2500)

  const afterText = await page.locator('text=/Visar \d+ av \d+ jobb/').first().textContent()
  console.log('EFTER scroll:', afterText?.trim())

  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'job-search-after-scroll.png') })
  await browser.close()
}
main().catch(e => { console.error(e); process.exit(1) })
