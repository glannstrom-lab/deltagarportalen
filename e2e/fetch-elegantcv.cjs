/**
 * Hämtar elegantcv.app via Playwright (WebFetch blockas av Cloudflare 403)
 * och fotograferar landningssida + galleri av CV-mallar.
 */

const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

async function main() {
  const screenshotsDir = path.join(__dirname, 'screenshots')
  fs.mkdirSync(screenshotsDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  // Hämta hero-bilden från startsidan
  await page.goto('https://elegantcv.app', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(2000)
  // Stäng cookie-banner via Deny / X
  for (const txt of ['Deny', 'Allow all', 'Accept all', 'Accept', 'Acceptera', 'OK', 'Got it']) {
    try {
      const b = page.getByRole('button', { name: new RegExp(`^${txt}$`, 'i') }).first()
      if (await b.isVisible({ timeout: 800 })) { await b.click(); await page.waitForTimeout(600); break }
    } catch {}
  }
  // Försök även stänga via aria-label close
  try { await page.locator('[aria-label*="close" i]').first().click({ timeout: 800 }) } catch {}

  // Hela startsidan
  await page.screenshot({ path: path.join(screenshotsDir, 'elegantcv-full.png'), fullPage: true })

  // Hero utan cookie
  await page.screenshot({ path: path.join(screenshotsDir, 'elegantcv-hero.png'), fullPage: false, clip: { x: 0, y: 0, width: 1440, height: 900 } })

  // Zoomar in på CV-previews i hero (höger 60% av sidan)
  await page.screenshot({ path: path.join(screenshotsDir, 'elegantcv-cvs-zoom.png'), fullPage: false, clip: { x: 600, y: 0, width: 840, height: 700 } })

  // Använd image-länken till "resume-Example-7" — den ledde tillbaka till samma sida.
  // Hämta alla img-attribut på sidan så vi hittar template-bilderna direkt
  const images = await page.$$eval('img', imgs => imgs.map(i => ({ src: i.src, alt: i.alt, w: i.naturalWidth, h: i.naturalHeight })).filter(i => i.w > 200 && i.h > 200))
  console.log('\nImages > 200px:')
  for (const i of images.slice(0, 25)) console.log(`  ${i.w}x${i.h} alt="${i.alt.slice(0, 40)}" — ${i.src.slice(0, 100)}`)

  // Försök hitta länkar till templates/showcase
  const links = await page.$$eval('a', as => as.map(a => ({ text: a.textContent.trim().slice(0, 60), href: a.href })).filter(l => l.href && /template|gallery|sample|example|cv|resume/i.test(l.text)))
  console.log('Möjliga länkar:')
  for (const l of links.slice(0, 20)) console.log(`  ${l.text} → ${l.href}`)

  // Zooma in på första hero-bilden
  const heroImg = page.locator('img').first()
  if (await heroImg.count()) {
    await heroImg.screenshot({ path: path.join(screenshotsDir, 'elegantcv-heroimg.png') }).catch(() => {})
  }

  // Försök gå direkt in på en preview/template-sida om det finns
  for (const candidate of ['/templates', '/cv-templates', '/resume-templates', '/preview', '/showcase']) {
    const url = `https://elegantcv.app${candidate}`
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
      if (resp && resp.status() < 400) {
        await page.waitForTimeout(2000)
        const slug = candidate.replace(/[^a-z0-9]/gi, '-')
        await page.screenshot({ path: path.join(screenshotsDir, `elegantcv${slug}.png`), fullPage: true })
        console.log(`OK ${candidate} (${resp.status()})`)
      } else {
        console.log(`SKIP ${candidate} (${resp ? resp.status() : 'no resp'})`)
      }
    } catch (e) {
      console.log(`FAIL ${candidate}: ${e.message.slice(0, 60)}`)
    }
  }

  await browser.close()
}

main().catch((err) => { console.error(err); process.exit(1) })
