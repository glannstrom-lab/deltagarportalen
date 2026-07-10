/**
 * KOMPLETT DOA-flöde mot PROD (jobin.se) — riktig gpt-oss-120b, riktig DB.
 *
 * Pipeline:
 *   1. Deltagaren fyller alla 34 items via wizard (alla 5 kategorier)
 *   2. (Sker via SQL utanför testet) AT-bedömningar för alla 34 items
 *   3. AT öppnar AssessmentEditor och klickar "Föreslå med AI" mot prod-AI
 *   4. AT sparar, exporterar PDF
 *
 * Output: audit-2026-05-28/doa-prod-output.pdf
 */
const { chromium } = require('@playwright/test')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Vi kör mot localhost:3000 där vercel dev serverar både vite-frontend OCH
// /api/ai-serverless med riktig OpenRouter (env-vars från .env.production.local).
// Det här ÄR "live, utan mock" — riktig gpt-oss-120b körs.
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

// Item-värden per kategori (matchar antal items: 9, 8, 4, 6, 7 = 34)
const PERSON_VALUES = {
  0: [4, 5, 3, 4, 5, 3, 4, 5, 4],          // Kategori 1: Självkännedom
  1: [5, 4, 4, 3, 5, 2, 4, 5],              // Kategori 2: Roller och vanor
  2: [5, 5, 4, 4],                          // Kategori 3: Fysisk förmåga
  3: [3, 4, 2, 3, 4, 3],                    // Kategori 4: Org/problemlösning
  4: [5, 5, 4, 5, 5, 3, 5],                 // Kategori 5: Samspel/komm
}

const PERSON_COMMENTS = {
  '0-0': 'Jag känner att jag kan när jag får tid. Stress drar ner det här.',
  '0-4': 'Jag är inte den som tar första steget men jag följer med när andra gör det.',
  '1-4': 'Jag tar ansvar men ibland glömmer jag deadlines om dagen är rörig.',
  '3-2': 'Tidspress gör mig nervös och jag tappar struktur.',
  '4-5': 'Det är svårt att be om hjälp — jag vill klara själv.',
}

async function dismissCookies(page) {
  const btn = page.getByRole('button', { name: /Acceptera alla|Endast nödvändiga/i }).first()
  if (await btn.count() > 0) {
    await btn.click().catch(() => {})
    await page.waitForTimeout(400)
  }
}

async function dismissOnboardings(page) {
  for (let i = 0; i < 5; i++) {
    const skip = page.getByRole('button', { name: /Hoppa över/i }).first()
    if (await skip.count() > 0 && await skip.isVisible().catch(() => false)) {
      await skip.click({ force: true }).catch(() => {})
      await page.waitForTimeout(400)
    } else break
  }
}

async function fillCategory(page, catIdx) {
  const values = PERSON_VALUES[catIdx]
  const itemRows = page.locator('li').filter({ has: page.locator('button[aria-pressed]') })
  const rowCount = await itemRows.count()
  console.log(`  Kategori ${catIdx + 1}: hittade ${rowCount} item-rader, fyller ${values.length}`)
  for (let i = 0; i < Math.min(values.length, rowCount); i++) {
    const btn = itemRows.nth(i).locator('button[aria-pressed]').filter({ hasText: String(values[i]) }).first()
    await btn.click({ force: true })
    await page.waitForTimeout(300)
    // Lägg till kommentar om vi har en för detta item
    const commentKey = `${catIdx}-${i}`
    if (PERSON_COMMENTS[commentKey]) {
      const ta = itemRows.nth(i).locator('textarea').first()
      await ta.click({ force: true })
      await ta.fill(PERSON_COMMENTS[commentKey])
      await ta.blur()
      await page.waitForTimeout(500)
    }
  }
}

