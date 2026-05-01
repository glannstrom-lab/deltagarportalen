/**
 * Genererar thumbnail-bilder för CV-mallarna genom att besöka
 * /#/template-snapshot/<id> och fota A4-bredden.
 *
 * Output: client/public/templates/<id>.png  (committas i repot)
 *
 * Kör efter att du ändrat en mall för att uppdatera mall-thumbnails som
 * CVBuilder visar i steg 1 (Design).
 *
 * Usage: node e2e/cv-template-snapshots.cjs
 */

const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEMPLATES = ['sidebar', 'centered', 'minimal', 'creative', 'executive', 'nordic', 'budapest', 'rotterdam', 'chicago', 'atelier', 'manhattan']

async function main() {
  const outDir = path.join(ROOT, 'client', 'public', 'templates')
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1000, height: 1414 }, // A4-aspect ~ 794×1123 + lite marginal
    deviceScaleFactor: 2, // 2x för retina-skärpa
  })
  const page = await context.newPage()

  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  // Pre-seed localStorage före första render så cookie-banner inte poppar upp.
  // initScript körs på varje ny sida före allt annat på origin.
  await context.addInitScript(() => {
    localStorage.setItem('jobin_cookie_consent', 'true')
    localStorage.setItem('jobin_cookie_preferences', JSON.stringify({ necessary: true, analytics: false }))
    localStorage.setItem('cv-onboarding-completed', 'true')
    localStorage.setItem('welcome-seen', 'true')
  })

  for (const tpl of TEMPLATES) {
    const url = `${BASE_URL}/#/template-snapshot/${tpl}`
    console.log(`Snapshot: ${tpl}`)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    // Vänta på att .cv-preview renderas
    await page.locator('.cv-preview').first().waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(800)

    const previewBox = await page.locator('.cv-preview').first().boundingBox()
    if (!previewBox) {
      console.log(`  ⚠ Hittade inte preview-element för ${tpl}`)
      continue
    }
    // Fota hela CV-arket (kan vara mycket högre än viewport)
    const out = path.join(outDir, `${tpl}.png`)
    await page.locator('.cv-preview').first().screenshot({ path: out })
    console.log(`  ✓ ${path.relative(ROOT, out)}`)
  }

  if (errors.length) {
    console.log(`\nConsole errors (${errors.length}):`)
    for (const e of errors.slice(0, 8)) console.log('  ' + e.slice(0, 200))
  } else {
    console.log('\nInga errors.')
  }

  await browser.close()
}

main().catch((err) => { console.error(err); process.exit(1) })
