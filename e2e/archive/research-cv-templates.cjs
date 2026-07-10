/**
 * Hämtar templates-pages från de stora CV-byggarnas sajter och sparar
 * full-page screenshots för att se vilka design-patterns de använder.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

async function main() {
  const out = path.join(__dirname, 'screenshots', 'research')
  fs.mkdirSync(out, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  const sites = [
    { name: 'resume-io-templates', url: 'https://resume.io/resume-templates' },
    { name: 'kickresume-templates', url: 'https://www.kickresume.com/en/templates/resume/' },
    { name: 'enhancv-templates', url: 'https://enhancv.com/resume-templates/' },
    { name: 'novoresume-templates', url: 'https://novoresume.com/resume-templates' },
    { name: 'zety-templates', url: 'https://zety.com/templates/resume' },
    { name: 'visualcv-templates', url: 'https://www.visualcv.com/resume-templates/' },
  ]

  for (const s of sites) {
    try {
      console.log(`Fetching ${s.name}…`)
      const resp = await page.goto(s.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      if (!resp || resp.status() >= 400) {
        console.log(`  SKIP ${s.url} (${resp?.status() || 'no resp'})`)
        continue
      }
      await page.waitForTimeout(2500)
      // Försök stänga cookie-banner
      for (const txt of ['Accept all', 'Accept', 'Acceptera', 'Allow all', 'Got it', 'OK', 'Deny']) {
        try {
          const b = page.getByRole('button', { name: new RegExp(`^${txt}$`, 'i') }).first()
          if (await b.isVisible({ timeout: 600 })) { await b.click(); await page.waitForTimeout(300); break }
        } catch {}
      }
      await page.waitForTimeout(800)
      const file = path.join(out, `${s.name}.png`)
      await page.screenshot({ path: file, fullPage: true })
      const size = fs.statSync(file).size
      console.log(`  ✓ ${path.basename(file)} (${(size / 1024).toFixed(1)} kB)`)
    } catch (e) {
      console.log(`  FAIL: ${e.message.slice(0, 80)}`)
    }
  }

  await browser.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
