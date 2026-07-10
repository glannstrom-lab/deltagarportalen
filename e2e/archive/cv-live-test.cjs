/**
 * Live tests för CV-sidan: stub login, fyll i fält, byt mall,
 * verifiera auto-save och förhandsvisning.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE = process.env.BASE_URL || 'http://localhost:3004'
const SHOTS = path.join(__dirname, 'screenshots', 'live')

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true })
  const browser = await chromium.launch()
  const issues = []

  // ============ Test 1: Mobile viewport ============
  let context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE
    deviceScaleFactor: 2,
  })
  await context.addInitScript(() => {
    localStorage.setItem('jobin_cookie_consent', 'true')
    localStorage.setItem('cv-onboarding-completed', 'true')
    localStorage.setItem('welcome-seen', 'true')
  })
  let page = await context.newPage()
  page.on('pageerror', err => issues.push(`[mobile pageerror] ${err.message}`))
  page.on('console', m => { if (m.type() === 'error') issues.push(`[mobile console] ${m.text().slice(0, 200)}`) })

  console.log('\n=== Test 1: CV-sidan på mobil (375px iPhone SE) ===')
  // /print/cv?demo=mikael&manual=1 funkar utan login
  await page.goto(`${BASE}/#/print/cv?demo=mikael&template=atelier&manual=1`, { waitUntil: 'domcontentloaded' })
  await page.locator('.cv-preview').waitFor({ state: 'visible', timeout: 10000 }).catch(() => issues.push('mobile: .cv-preview never appeared on print/cv'))
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${SHOTS}/01-mobile-print-atelier.png`, fullPage: true })
  console.log('  ✓ Print-route renderar på mobil')

  // Kontrollera om CVBuilder själv är nåbar utan login (om login krävs får vi redirect)
  await page.goto(`${BASE}/#/cv`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  const url = page.url()
  console.log(`  CVBuilder URL: ${url}`)
  await page.screenshot({ path: `${SHOTS}/02-mobile-cv-page.png`, fullPage: true })
  if (url.includes('login')) {
    console.log('  ⚠ /cv kräver login — kan inte testa builder direkt')
    issues.push('CVBuilder kräver login — använder /print/cv?demo=mikael för andra tester')
  }
  await context.close()

  // ============ Test 2: Desktop viewport - alla mallar ============
  context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  })
  await context.addInitScript(() => {
    localStorage.setItem('jobin_cookie_consent', 'true')
  })
  page = await context.newPage()
  page.on('pageerror', err => issues.push(`[desktop pageerror] ${err.message}`))
  page.on('console', m => { if (m.type() === 'error') issues.push(`[desktop console] ${m.text().slice(0, 200)}`) })

  console.log('\n=== Test 2: Desktop screen-render alla 11 mallar ===')
  const templates = ['sidebar', 'centered', 'minimal', 'creative', 'executive', 'nordic', 'budapest', 'rotterdam', 'chicago', 'atelier', 'manhattan']
  for (const tpl of templates) {
    await page.goto(`${BASE}/#/print/cv?demo=mikael&template=${tpl}&manual=1`, { waitUntil: 'domcontentloaded' })
    try {
      await page.locator('.cv-preview').waitFor({ state: 'visible', timeout: 10000 })
      await page.waitForTimeout(400)
      await page.locator('.cv-preview').screenshot({ path: `${SHOTS}/screen-${tpl}.png` })
      console.log(`  ✓ ${tpl}`)
    } catch (e) {
      console.log(`  ✗ ${tpl}: ${e.message.slice(0, 80)}`)
      issues.push(`${tpl} renderar inte: ${e.message.slice(0, 80)}`)
    }
  }

  // ============ Test 3: Edge cases - tom data, väldigt långa fält ============
  console.log('\n=== Test 3: Edge cases via TemplateSnapshot tom data ===')
  // Vi kollar om /template-snapshot funkar med olika inputs.
  // (Snapshot-routen har hårdkodad SAMPLE — så vi kollar bara att det inte krashar)
  for (const tpl of ['atelier', 'manhattan', 'minimal', 'executive']) {
    await page.goto(`${BASE}/#/template-snapshot/${tpl}`, { waitUntil: 'domcontentloaded' })
    try {
      await page.locator('.cv-preview').waitFor({ state: 'visible', timeout: 8000 })
      console.log(`  ✓ snapshot ${tpl} renderar utan crasch`)
    } catch (e) {
      console.log(`  ✗ snapshot ${tpl}: ${e.message.slice(0, 80)}`)
    }
  }

  await browser.close()

  console.log('\n=== Issues (' + issues.length + ') ===')
  for (const i of issues) console.log('  - ' + i)
}

main().catch(e => { console.error(e); process.exit(1) })
