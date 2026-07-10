/**
 * DOA-demo v2 — använder bevisat fungerande pattern från sta-doa-self-flow.cjs.
 *
 * Kör så här (förutsätter att SQL för enrollment+AT-bedömningar redan körts):
 *   1. node e2e/sta-doa-demo-v2.cjs        # fyller deltagar-värden + öppnar drawer + laddar PDF
 *
 * Output: audit-2026-05-28/doa-demo-output.pdf
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

async function main() {
  const out = path.join(__dirname, 'screenshots', 'sta-doa-demo')
  const pdfOut = path.join(__dirname, '..', 'audit-2026-05-28', 'doa-demo-output.pdf')
  fs.mkdirSync(out, { recursive: true })

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    storageState: path.join(__dirname, '.auth', 'consultant.json'),
    acceptDownloads: true,
  })
  const page = await ctx.newPage()

  const errs = []
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })

  // ============================================================
  // 1. Deltagare: fyll DOA-värden
  // ============================================================
  console.log('\n=== 1. Deltagare fyller DOA-värden ===')
  await page.goto(`${BASE_URL}/#/steg-till-arbete`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  // Cookies bort
  const cookieBtn = page.getByRole('button', { name: /Acceptera alla/i }).first()
  if (await cookieBtn.count() > 0) {
    await cookieBtn.click().catch(() => {})
    await page.waitForTimeout(300)
  }

  const bodyText = await page.locator('body').innerText()
  if (bodyText.includes('Du är inte tilldelad')) {
    console.log('  → Skapar self-test-enrollment via UI')
    const createBtn = page.getByRole('button', { name: /Skapa testkoppling/i }).first()
    await createBtn.click({ force: true })
    await page.waitForTimeout(3500)
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(1500)
  }

  // Öppna Del 1 → Min skattning
  const del1Tab = page.getByRole('tab', { name: /Del 1/i }).first()
  if (await del1Tab.count() > 0) await del1Tab.click({ force: true })
  await page.waitForTimeout(800)

  // Öppna wizarden (rad-knappen)
  const startBtn = page
    .getByRole('button', { name: /Börja skattningen|Fortsätt där du var|Se mina svar/i })
    .first()
  await startBtn.click({ force: true })
  await page.waitForTimeout(800)

  // Klicka "Börja"/"Fortsätt" i modalen (sista button i DOM = modalens)
  const beginBtn = page
    .getByRole('button', { name: /^Börja$|^Fortsätt där du var$/ })
    .last()
  if (await beginBtn.count() > 0) {
    await beginBtn.click({ force: true })
    await page.waitForTimeout(800)
  }

  // Fyll alla 9 items i kategori 1 + kommentar på första
  console.log('  Fyller 9 items i kategori 1...')
  const values = [4, 5, 3, 4, 5, 3, 4, 5, 4]
  const itemRows = page.locator('li').filter({ has: page.locator('button[aria-pressed]') })
  const rowCount = await itemRows.count()
  console.log('  Item-rader hittade:', rowCount)
  for (let i = 0; i < Math.min(values.length, rowCount); i++) {
    const btn = itemRows.nth(i).locator('button[aria-pressed]').filter({ hasText: String(values[i]) }).first()
    await btn.click({ force: true })
    await page.waitForTimeout(250)
  }

  // Kommentar på item 1
  const firstComment = itemRows.nth(0).locator('textarea').first()
  await firstComment.click({ force: true })
  await firstComment.fill('Jag känner att jag kan om jag får tid. Stressade situationer drar ner det här.')
  await firstComment.blur()
  await page.waitForTimeout(800)

  // Stäng wizarden med Escape
  await page.keyboard.press('Escape')
  await page.waitForTimeout(800)
  console.log('  ✓ Deltagar-värden sparade')

  // ============================================================
  // 2. Switcha till konsulent-vyn och öppna drawern
  //    Använd EXAKT samma pattern som fungerade i sta-doa-self-flow.cjs
  // ============================================================
  console.log('\n=== 2. Konsulent-vy — öppna deltagaren ===')
  await page.goto(`${BASE_URL}/#/konsulent/steg-till-arbete`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500) // ge tid för all rendering

  // Hoppa över ev. profil-onboarding
  for (let i = 0; i < 3; i++) {
    const skip = page.getByRole('button', { name: /Hoppa över/i }).first()
    if (await skip.count() > 0 && await skip.isVisible().catch(() => false)) {
      await skip.click({ force: true }).catch(() => {})
      await page.waitForTimeout(400)
    } else break
  }

  // Klicka deltagarens namn (Akuta deadlines-button matchas av text-locator)
  const namnLink = page.locator('text=Claude Test').first()
  console.log('  Namn-länk hittad:', await namnLink.count())
  await namnLink.scrollIntoViewIfNeeded()
  await namnLink.click({ force: true })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(out, 'v2-drawer.png'), fullPage: true })

  // Drawer — använd aside-scope
  const drawer = page.locator('aside[data-domain="action"]').first()
  const drawerVisible = await drawer.isVisible().catch(() => false)
  console.log('  Drawer visible:', drawerVisible)
  if (!drawerVisible) {
    console.error('  ! Drawer öppnade inte — abort')
    await browser.close()
    process.exit(1)
  }

  // Skattningar-tab i drawer
  await drawer.getByRole('button', { name: /^Skattningar$/ }).first().click({ force: true })
  await page.waitForTimeout(800)

  // Öppna DOA-skattningen
  await drawer.getByRole('button', { name: /Öppna|Bedöm|Fortsätt/ }).first().click({ force: true })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(out, 'v2-editor.png'), fullPage: true })
  console.log('  ✓ AssessmentEditor öppen')

  // ============================================================
  // 3. Klicka PDF-export
  // ============================================================
  console.log('\n=== 3. Ladda ner PDF ===')
  const pdfBtn = page.getByRole('button', { name: /AF-blankett/i }).first()
  const downloadPromise = page.waitForEvent('download', { timeout: 15000 })
  await pdfBtn.click({ force: true })
  const download = await downloadPromise
  await download.saveAs(pdfOut)
  const size = fs.statSync(pdfOut).size
  console.log(`  ✓ PDF: ${pdfOut} (${(size / 1024).toFixed(1)} KB)`)

  console.log('\n=== Console-fel:', errs.length, '===')
  errs.slice(0, 5).forEach((e) => console.log('  -', e.slice(0, 150)))
  await browser.close()
}

main().catch((err) => {
  console.error('TEST FAILED:', err.message)
  process.exit(1)
})
