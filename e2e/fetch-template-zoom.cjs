const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

async function main() {
  const out = path.join(__dirname, 'screenshots')
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()
  for (const name of ['budapest', 'rotterdam', 'chicago']) {
    await page.goto(`https://resume-example.com/${name}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(2000)
    // Zoom på den första stora preview-bilden av CV:t
    const img = page.locator('img').first()
    if (await img.count()) {
      // Hitta största/första img i hero-area
      const imgs = await page.$$eval('img', els => els.map((e, i) => ({ i, src: e.src, w: e.naturalWidth, h: e.naturalHeight })).filter(x => x.w > 400 && x.h > 400))
      console.log(`${name}: ${imgs.length} large images`)
      for (let k = 0; k < Math.min(imgs.length, 3); k++) {
        const imgEl = page.locator('img').nth(imgs[k].i)
        try {
          await imgEl.screenshot({ path: path.join(out, `template-ref-${name}-${k}.png`) })
          console.log(`  saved ${name}-${k} (${imgs[k].w}x${imgs[k].h})`)
        } catch (e) { console.log(`  fail ${k}: ${e.message.slice(0, 60)}`) }
      }
    }
  }
  await browser.close()
}
main().catch(e => { console.error(e); process.exit(1) })
