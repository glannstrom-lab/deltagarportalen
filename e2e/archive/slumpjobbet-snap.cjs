/**
 * Tar screenshots av Slumpjobbet-tabben för visuell verifiering.
 * Förutsätter att man är inloggad — annars omdirigeras man till login.
 * Vi använder en hint via localStorage så onboarding inte blockerar.
 */
const { chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function main() {
  const outDir = path.join(__dirname, '..', 'audit-2026-05-22', 'slumpjobbet')
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1280, height: 1200 } })
  await context.addInitScript(() => {
    localStorage.setItem('jobin_cookie_consent', 'true')
  })
  const page = await context.newPage()
  page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') console.log(`[console.error] ${m.text()}`) })

  await page.goto(`${BASE_URL}/#/job-search/slumpjobbet`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  // Screenshot oavsett om vi blev omdirigerade — det visar var vi hamnar
  const url = page.url()
  console.log('Final URL:', url)
  await page.screenshot({ path: path.join(outDir, 'page.png'), fullPage: true })
  await browser.close()
}
main().catch(e => { console.error(e); process.exit(1) })