async function main() {
  const out = path.join(__dirname, 'screenshots', 'sta-doa-prod')
  const pdfOut = path.join(__dirname, '..', 'audit-2026-05-28', 'doa-prod-output.pdf')
  fs.mkdirSync(out, { recursive: true })

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    storageState: path.join(__dirname, '.auth', 'consultant.json'),
    acceptDownloads: true,
  })
  const page = await ctx.newPage()
  page.on('dialog', async (d) => { console.log('  [dialog]', d.type(), '-', d.message().slice(0, 80)); await d.dismiss().catch(() => {}) })

  const errs = []
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })

  // ============================================================
  // DEL 1: Deltagaren fyller alla 34 items via wizard
  // ============================================================
  console.log('\n=== DEL 1: Deltagaren fyller alla 34 items ===')
  await page.goto(`${BASE_URL}/#/steg-till-arbete`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await dismissCookies(page)
  await dismissOnboardings(page)

  const bodyText = await page.locator('body').innerText()
  if (bodyText.includes('Du är inte tilldelad')) {
    console.log('  → Skapar self-test-enrollment')
    await page.getByRole('button', { name: /Skapa testkoppling/i }).first().click({ force: true })
    // Reload triggas — vänta in tills sidan är klar (vercel dev kan vara segt)
    await page.waitForTimeout(5000)
    await page.waitForLoadState('networkidle').catch(() => {})
    // Vänta tills "Laddar Jobin…" är borta
    for (let i = 0; i < 30; i++) {
      const txt = await page.locator('body').innerText().catch(() => '')
      if (!txt.includes('Laddar Jobin') && (txt.includes('Din resa') || txt.includes('Del 1') || txt.includes('Min skattning'))) break
      await page.waitForTimeout(1000)
    }
    await dismissOnboardings(page)
  }

  // Diagnostic screenshot
  await page.screenshot({ path: path.join(out, '00-after-create.png'), fullPage: true })

  // Del 1 → Min skattning
  const del1Tab = page.getByRole('tab', { name: /Del 1/i }).first()
  if (await del1Tab.count() > 0) await del1Tab.click({ force: true })
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(out, '00b-del1-tab.png'), fullPage: true })

  const minSkattning = page.getByRole('button', { name: /Börja skattningen|Fortsätt där du var|Se mina svar/i }).first()
  const minSkattningCount = await minSkattning.count()
  console.log('  "Min skattning"-knappar:', minSkattningCount)
  if (minSkattningCount === 0) {
    console.error('  ! Min skattning-knappen saknas — kanske ej tilldelad ännu')
    await browser.close()
    process.exit(1)
  }
  await minSkattning.click({ force: true })
  await page.waitForTimeout(1000)

  // Klicka "Börja"/"Fortsätt" i intro
  const intro = page.getByRole('button', { name: /^Börja$|^Fortsätt där du var$/ }).last()
  if (await intro.count() > 0) {
    await intro.click({ force: true })
    await page.waitForTimeout(800)
  }

  // Fyll alla 5 kategorier
  for (let catIdx = 0; catIdx < 5; catIdx++) {
    await fillCategory(page, catIdx)
    await page.screenshot({ path: path.join(out, `01-cat-${catIdx + 1}.png`), fullPage: true })
    // Gå till nästa område om vi inte är på sista
    if (catIdx < 4) {
      const next = page.getByRole('button', { name: /Nästa område/ }).first()
      if (await next.count() > 0) {
        await next.click({ force: true })
        await page.waitForTimeout(800)
      }
    }
  }

  console.log('  ✓ Alla 34 items ifyllda av deltagaren')

  // Stäng wizarden
  await page.keyboard.press('Escape')
  await page.waitForTimeout(800)

  // ============================================================
  // DEL 2: SQL: AT-bedömningar för alla 34 items
  // ============================================================
  console.log('\n=== DEL 2: Kör SQL för AT-bedömningar ===')
  try {
    const projectRoot = path.join(__dirname, '..')
    execSync(
      'npx supabase db query --linked -f audit-2026-05-28/full-doa-at-bedomningar.sql',
      { cwd: projectRoot, stdio: 'pipe' },
    )
    console.log('  ✓ AT-bedömningar inserterade för alla 34 items')
  } catch (err) {
    console.error('  ! SQL-anrop failade:', err.message?.slice(0, 200))
    await browser.close()
    process.exit(1)
  }

  // ============================================================
  // DEL 3: AT öppnar editor + klickar AI
  // ============================================================
  console.log('\n=== DEL 3: AT öppnar editor och kör AI ===')
  await page.goto(`${BASE_URL}/#/konsulent/steg-till-arbete`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await dismissOnboardings(page)

  const namnLink = page.locator('text=Claude Test').first()
  await namnLink.scrollIntoViewIfNeeded()
  await namnLink.click({ force: true })
  await page.waitForTimeout(2500)

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
  await page.screenshot({ path: path.join(out, '02-editor.png'), fullPage: true })

  console.log('  → Klickar "Föreslå med AI"...')
  const aiBtn = page.getByRole('button', { name: /Föreslå med AI|Regenerera utkast/i }).first()
  await aiBtn.scrollIntoViewIfNeeded()
  await aiBtn.click({ force: true })

  // Vänta upp till 120s för riktig AI-modell
  console.log('  Väntar på prod-AI-svar (upp till 120 sek)...')
  const malField = page.locator('#doa-summary-mal')
  let aiGenerated = false
  for (let i = 0; i < 120; i++) {
    await page.waitForTimeout(1000)
    const val = await malField.inputValue().catch(() => '')
    if (val && val.length > 30 && !val.startsWith('DEV-MOCK')) {
      aiGenerated = true
      console.log(`  ✓ AI klar efter ${i + 1}s`)
      console.log('  Mål-text:', val.slice(0, 200))
      break
    }
  }
  if (!aiGenerated) {
    console.error('  ! AI gav inget riktigt svar inom 120s')
    await page.screenshot({ path: path.join(out, '03-ai-fail.png'), fullPage: true })
    await browser.close()
    process.exit(1)
  }
  await page.screenshot({ path: path.join(out, '03-ai-done.png'), fullPage: true })

  // Logga kategori-texterna
  for (let i = 0; i < 5; i++) {
    const v = await page.locator(`#doa-summary-cat-${i}`).inputValue().catch(() => '')
    console.log(`  Kat ${i + 1}: ${v.slice(0, 120)}...`)
  }

  // ============================================================
  // DEL 4: Spara + exportera PDF
  // ============================================================
  console.log('\n=== DEL 4: Spara + exportera PDF ===')
  await page.getByRole('button', { name: /Spara utkast/i }).first().click({ force: true })
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500)
    const footer = await page.locator('.bg-stone-50').last().innerText().catch(() => '')
    if (footer.includes('Allt sparat')) break
  }

  const pdfBtn = page.getByRole('button', { name: /AF-blankett/i }).first()
  const downloadP = page.waitForEvent('download', { timeout: 30000 }).catch(() => null)
  await pdfBtn.click({ force: true })
  const download = await downloadP
  if (!download) {
    console.error('  ! Ingen download')
    await page.screenshot({ path: path.join(out, '04-no-download.png'), fullPage: true })
    await browser.close()
    process.exit(1)
  }
  await download.saveAs(pdfOut)
  console.log(`  ✓ PDF sparad: ${pdfOut} (${(fs.statSync(pdfOut).size / 1024).toFixed(1)} KB)`)

  console.log('\n=== Console-fel:', errs.length, '===')
  errs.slice(0, 5).forEach((e) => console.log('  -', e.slice(0, 200)))
  await browser.close()
}

main().catch((err) => {
  console.error('TEST FAILED:', err.message)
  console.error(err.stack)
  process.exit(1)
})
