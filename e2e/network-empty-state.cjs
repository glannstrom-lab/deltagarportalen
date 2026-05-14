/**
 * Verifiera att /nätverk visar EN tydlig EmptyState istället för
 * 3 staplade tomtillstånd (KPI med 0 + tom kontakt-lista + tom event-lista).
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

async function main() {
  const out = path.join(__dirname, 'screenshots', 'network-empty')
  fs.mkdirSync(out, { recursive: true })
  const authStatePath = path.join(__dirname, '.auth', 'state.json')

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    storageState: authStatePath,
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()))
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message))

  await page.goto('http://localhost:3000/#/nätverk', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  // Stäng onboarding-dialog om den finns
  try {
    const skip = page.getByRole('button', { name: /Hoppa över|Skip|Stäng|Close/i }).first()
    if (await skip.count()) await skip.click({ timeout: 1500 })
  } catch {}
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(400)

  await page.screenshot({ path: path.join(out, 'network.png'), fullPage: true })

  const body = await page.locator('body').innerText()
  const hasWelcomeTitle = body.includes('Här bygger du ditt nätverk')
  const hasAddFirstContact = body.includes('Lägg till första kontakten')

  // Räkna KPI-nollor — de ska INTE finnas på sidan
  const kpiCardCount = await page.locator('div.grid-cols-2.md\\:grid-cols-4 > .text-center').count()

  // Räkna stora tom-lista-meddelanden
  const noContactsText = body.includes('Du har inga kontakter ännu')
  const noEventsText = body.includes('Inga kommande event')

  console.log('Has welcome title:', hasWelcomeTitle)
  console.log('Has "Lägg till första kontakten":', hasAddFirstContact)
  console.log('KPI-kort visible:', kpiCardCount)
  console.log('"Du har inga kontakter ännu" visible:', noContactsText)
  console.log('"Inga kommande event" visible:', noEventsText)
  console.log('Console errors:', errors.length)
  errors.slice(0, 3).forEach((e) => console.log('  ' + e.slice(0, 200)))

  await browser.close()
  console.log('\nSaved to:', out)
}

main().catch((err) => { console.error(err); process.exit(1) })
