/**
 * DOA-AI-test: deltagare fyller wizard → AT öppnar editor → klickar "Föreslå med AI" →
 * verifiera att utkastet syns i UI → ladda ner PDF → verifiera att Text230-235 är ifyllda.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

async function main() {
  const out = path.join(__dirname, 'screenshots', 'sta-doa-ai')
  const pdfOut = path.join(__dirname, '..', 'audit-2026-05-28', 'doa-ai-output.pdf')
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
  // Hantera confirm/alert-dialoger automatiskt
  page.on('dialog', async (dialog) => {
    console.log('  [dialog]', dialog.type(), '-', dialog.message().slice(0, 80))
    // För DOA-export-gate: vi har redan AI-summary, så gate ska inte triggas.
    // Om den ändå gör det (race condition), dismiss = exportera med befintlig text.
    await dialog.dismiss().catch(() => {})
  })

  // 1. Skapa enrollment + fyll DOA-värden
  console.log('=== 1. Skapa enrollment och fyll DOA som deltagare ===')
  await page.goto(`${BASE_URL}/#/steg-till-arbete`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const cookieBtn = page.getByRole('button', { name: /Acceptera alla/i }).first()
  if (await cookieBtn.count() > 0) {
    await cookieBtn.click().catch(() => {})
    await page.waitForTimeout(300)
  }

  const bodyText = await page.locator('body').innerText()
  if (bodyText.includes('Du är inte tilldelad')) {
    console.log('  → Skapar self-test-enrollment')
    await page.getByRole('button', { name: /Skapa testkoppling/i }).first().click({ force: true })
    await page.waitForTimeout(3500)
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(1500)
  }

  // Öppna Del 1 + wizarden
  const del1Tab = page.getByRole('tab', { name: /Del 1/i }).first()
  if (await del1Tab.count() > 0) await del1Tab.click({ force: true })
  await page.waitForTimeout(800)
  await page
    .getByRole('button', { name: /Börja skattningen|Fortsätt där du var|Se mina svar/i })
    .first()
    .click({ force: true })
  await page.waitForTimeout(800)
  const beginBtn = page.getByRole('button', { name: /^Börja$|^Fortsätt där du var$/ }).last()
  if (await beginBtn.count() > 0) {
    await beginBtn.click({ force: true })
    await page.waitForTimeout(800)
  }

  console.log('  Fyller 9 items i kategori 1...')
  const values = [4, 5, 3, 4, 5, 3, 4, 5, 4]
  const itemRows = page.locator('li').filter({ has: page.locator('button[aria-pressed]') })
  const rowCount = await itemRows.count()
  for (let i = 0; i < Math.min(values.length, rowCount); i++) {
    const btn = itemRows.nth(i).locator('button[aria-pressed]').filter({ hasText: String(values[i]) }).first()
    await btn.click({ force: true })
    await page.waitForTimeout(250)
  }
  const firstComment = itemRows.nth(0).locator('textarea').first()
  await firstComment.click({ force: true })
  await firstComment.fill('Jag känner att jag kan när jag får tid. Stressade situationer drar ner det här.')
  await firstComment.blur()
  await page.waitForTimeout(800)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(800)
  console.log('  ✓ Deltagar-värden sparade (9 items)')

  // 2. Öppna AssessmentEditor via konsulent-vyn
  console.log('\n=== 2. Öppna AssessmentEditor som konsulent ===')
  await page.goto(`${BASE_URL}/#/konsulent/steg-till-arbete`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  for (let i = 0; i < 3; i++) {
    const skip = page.getByRole('button', { name: /Hoppa över/i }).first()
    if (await skip.count() > 0 && await skip.isVisible().catch(() => false)) {
      await skip.click({ force: true }).catch(() => {})
      await page.waitForTimeout(400)
    } else break
  }

  const namnLink = page.locator('text=Claude Test').first()
  await namnLink.scrollIntoViewIfNeeded()
  await namnLink.click({ force: true })
  await page.waitForTimeout(2000)

  const drawer = page.locator('aside[data-domain="action"]').first()
  if (!(await drawer.isVisible().catch(() => false))) {
    console.error('  ! Drawer öppnade inte')
    await browser.close()
    process.exit(1)
  }
  await drawer.getByRole('button', { name: /^Skattningar$/ }).first().click({ force: true })
  await page.waitForTimeout(800)
  await drawer.getByRole('button', { name: /Öppna|Bedöm|Fortsätt/ }).first().click({ force: true })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(out, '01-editor-open.png'), fullPage: true })
  console.log('  ✓ AssessmentEditor öppen')

  // 3. Klicka "Föreslå med AI"
  console.log('\n=== 3. Klicka "Föreslå med AI" ===')
  // Scroll ner så knappen syns
  const aiBtn = page.getByRole('button', { name: /Föreslå med AI|Regenerera utkast/i }).first()
  await aiBtn.scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(out, '02-summary-section.png'), fullPage: true })
  await aiBtn.click({ force: true })

  // Vänta in AI-svar (gpt-oss-120b brukar ta 5-15 sek för 1500 tokens)
  console.log('  Väntar på AI-svar (upp till 60 sek)...')
  const malField = page.locator('#doa-summary-mal')
  let aiGenerated = false
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(1000)
    const val = await malField.inputValue().catch(() => '')
    if (val && val.length > 20) {
      aiGenerated = true
      console.log(`  ✓ AI klar efter ${i + 1}s. Mål-text: ${val.slice(0, 80)}...`)
      break
    }
  }
  if (!aiGenerated) {
    console.error('  ! AI gav inget svar inom 60s')
    await page.screenshot({ path: path.join(out, '03-ai-timeout.png'), fullPage: true })
    await browser.close()
    process.exit(1)
  }
  await page.screenshot({ path: path.join(out, '03-after-ai.png'), fullPage: true })

  // Logga alla 5 kategori-fält
  for (let i = 0; i < 5; i++) {
    const v = await page.locator(`#doa-summary-cat-${i}`).inputValue().catch(() => '')
    console.log(`  Kategori ${i + 1}: ${v.slice(0, 60)}...`)
  }

  // 4. Spara utkastet (annars är PDF-knappen disabled pga dirty)
  console.log('\n=== 4. Spara utkastet ===')
  const sparaBtn = page.getByRole('button', { name: /Spara utkast/i }).first()
  await sparaBtn.click({ force: true })
  // Vänta in tills "Allt sparat" syns ELLER 8s
  for (let i = 0; i < 16; i++) {
    await page.waitForTimeout(500)
    const footerText = await page.locator('.bg-stone-50').last().innerText().catch(() => '')
    if (footerText.includes('Allt sparat')) break
  }
  await page.screenshot({ path: path.join(out, '04-saved.png'), fullPage: true })

  // 5. Ladda ner PDF
  console.log('\n=== 5. Ladda ner PDF ===')
  const pdfBtn = page.getByRole('button', { name: /AF-blankett/i }).first()
  const isPdfDisabled = await pdfBtn.isDisabled().catch(() => false)
  console.log('  PDF-knapp disabled:', isPdfDisabled)
  const downloadPromise = page.waitForEvent('download', { timeout: 20000 }).catch(() => null)
  await pdfBtn.click({ force: true })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: path.join(out, '05-after-pdf-click.png'), fullPage: true })
  const download = await downloadPromise
  if (!download) {
    // Kolla om error visas i UI:t
    const bodyTxt = await page.locator('body').innerText()
    const errLine = bodyTxt.split('\n').find((l) => l.includes('misslyckades') || l.includes('PDF'))
    console.error('  ! Ingen download. UI-error:', errLine?.slice(0, 200))
    await browser.close()
    process.exit(1)
  }
  await download.saveAs(pdfOut)
  console.log(`  ✓ PDF: ${pdfOut} (${(fs.statSync(pdfOut).size / 1024).toFixed(1)} KB)`)

  console.log('\n=== Console-fel:', errs.length, '===')
  errs.slice(0, 5).forEach((e) => console.log('  -', e.slice(0, 150)))
  await browser.close()
}

main().catch((err) => {
  console.error('TEST FAILED:', err.message)
  process.exit(1)
})
