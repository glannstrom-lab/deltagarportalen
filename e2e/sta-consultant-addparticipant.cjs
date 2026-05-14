/**
 * Verifiera att konsulentens AddParticipantModal har en datumväljare
 * och att startdatum sparas korrekt.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

async function main() {
  const out = path.join(__dirname, 'screenshots', 'sta-consultant-add')
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

  await page.goto('http://localhost:3000/#/konsulent/steg-till-arbete', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  console.log('URL:', page.url())
  await page.screenshot({ path: path.join(out, '01-landing.png'), fullPage: true })

  // Klicka "Lägg till deltagare"
  const addBtn = page.getByRole('button', { name: /Lägg till deltagare|Lägg till första deltagaren|Ny deltagare/i }).first()
  const addBtnCount = await addBtn.count()
  console.log('Add button count:', addBtnCount)
  if (addBtnCount === 0) {
    const bodyText = (await page.locator('body').innerText()).slice(0, 800)
    console.log('Body:', bodyText)
  }
  await addBtn.click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(out, '02-modal.png'), fullPage: true })

  // Kolla att datumväljaren finns
  const dateInput = page.locator('input#sta-start-date')
  const dateInputCount = await dateInput.count()
  console.log('Date input count:', dateInputCount)
  const dateValue = dateInputCount ? await dateInput.inputValue() : null
  console.log('Default date value:', dateValue)

  // Ändra datum till nästa måndag
  const nextMonday = new Date()
  while (nextMonday.getDay() !== 1) nextMonday.setDate(nextMonday.getDate() + 1)
  const isoNextMon = `${nextMonday.getFullYear()}-${String(nextMonday.getMonth()+1).padStart(2,'0')}-${String(nextMonday.getDate()).padStart(2,'0')}`
  await dateInput.fill(isoNextMon)
  console.log('Set date to:', isoNextMon)

  // Fyll i namn
  await page.getByLabel(/För- och efternamn/).fill('E2E Test Deltagare')
  // Fyll i personnummer
  const piInput = page.getByLabel(/Personnummer/i)
  if (await piInput.count()) await piInput.fill('20000101-1234')

  await page.screenshot({ path: path.join(out, '03-filled.png'), fullPage: true })

  // Klicka "Lägg till manuellt"
  const saveBtn = page.getByRole('button', { name: /Lägg till manuellt|Skicka inbjudan/ })
  await saveBtn.click()
  await page.waitForTimeout(2500)
  await page.screenshot({ path: path.join(out, '04-after-save.png'), fullPage: true })

  console.log('Console errors:', errors.length)
  errors.slice(0, 3).forEach((e) => console.log('  ' + e.slice(0, 200)))

  await browser.close()
  console.log('Saved to:', out)
}

main().catch((err) => { console.error(err); process.exit(1) })
