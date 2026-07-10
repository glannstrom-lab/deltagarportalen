/**
 * Zoomar in på enskilda template-thumbnails från resume.io och kickresume
 * för att kunna analysera deras designprinciper på detaljnivå.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

async function dismissBanners(page) {
  for (const txt of ['Accept all', 'Accept', 'Acceptera', 'Allow all', 'Got it', 'OK', 'Deny', 'I agree', 'AGREE']) {
    try {
      const b = page.getByRole('button', { name: new RegExp(`^${txt}$`, 'i') }).first()
      if (await b.isVisible({ timeout: 600 })) { await b.click(); await page.waitForTimeout(400); break }
    } catch {}
  }
}

async function autoScroll(page) {
  // Scroll page to bottom and back to load lazy images
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0
      const distance = 200
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight
        window.scrollBy(0, distance)
        totalHeight += distance
        if (totalHeight >= scrollHeight) {
          clearInterval(timer)
          resolve()
        }
      }, 50)
    })
  })
  await page.evaluate(() => window.scrollTo(0, 0))
  await new Promise(r => setTimeout(r, 1500))
}

async function main() {
  const out = path.join(__dirname, 'screenshots', 'research')
  fs.mkdirSync(out, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  // 1. Resume.io - scrolla fix för lazy-load
  console.log('Resume.io top 6 templates…')
  await page.goto('https://resume.io/resume-templates', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  await dismissBanners(page)
  await autoScroll(page)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(1500)
  // Top viewport screenshot
  await page.screenshot({ path: path.join(out, 'resume-io-top.png'), fullPage: false })
  // Zoom each of first 6 template-cards
  const cards = await page.$$('img[alt*="template"], a[href*="/template/"] img, .template-card img, [class*="template"] img')
  console.log(`  Found ${cards.length} template images`)
  for (let i = 0; i < Math.min(cards.length, 12); i++) {
    try {
      const box = await cards[i].boundingBox()
      if (box && box.width > 100 && box.height > 150) {
        await cards[i].screenshot({ path: path.join(out, `resume-io-tpl-${i}.png`) })
      }
    } catch {}
  }

  // 2. Kickresume
  console.log('\nKickresume top 6 templates…')
  await page.goto('https://www.kickresume.com/en/templates/resume/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  await dismissBanners(page)
  await autoScroll(page)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(out, 'kickresume-top.png'), fullPage: false })
  const kickCards = await page.$$('img[alt*="emplate"], img[class*="emplate"], [class*="emplate"] img')
  console.log(`  Found ${kickCards.length} template images`)
  for (let i = 0; i < Math.min(kickCards.length, 12); i++) {
    try {
      const box = await kickCards[i].boundingBox()
      if (box && box.width > 100 && box.height > 150) {
        await kickCards[i].screenshot({ path: path.join(out, `kickresume-tpl-${i}.png`) })
      }
    } catch {}
  }

  // 3. Enhancv
  console.log('\nEnhancv top 6 templates…')
  await page.goto('https://enhancv.com/resume-templates/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  await dismissBanners(page)
  await autoScroll(page)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(out, 'enhancv-top.png'), fullPage: false })
  const enhCards = await page.$$('img[alt*="esume"], img[class*="esume"], [class*="card"] img')
  console.log(`  Found ${enhCards.length} template images`)
  for (let i = 0; i < Math.min(enhCards.length, 12); i++) {
    try {
      const box = await enhCards[i].boundingBox()
      if (box && box.width > 100 && box.height > 150) {
        await enhCards[i].screenshot({ path: path.join(out, `enhancv-tpl-${i}.png`) })
      }
    } catch {}
  }

  await browser.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
