const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

async function main() {
  const out = path.join(__dirname, 'screenshots', 'wellness-button')
  fs.mkdirSync(out, { recursive: true })
  const authStatePath = path.join(__dirname, '.auth', 'state.json')

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    storageState: authStatePath,
  })
  const page = await ctx.newPage()
  await page.goto('http://localhost:3000/#/wellness', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  try { await page.getByRole('button', { name: /Hoppa över|Skip|Stäng/i }).first().click({ timeout: 1500 }) } catch {}
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(400)

  // Skriv reflection så knappen blir aktiv
  const reflection = page.locator('textarea').first()
  if (await reflection.count()) {
    await reflection.fill('Idag var en bra dag.')
    await page.waitForTimeout(300)
  }

  // Hitta save-knappen och inspektera dess style
  const saveBtn = page.getByRole('button', { name: /Spara reflektion|Save reflection/i }).first()
  const btnCount = await saveBtn.count()
  console.log('Save reflection button count:', btnCount)
  if (btnCount > 0) {
    const bg = await saveBtn.evaluate(el => window.getComputedStyle(el).backgroundColor)
    const color = await saveBtn.evaluate(el => window.getComputedStyle(el).color)
    console.log('Background:', bg)
    console.log('Color:', color)
    await saveBtn.scrollIntoViewIfNeeded()
    await page.screenshot({ path: path.join(out, 'wellness-save-button.png'), clip: await saveBtn.boundingBox() })
  }
  await page.screenshot({ path: path.join(out, 'wellness-full.png'), fullPage: false })
  await browser.close()
}
main().catch(err => { console.error(err); process.exit(1) })
