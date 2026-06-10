/**
 * E2E-test för DOA-självskattningsflödet.
 *
 * Verifierar:
 *   1. Deltagarens DOA-row visas i Del 1 (Min skattning)
 *   2. Wizard öppnas, kategori 1 går att fylla i, värden sparas via RPC
 *   3. Konsultens AssessmentEditor öppnas och visar person-värdena
 *   4. PDF-export-knappen finns och nedladdning fungerar
 *
 * Kräver att login-consultant.cjs körts först (sparar e2e/.auth/consultant.json)
 * eller att .auth/state.json finns.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

async function main() {
  const out = path.join(__dirname, 'screenshots', 'sta-doa-self-flow')
  fs.mkdirSync(out, { recursive: true })

  const consultantState = path.join(__dirname, '.auth', 'consultant.json')
  const fallbackState = path.join(__dirname, '.auth', 'state.json')
  const authPath = fs.existsSync(consultantState)
    ? consultantState
    : fs.existsSync(fallbackState)
      ? fallbackState
      : null
  console.log('auth state:', authPath || 'NONE')
  if (!authPath) {
    console.error('No auth state — run e2e/login-consultant.cjs first')
    process.exit(1)
  }

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    storageState: authPath,
    acceptDownloads: true,
  })
  const page = await ctx.newPage()

  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message))

  // Logga RPC-anrop för felsökning
  const rpcCalls = []
  page.on('request', async (req) => {
    if (req.url().includes('sta_participant_save_doa_score')) {
      const body = req.postData()
      rpcCalls.push(body)
    }
  })

  // -----------------------------------------------------------------
  // 1. Gå till deltagar-vyn
  // -----------------------------------------------------------------
  console.log('\n=== Steg 1: Öppna /steg-till-arbete (deltagar-vyn) ===')
  await page.goto(`${BASE_URL}/#/steg-till-arbete`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  // Dismissa cookies-bannern om den syns (annars blockerar den klick i modaler)
  const cookieAcceptBtn = page.getByRole('button', { name: /Acceptera alla|Endast nödvändiga/i }).first()
  if (await cookieAcceptBtn.count() > 0) {
    await cookieAcceptBtn.click()
    await page.waitForTimeout(400)
  }

  await page.screenshot({ path: path.join(out, '01-initial.png'), fullPage: true })

  const bodyText = await page.locator('body').innerText()
  const hasEmptyState = bodyText.includes('Du är inte tilldelad')
  console.log('  Empty state visible:', hasEmptyState)

  // Skapa self-test-enrollment om vi inte har en aktiv
  if (hasEmptyState) {
    console.log('  → Skapar self-test-enrollment')
    const createBtn = page.getByRole('button', { name: /Skapa testkoppling/i })
    if (await createBtn.count() === 0) {
      console.log('  ! Hittar ingen "Skapa testkoppling"-knapp')
      await page.screenshot({ path: path.join(out, '01b-no-self-test-btn.png'), fullPage: true })
      await browser.close()
      process.exit(1)
    }
    await createBtn.first().click()
    await page.waitForTimeout(3000)
    // SelfTestEnrollmentButton triggar window.location.reload() — vänta in
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(out, '01c-after-self-test.png'), fullPage: true })
  }

  // -----------------------------------------------------------------
  // 2. Gå till Del 1 och hitta "Min skattning"
  // -----------------------------------------------------------------
  console.log('\n=== Steg 2: Öppna Del 1 → Min skattning ===')
  const del1Tab = page.getByRole('tab', { name: /Del 1/i })
  if (await del1Tab.count() > 0) {
    await del1Tab.first().click()
    await page.waitForTimeout(800)
  }
  await page.screenshot({ path: path.join(out, '02-del-1.png'), fullPage: true })

  const minSkattningCard = page.locator('text=Min skattning').first()
  const hasDoaRow = await minSkattningCard.count() > 0
  console.log('  "Min skattning" row visible:', hasDoaRow)
  if (!hasDoaRow) {
    console.log('  ! DOA-raden saknas — kanske ej deployd än, eller deltagaren har ingen Del 1-aktivitet')
    await browser.close()
    process.exit(1)
  }

  const startBtn = page
    .getByRole('button', { name: /Börja skattningen|Fortsätt där du var|Se mina svar/i })
    .first()
  await startBtn.click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(out, '03-doa-intro.png'), fullPage: true })

  // -----------------------------------------------------------------
  // 3. Klicka "Börja" i intro-panelen
  // -----------------------------------------------------------------
  // Modalen renderas SIST i DOM, så .last() matchar modalens version av knappen
  const beginBtn = page.getByRole('button', { name: /^Börja$|^Fortsätt där du var$|^Öppna och se mina svar$/i }).last()
  const beginCount = await beginBtn.count()
  console.log('  Intro-knappar i DOM:', beginCount)
  if (beginCount > 0) {
    await beginBtn.click({ force: true }).catch(async (err) => {
      console.log('  ! Click failed:', err.message.split('\n')[0])
      await page.screenshot({ path: path.join(out, '03b-click-failed.png'), fullPage: true })
    })
    await page.waitForTimeout(800)
  } else {
    console.log('  ! Ingen intro-knapp hittad — modalen kanske inte är öppen')
  }
  await page.screenshot({ path: path.join(out, '04-doa-category-1.png'), fullPage: true })

  // -----------------------------------------------------------------
  // 4. Fyll i några items i första kategorin (9 items totalt)
  // -----------------------------------------------------------------
  console.log('\n=== Steg 3: Fyll i 5 av 9 items i kategori 1 ===')
  // Skala-knapparna har aria-pressed och visar siffran. Räkna förekomst av "1"-knappar.
  const valueButtons = page.locator('button[aria-pressed]').filter({ hasText: /^[1-5]$/ })
  console.log('  Antal skala-knappar:', await valueButtons.count())
  // Klicka på olika värden — varannan 4 och varannan 5
  for (let i = 0; i < 5; i++) {
    const targetValue = (i % 2 === 0 ? 4 : 5)
    // Hitta i:te items första knappen med just det värdet
    const itemRows = page.locator('li').filter({ has: page.locator('button[aria-pressed]') })
    const rowCount = await itemRows.count()
    if (i >= rowCount) break
    const row = itemRows.nth(i)
    const btn = row.locator(`button[aria-pressed]`).filter({ hasText: String(targetValue) }).first()
    await btn.click()
    await page.waitForTimeout(400) // ge RPC tid att svara
  }
  await page.screenshot({ path: path.join(out, '05-doa-filled.png'), fullPage: true })
  console.log('  RPC-anrop:', rpcCalls.length)
  rpcCalls.slice(0, 6).forEach((c, i) => console.log(`    [${i}] ${c?.slice(0, 200)}`))

  // Bekräfta att vi ser "Sparat" och att räkningen ökat
  const headerText = await page.locator('header, [class*="border-b"]').first().innerText().catch(() => '')
  console.log('  Header efter fyllning:', headerText.split('\n').slice(0, 5).join(' | '))

  // -----------------------------------------------------------------
  // 5. Stäng wizarden
  // -----------------------------------------------------------------
  // Stäng modalen — använd Escape istället för Pausa-knappen (undviker overlay-problem)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(out, '06-back-to-del-1.png'), fullPage: true })

  // Bekräfta att progress visas i Del 1-vyn
  const newBodyText = await page.locator('body').innerText()
  const hasProgress = /\d+ av 34 besvarade/.test(newBodyText)
  console.log('  Progress synlig i Del 1-vyn:', hasProgress)

  // -----------------------------------------------------------------
  // 6. Switcha till konsulent-vyn och verifiera att DOA visas
  // -----------------------------------------------------------------
  console.log('\n=== Steg 4: Switcha till konsulent-vyn ===')
  await page.goto(`${BASE_URL}/#/konsulent/steg-till-arbete`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(out, '07-consultant-view.png'), fullPage: true })

  // Klicka deltagarens namn för att öppna drawer
  const namnRow = page.locator('text=DOA Test (self)').first()
  await namnRow.scrollIntoViewIfNeeded()
  await namnRow.click({ force: true })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(out, '08-consultant-drawer.png'), fullPage: true })

  // Drawer = <aside data-domain="action">. Skatta inom drawern bara.
  const drawer = page.locator('aside[data-domain="action"]').first()
  await drawer.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})

  const skattningarTab = drawer.getByRole('button', { name: /^Skattningar$/ })
  const tabCount = await skattningarTab.count()
  console.log('  Skattningar-flik-kandidater i drawer:', tabCount)
  if (tabCount > 0) {
    await skattningarTab.first().click({ force: true })
    await page.waitForTimeout(800)
  }
  await page.screenshot({ path: path.join(out, '09-consultant-assessments.png'), fullPage: true })

  // DOA-raden ska visas i drawerns skattningar-flik
  const doaInDrawer = drawer.locator('text=DOA').first()
  const doaCount = await doaInDrawer.count()
  console.log('  DOA-raden i drawer:', doaCount > 0 ? 'ja' : 'NEJ')

  // Klicka på DOA-raden eller dess Öppna-knapp inom drawer
  const editorOpenBtn = drawer.getByRole('button', { name: /Öppna|Bedöm|Fortsätt/ }).first()
  const editorBtnCount = await editorOpenBtn.count()
  console.log('  Editor-öppna-knappar i drawer:', editorBtnCount)
  if (editorBtnCount > 0) {
    await editorOpenBtn.click({ force: true })
    await page.waitForTimeout(2000)
  }
  await page.screenshot({ path: path.join(out, '10-doa-editor.png'), fullPage: true })

  // Verifiera att deltagar-värden syns ("Deltagarens skattning: 4" i hybrid-stödet)
  const editorBody = await page.locator('body').innerText()
  const showsParticipantValue = /Deltagarens skattning:\s*[45]/.test(editorBody)
  console.log('  Deltagarens skattning visas i editor:', showsParticipantValue)

  // -----------------------------------------------------------------
  // 7. Klicka PDF-knappen
  // -----------------------------------------------------------------
  console.log('\n=== Steg 5: Ladda ner DOA-PDF ===')
  const pdfBtn = page.getByRole('button', { name: /AF-blankett|PDF/i }).first()
  if (await pdfBtn.count() === 0) {
    console.log('  ! Ingen PDF-knapp synlig')
  } else {
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null)
    await pdfBtn.click()
    const download = await downloadPromise
    if (download) {
      const savePath = path.join(out, await download.suggestedFilename())
      await download.saveAs(savePath)
      const stat = fs.statSync(savePath)
      console.log('  PDF nedladdad:', savePath, `(${stat.size} bytes)`)
    } else {
      console.log('  ! PDF-nedladdning timeout — kanske disabled pga osparade ändringar')
    }
  }

  // -----------------------------------------------------------------
  // Sammanfattning
  // -----------------------------------------------------------------
  console.log('\n=== Console-fel under körningen ===')
  console.log('  Total:', consoleErrors.length)
  consoleErrors.slice(0, 8).forEach((e) => console.log('  - ' + e.slice(0, 200)))

  await browser.close()
  console.log('\nScreenshots i:', out)
}

main().catch((err) => {
  console.error('TEST FAILED:', err.message)
  console.error(err.stack)
  process.exit(1)
})
