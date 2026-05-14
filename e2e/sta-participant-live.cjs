/**
 * Verifiera att /steg-till-arbete använder riktig molndata för en inloggad
 * deltagare och att startdatum kan redigeras.
 *
 * Använder den sparade auth-staten i e2e/.auth/state.json.
 */

const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

async function main() {
  const out = path.join(__dirname, 'screenshots', 'sta-participant')
  fs.mkdirSync(out, { recursive: true })
  const authStatePath = path.join(__dirname, '.auth', 'state.json')
  const hasAuth = fs.existsSync(authStatePath)
  console.log('auth state present:', hasAuth)

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    storageState: hasAuth ? authStatePath : undefined,
  })
  const page = await ctx.newPage()

  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message))

  await page.goto('http://localhost:3000/#/steg-till-arbete', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  console.log('URL after goto:', page.url())

  await page.screenshot({ path: path.join(out, 'initial.png'), fullPage: true })
  const initialBody = await page.locator('body').innerText()
  console.log('---- BODY (first 1500 chars) ----')
  console.log(initialBody.slice(0, 1500))
  console.log('---- /BODY ----')

  const hasEmptyState = initialBody.includes('Du är inte tilldelad')
  const hasJusteraButton = await page.getByRole('button', { name: /Justera/i }).count()
  const hasDinResa = initialBody.includes('Din resa')

  console.log('\nResults:')
  console.log('  Empty state visible:', hasEmptyState)
  console.log('  Edit-start-date button count:', hasJusteraButton)
  console.log('  "Din resa" present:', hasDinResa)
  console.log('  Console errors:', consoleErrors.length)
  if (consoleErrors.length) {
    consoleErrors.slice(0, 5).forEach((e) => console.log('    ' + e.slice(0, 200)))
  }

  // Om vi har Justera-knapp, testa edit-flow
  if (hasJusteraButton > 0) {
    console.log('\n--- Testar edit-startdatum-flow ---')
    await page.getByRole('button', { name: /Justera/i }).first().click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(out, 'edit-open.png'), fullPage: false })
    const dateInputCount = await page.locator('input[type="date"]').count()
    console.log('  Date input visible:', dateInputCount)
    if (dateInputCount > 0) {
      // Sätt ett nytt datum (en vecka tidigare)
      const today = new Date()
      today.setDate(today.getDate() - 7)
      const newDate = today.toISOString().slice(0, 10)
      await page.locator('input[type="date"]').first().fill(newDate)
      console.log('  Set draft date to:', newDate)

      // Klicka spara
      const saveBtn = page.getByRole('button', { name: /Spara/ })
      if (await saveBtn.count() > 0) {
        await saveBtn.first().click()
        await page.waitForTimeout(2500)
        await page.screenshot({ path: path.join(out, 'after-save.png'), fullPage: true })
        const afterSave = await page.locator('body').innerText()
        const stillHasError = afterSave.includes('Kunde inte spara')
        console.log('  Save error present:', stillHasError)
        const newDateDisplay = `${today.getDate()} ${['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'][today.getMonth()]}`
        console.log('  Expected new date display:', newDateDisplay)
        console.log('  Body contains new date:', afterSave.includes(newDateDisplay))
      }
    }
  }

  await browser.close()
  console.log('\nScreenshots saved to:', out)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
