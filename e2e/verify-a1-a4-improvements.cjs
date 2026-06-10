/**
 * Verifierar A1-A4 visuellt: tomtillstånd (A4), insiktskort + sparkline (A1+A3),
 * och övergångsskärm (A2) genom att simulera en deltagare med data + Del 1 klar.
 */
const { chromium } = require('@playwright/test')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const BASE_URL = 'http://localhost:3000'

async function dismissCookies(page) {
  const btn = page.getByRole('button', { name: /Acceptera alla/i }).first()
  if (await btn.count() > 0) { await btn.click().catch(() => {}); await page.waitForTimeout(400) }
}

async function dismissOnboardings(page) {
  for (let i = 0; i < 3; i++) {
    const skip = page.getByRole('button', { name: /Hoppa över/i }).first()
    if (await skip.count() > 0 && await skip.isVisible().catch(() => false)) {
      await skip.click({ force: true }).catch(() => {})
      await page.waitForTimeout(400)
    } else break
  }
}

async function main() {
  const out = path.join(__dirname, 'screenshots', 'sta-a1-a4')
  fs.mkdirSync(out, { recursive: true })

  // ============================================================
  // A4: Tomtillstånd — rensa enrollment och visa empty state
  // ============================================================
  console.log('=== A4: Empty state ===')
  execSync('npx supabase db query --linked -f audit-2026-05-28/clean-enrollment.sql', {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
  })
  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 1200 },
    storageState: path.join(__dirname, '.auth', 'consultant.json'),
  })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message))
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERROR:', m.text().slice(0, 200)) })

  await page.goto(`${BASE_URL}/#/steg-till-arbete`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await dismissCookies(page)
  await dismissOnboardings(page)
  await page.screenshot({ path: path.join(out, 'A4-empty-state.png'), fullPage: true })
  const emptyBody = await page.locator('body').innerText()
  console.log('  Tomtillstånd har "kommer du se":', emptyBody.toLowerCase().includes('kommer du se'))
  console.log('  Tomtillstånd har "veckoplan":', emptyBody.includes('veckoplan'))
  console.log('  Tomtillstånd har "fokusyrke":', emptyBody.toLowerCase().includes('fokusyrke'))

  // ============================================================
  // A1 + A3: Skapa enrollment + lägga in mock-data (pulse, notes)
  // sen ta screenshot av Översikt
  // ============================================================
  console.log('\n=== A1 + A3: Översikt med data ===')
  // Skapa enrollment via UI
  await page.getByRole('button', { name: /Skapa testkoppling/i }).first().click({ force: true })
  await page.waitForTimeout(4000)
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(1500)
  await dismissOnboardings(page)

  // Lägg in 14 dagars pulse + några quick notes via SQL (filen finns separat)
  console.log('  → Lägger in mockdata för översikten')
  execSync('npx supabase db query --linked -f audit-2026-05-28/seed-overview-data.sql', {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
  })

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await dismissOnboardings(page)
  await page.screenshot({ path: path.join(out, 'A1-A3-oversikt.png'), fullPage: true })
  const ovBody = await page.locator('body').innerText()
  console.log('  Översikt har "Din profil växer fram":', ovBody.includes('Din profil växer fram'))
  console.log('  Översikt har "Din energi senaste":', ovBody.includes('Din energi senaste'))
  console.log('  Översikt har "Styrkor som syns":', ovBody.includes('Styrkor som syns'))
  console.log('  Översikt har fokusyrke "Lagerarbetare":', ovBody.includes('Lagerarbetare'))

  // ============================================================
  // A2: Övergångsskärm — sätt started_at till 25 vardagar bak så Del 1 är klar
  // ============================================================
  console.log('\n=== A2: Övergångsskärm Del 1 → Del 2 ===')
  // started_at = 30 dagar bak (deriveCurrentPart säger Del 2)
  // part_started_at = idag (deltagaren nyss avancerade — triggar övergångsskärm)
  fs.writeFileSync(
    path.join(__dirname, '..', 'audit-2026-05-28', 'force-del1-done.sql'),
    `UPDATE sta_enrollments SET
  started_at = CURRENT_DATE - INTERVAL '30 days',
  part_started_at = CURRENT_DATE,
  current_part = 2
WHERE participant_id = '43dc2019-a6a8-4110-82b6-df90107577d5'::uuid
RETURNING id, started_at, part_started_at, current_part;`,
  )
  execSync('npx supabase db query --linked -f audit-2026-05-28/force-del1-done.sql', {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
  })

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await dismissOnboardings(page)
  await page.screenshot({ path: path.join(out, 'A2-transition.png'), fullPage: true })
  const transBody = await page.locator('body').innerText()
  console.log('  Har "Du är klar med Del":', transBody.includes('Du är klar med Del'))
  console.log('  Har "Det här tar du med dig":', transBody.includes('Det här tar du med dig'))
  console.log('  Har "Härnäst":', transBody.includes('Härnäst'))

  await browser.close()
  console.log('\nScreenshots: ' + out)
}

main().catch((err) => {
  console.error('TEST FAILED:', err.message)
  process.exit(1)
})
