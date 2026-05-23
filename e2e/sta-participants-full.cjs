/**
 * Verifiera Group B+C+D av Deltagare-fliken:
 *  - Multi-select med checkboxar + bulk-toolbar (Pause/Resume/Complete)
 *  - Mobil card-vy under md (768px)
 *  - Pagination (visa endast om >25 deltagare; med 4 deltagare ska den INTE synas)
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'

async function go(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  const cookieBtn = page.getByRole('button', { name: /Acceptera|Godkänn|Endast nödvändiga/i }).first()
  if (await cookieBtn.count()) {
    await cookieBtn.click({ timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(300)
  }
}

async function clickTab(page) {
  const tab = page.locator('button:has-text("Deltagare")').filter({ hasNotText: /Importera|Lägg|Granska|Inbjud|Bjud/i }).first()
  await tab.waitFor({ state: 'visible', timeout: 10000 })
  await tab.click()
  await page.waitForTimeout(600)
}

async function main() {
  const out = path.join(__dirname, 'screenshots', 'sta-participants-full')
  fs.mkdirSync(out, { recursive: true })
  const authState = path.join(__dirname, '.auth', 'consultant.json')

  // ============================ DESKTOP ============================
  {
    const browser = await chromium.launch()
    const ctx = await browser.newContext({
      viewport: { width: 1400, height: 900 },
      storageState: authState,
    })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

    await go(page, `${BASE}/#/konsulent/steg-till-arbete`)
    await clickTab(page)
    await page.screenshot({ path: path.join(out, '01-desktop-default.png'), fullPage: true })

    // Markera alla synliga via header-checkbox
    const headerCheck = page.locator('input[aria-label="Välj alla synliga deltagare"]').first()
    if (await headerCheck.count()) {
      await headerCheck.click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: path.join(out, '02-desktop-bulk-toolbar.png'), fullPage: false })
    } else {
      console.log('Header-checkbox saknas — något stämmer inte')
    }

    // Klicka "Pausa" → ska öppna confirm
    const pauseBtn = page.getByRole('button', { name: /^Pausa$/i }).first()
    if (await pauseBtn.count()) {
      await pauseBtn.click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: path.join(out, '03-desktop-confirm-pause.png'), fullPage: false })
      // Avbryt — vi vill inte faktiskt pausa testdata
      await page.getByRole('button', { name: /^Avbryt$/i }).first().click()
      await page.waitForTimeout(300)
    }

    console.log('Desktop console errors:', errors.length)
    errors.slice(0, 5).forEach((e) => console.log('  ' + e.slice(0, 200)))
    await browser.close()
  }

  // ============================ MOBILE ============================
  {
    const browser = await chromium.launch()
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      storageState: authState,
    })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

    await go(page, `${BASE}/#/konsulent/steg-till-arbete`)
    await clickTab(page)
    await page.screenshot({ path: path.join(out, '04-mobile-cards.png'), fullPage: true })

    console.log('Mobile console errors:', errors.length)
    errors.slice(0, 5).forEach((e) => console.log('  ' + e.slice(0, 200)))
    await browser.close()
  }

  console.log('Saved to:', out)
}

main().catch((e) => { console.error(e); process.exit(1) })
