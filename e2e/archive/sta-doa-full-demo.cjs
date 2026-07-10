/**
 * DOA — komplett demo-flöde som producerar en rik PDF för manuell genomgång.
 *
 * Sekvens:
 *  1. Konsulent skapar self-test-enrollment via SelfTestEnrollmentButton
 *  2. Som deltagare: fyll hela kategori 1 (9 items) + 3 items i kategori 2 + en kommentar
 *  3. Som AT: öppna AssessmentEditor, fyll bedömar-kolumn för 4 items
 *  4. Exportera PDF
 *  5. Spara på audit-2026-05-28/doa-demo-output.pdf för granskning
 *
 * Output:
 *   - audit-2026-05-28/doa-demo-output.pdf   (slutgiltig PDF)
 *   - e2e/screenshots/sta-doa-demo/*.png     (steg-för-steg)
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

async function dismissCookies(page) {
  const btn = page.getByRole('button', { name: /Acceptera alla|Endast nödvändiga/i }).first()
  if (await btn.count() > 0) {
    await btn.click().catch(() => {})
    await page.waitForTimeout(300)
  }
}

async function dismissOnboardings(page) {
  // Profil-onboarding ("Välkommen!" / "Hoppa över") visas första gången
  for (let i = 0; i < 3; i++) {
    const skipBtn = page.getByRole('button', { name: /Hoppa över|Stäng|Senare/i }).first()
    if (await skipBtn.count() > 0 && await skipBtn.isVisible().catch(() => false)) {
      await skipBtn.click({ force: true }).catch(() => {})
      await page.waitForTimeout(500)
    } else {
      break
    }
  }
}

async function main() {
  const out = path.join(__dirname, 'screenshots', 'sta-doa-demo')
  const pdfOut = path.join(__dirname, '..', 'audit-2026-05-28', 'doa-demo-output.pdf')
  fs.mkdirSync(out, { recursive: true })
  fs.mkdirSync(path.dirname(pdfOut), { recursive: true })

  const authPath = path.join(__dirname, '.auth', 'consultant.json')
  if (!fs.existsSync(authPath)) {
    console.error('Run e2e/login-consultant.cjs first')
    process.exit(1)
  }

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 1100 }, // tillräckligt brett så Mina samlingar-FAB inte överlappar tabellraderna
    storageState: authPath,
    acceptDownloads: true,
  })
  const page = await ctx.newPage()

  const errs = []
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })

  // ============================================================
  // 1. Konsulent: skapa self-test-enrollment
  // ============================================================
  console.log('\n=== Steg 1: Konsulent skapar self-test-enrollment ===')
  await page.goto(`${BASE_URL}/#/steg-till-arbete`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await dismissCookies(page)
  await page.screenshot({ path: path.join(out, '01-empty.png'), fullPage: true })

  const createBtn = page.getByRole('button', { name: /Skapa testkoppling/i }).first()
  if (await createBtn.count() === 0) {
    console.error('  ! "Skapa testkoppling"-knappen saknas — abort')
    await browser.close()
    process.exit(1)
  }
  await createBtn.click({ force: true })
  console.log('  → väntar in self-test-creation')
  await page.waitForTimeout(3000)
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(out, '02-after-create.png'), fullPage: true })

  // ============================================================
  // 2. Deltagare: öppna Del 1 → Min skattning
  // ============================================================
  console.log('\n=== Steg 2: Öppna DOA-wizarden ===')
  const del1Tab = page.getByRole('tab', { name: /Del 1/i }).first()
  if (await del1Tab.count() > 0) await del1Tab.click({ force: true })
  await page.waitForTimeout(800)

  const startBtn = page
    .getByRole('button', { name: /Börja skattningen|Fortsätt där du var|Se mina svar/i })
    .first()
  await startBtn.click({ force: true })
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(out, '03-doa-intro.png'), fullPage: true })

  // Klicka Börja i intro (sista button.match — i modalen)
  const beginBtn = page
    .getByRole('button', { name: /^Börja$|^Fortsätt där du var$/ })
    .last()
  await beginBtn.click({ force: true })
  await page.waitForTimeout(800)

  // ============================================================
  // 3. Fyll hela kategori 1 (9 items)
  // ============================================================
  console.log('\n=== Steg 3: Fyll hela kategori 1 (9 items) ===')
  // För realism: blandning av 3-5 + en kommentar på ett item
  const cat1Values = [4, 5, 3, 4, 5, 3, 4, 5, 4]
  const itemRows = page.locator('li').filter({ has: page.locator('button[aria-pressed]') })
  let rowCount = await itemRows.count()
  console.log('  Item-rader:', rowCount)
  for (let i = 0; i < Math.min(cat1Values.length, rowCount); i++) {
    const v = cat1Values[i]
    const btn = itemRows.nth(i).locator(`button[aria-pressed]`).filter({ hasText: String(v) }).first()
    await btn.click({ force: true })
    await page.waitForTimeout(250)
  }

  // Lägg till en kommentar på item 1 (självkännedom — "Jag kan utföra de uppgifter jag vill utföra")
  const firstComment = itemRows.nth(0).locator('textarea').first()
  await firstComment.click({ force: true })
  await firstComment.fill(
    'Jag känner att jag kan om jag får tid. Stressade situationer drar ner det här.',
  )
  await firstComment.blur()
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(out, '04-cat1-done.png'), fullPage: true })

  // ============================================================
  // 4. Nästa kategori — fyll 4 av 8 items
  // ============================================================
  console.log('\n=== Steg 4: Gå till kategori 2 (Roller och vanor) ===')
  const nextBtn = page.getByRole('button', { name: /Nästa område/ }).first()
  await nextBtn.click({ force: true })
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(out, '05-cat2-empty.png'), fullPage: true })

  const cat2Values = [5, 4, 4, 3] // bara första 4 av 8 items
  rowCount = await itemRows.count()
  for (let i = 0; i < Math.min(cat2Values.length, rowCount); i++) {
    const v = cat2Values[i]
    const btn = itemRows.nth(i).locator('button[aria-pressed]').filter({ hasText: String(v) }).first()
    await btn.click({ force: true })
    await page.waitForTimeout(250)
  }

  // Kommentar på rad 2 i kategori 2
  const cat2Comment = itemRows.nth(1).locator('textarea').first()
  await cat2Comment.click({ force: true })
  await cat2Comment.fill('Jag försöker, men kan tappa fokus mot slutet av dagen.')
  await cat2Comment.blur()
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(out, '06-cat2-partial.png'), fullPage: true })

  // ============================================================
  // 5. Stäng wizarden (ESC)
  // ============================================================
  console.log('\n=== Steg 5: Stäng wizarden ===')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(out, '07-back-to-del-1.png'), fullPage: true })

  // ============================================================
  // 6. Switcha till konsulent-vyn
  // ============================================================
  console.log('\n=== Steg 6: Konsulent-vy — öppna deltagaren ===')
  await page.goto(`${BASE_URL}/#/konsulent/steg-till-arbete`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await dismissOnboardings(page)
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(out, '08-consultant-overview.png'), fullPage: true })

  // Akuta deadlines-buttonen är text-baserad. Klicka via text-locator (samma
  // pattern som fungerade i sta-doa-self-flow.cjs). .first() picks topmost.
  const namnLink = page.locator('text=Claude Test').first()
  await namnLink.scrollIntoViewIfNeeded()
  await namnLink.click({ force: true })
  await page.waitForTimeout(2000)
  await dismissOnboardings(page)
  await page.screenshot({ path: path.join(out, '09-drawer-open.png'), fullPage: true })

  // Drawer öppen — gå till Skattningar
  const drawer = page.locator('aside[data-domain="action"]').first()
  await drawer.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
  await drawer.getByRole('button', { name: /^Skattningar$/ }).first().click({ force: true })
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(out, '10-drawer-skattningar.png'), fullPage: true })

  // Öppna DOA-skattningen
  await drawer.getByRole('button', { name: /Öppna|Bedöm|Fortsätt/ }).first().click({ force: true })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(out, '11-editor-at-mode.png'), fullPage: true })

  // ============================================================
  // 7. AT-bedömning: fyll bedömar-kolumn för 4 items
  // ============================================================
  console.log('\n=== Steg 7: AT fyller bedömar-kolumn ===')
  // AssessmentEditor öppnas i 'at'-mode default. Värdena vi sätter blir
  // bedomare-fältet (deltagar-värdet bevaras).
  // Fyll items 1-4 med värden som är något olika från deltagarens (för kontrast)
  const editorItems = page.locator('li').filter({ has: page.locator('button[aria-pressed]') })
  const editorCount = await editorItems.count()
  console.log('  Editor items:', editorCount)
  const atValues = [3, 4, 4, 5] // jämför med deltagarens 4, 5, 3, 4 — visar variation
  for (let i = 0; i < Math.min(atValues.length, editorCount); i++) {
    const v = atValues[i]
    const btn = editorItems.nth(i).locator('button[aria-pressed]').filter({ hasText: String(v) }).first()
    await btn.click({ force: true })
    await page.waitForTimeout(250)
  }
  await page.screenshot({ path: path.join(out, '12-at-filled.png'), fullPage: true })

  // Lägg till en sammanfattande kommentar
  const summaryTextarea = page.locator('textarea[id="assessment-summary"]')
  if (await summaryTextarea.count() > 0) {
    await summaryTextarea.click({ force: true })
    await summaryTextarea.fill(
      'Deltagaren skattar generellt sin förmåga något högre än min observation. Vi planerar att diskutera detta vid nästa kartläggningssamtal — särskilt frågorna kring självständighet och samarbete.',
    )
    await summaryTextarea.blur()
    await page.waitForTimeout(500)
  }

  // Spara utkast
  const spara = page.getByRole('button', { name: /Spara utkast/i }).first()
  if (await spara.count() > 0) {
    await spara.click({ force: true })
    await page.waitForTimeout(1500)
    console.log('  → Sparat AT-utkast')
  }
  await page.screenshot({ path: path.join(out, '13-after-save.png'), fullPage: true })

  // ============================================================
  // 8. Exportera PDF
  // ============================================================
  console.log('\n=== Steg 8: Exportera DOA-PDF ===')
  const pdfBtn = page.getByRole('button', { name: /AF-blankett/i }).first()
  if (await pdfBtn.count() === 0) {
    console.error('  ! Ingen PDF-knapp')
    await browser.close()
    process.exit(1)
  }
  const downloadPromise = page.waitForEvent('download', { timeout: 15000 })
  await pdfBtn.click({ force: true })
  const download = await downloadPromise
  await download.saveAs(pdfOut)
  const size = fs.statSync(pdfOut).size
  console.log(`  ✓ PDF sparad: ${pdfOut} (${(size / 1024).toFixed(1)} KB)`)

  // ============================================================
  // Sammanfattning
  // ============================================================
  console.log('\n=== Console-fel ===')
  console.log('  Total:', errs.length)
  errs.slice(0, 5).forEach((e) => console.log('  -', e.slice(0, 150)))

  await browser.close()
  console.log('\nScreenshots:', out)
  console.log('PDF:', pdfOut)
}

main().catch((err) => {
  console.error('TEST FAILED:', err.message)
  console.error(err.stack)
  process.exit(1)
})
