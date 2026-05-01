/**
 * Söker upp Budapest/Rotterdam/Chicago-mallar på resume-example.com via
 * deras blog/template-pages. Sparar fullsides-screenshots.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

async function main() {
  const out = path.join(__dirname, 'screenshots')
  fs.mkdirSync(out, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  // Kandidat-URLs för varje mall
  const candidates = [
    { name: 'budapest', urls: ['https://resume-example.com/budapest', 'https://resume-example.com/budapest-cv', 'https://resume-example.com/templates/budapest', 'https://resume-example.com/cv-templates/budapest'] },
    { name: 'rotterdam', urls: ['https://resume-example.com/rotterdam', 'https://resume-example.com/rotterdam-cv', 'https://resume-example.com/templates/rotterdam', 'https://resume-example.com/cv-templates/rotterdam'] },
    { name: 'chicago', urls: ['https://resume-example.com/chicago', 'https://resume-example.com/chicago-cv', 'https://resume-example.com/templates/chicago', 'https://resume-example.com/cv-templates/chicago'] },
  ]

  for (const c of candidates) {
    console.log(`\n=== ${c.name} ===`)
    for (const url of c.urls) {
      try {
        const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
        if (resp && resp.status() < 400) {
          console.log(`OK ${url} (${resp.status()})`)
          await page.waitForTimeout(2000)
          // Försök stänga cookie banner
          for (const txt of ['Deny', 'Accept', 'Acceptera', 'OK']) {
            try {
              const b = page.getByRole('button', { name: new RegExp(`^${txt}$`, 'i') }).first()
              if (await b.isVisible({ timeout: 600 })) { await b.click(); await page.waitForTimeout(400); break }
            } catch {}
          }
          await page.screenshot({ path: path.join(out, `elegantcv-${c.name}.png`), fullPage: true })
          break
        } else {
          console.log(`SKIP ${url} (${resp?.status()})`)
        }
      } catch (e) {
        console.log(`FAIL ${url}: ${e.message.slice(0, 60)}`)
      }
    }
  }

  await browser.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
