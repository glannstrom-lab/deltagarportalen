/**
 * Lokal verifiering av konsulentportalens nya funktioner (2026-06-11):
 *  1. Min dag-sektionen på översikten
 *  2. Gruppmeddelande-dialogen (snabbåtgärd)
 *  3. Mall→deltagare (Använd för deltagare → deltagarväljare)
 *  4. Jobbsamlingar: skapa → kort → ta bort
 *  5. Analytics: Riskerar att fastna + Insatseffekt
 *  6. Settings: export-knapp laddar ner JSON, åtkomstlogg borta
 *  7. Deltagardetalj: Rapportutkast (AI)-dialogen öppnas
 *
 * Kör mot lokal dev-server: E2E_BASE_URL=http://localhost:3001
 * Creds: E2E_CONS_EMAIL / E2E_CONS_PASSWORD (läses ur .env.test.local av runnern)
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

// Läs .env.test.local
const envFile = path.join(__dirname, '..', '.env.test.local')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_0-9]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

const EMAIL = process.env.E2E_CONS_EMAIL
const PASSWORD = process.env.E2E_CONS_PASSWORD
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3001'
const OUT = path.join(__dirname, '..', 'audit-2026-06-11', 'consultant-features')

if (!EMAIL || !PASSWORD) {
  console.error('Sätt E2E_CONS_EMAIL och E2E_CONS_PASSWORD (via .env.test.local).')
  process.exit(2)
}

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const snap = (name) => page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true })

  try {
    // Login
    await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' })
    await page.fill('input#email', EMAIL)
    await page.fill('input#password', PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 30000 })
    check('Inloggning som konsulent', true)

    // Acceptera cookie-bannern så den inte blockerar klick
    await page.waitForTimeout(1500)
    for (const label of ['Godkänn alla', 'Acceptera alla', 'Godkänn', 'Acceptera', 'OK']) {
      const btn = page.getByRole('button', { name: label }).first()
      if (await btn.isVisible().catch(() => false)) { await btn.click(); break }
    }
    await page.waitForTimeout(500)

    // 1. Översikt: Min dag
    await page.goto(`${BASE_URL}/#/consultant`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)
    const minDag = page.getByText('Min dag', { exact: false }).first()
    check('Min dag-sektionen syns', await minDag.isVisible().catch(() => false))
    await snap('01-oversikt-min-dag')

    // 2. Gruppmeddelande-dialogen
    await page.getByRole('button', { name: 'Skicka gruppmeddelande' }).click()
    await page.waitForTimeout(1500)
    const dialogTitle = page.getByRole('heading', { name: 'Skicka meddelande' })
    const dialogVisible = await dialogTitle.isVisible().catch(() => false)
    check('Gruppmeddelande-dialog öppnas', dialogVisible)
    if (dialogVisible) {
      const hasRecipients = await page.getByText('Välj alla').isVisible().catch(() => false)
      check('Mottagarlista med Välj alla', hasRecipients)
      await snap('02-gruppmeddelande-dialog')
      await page.getByRole('button', { name: 'Avbryt' }).click()
      await page.waitForTimeout(500)
    }

    // 3. Resurser: mall → deltagare
    await page.goto(`${BASE_URL}/#/consultant/resources`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // Skapa en mall om listan är tom (DB har 0 mallar) — testar samtidigt skapandeflödet
    let createdTemplate = false
    if (!(await page.getByRole('button', { name: 'Använd', exact: true }).first().isVisible().catch(() => false))) {
      await page.getByRole('button', { name: 'Skapa mall' }).click()
      await page.waitForTimeout(800)
      await page.locator('input[placeholder^="T.ex. Förbättra CV"]').fill('E2E-mall: Sök 5 jobb per vecka')
      await page.locator('textarea[placeholder="Kort beskrivning av mallen"]').fill('Testmall skapad av e2e-verifieringen.')
      await page.getByRole('button', { name: 'Skapa ny mall' }).click()
      await page.waitForTimeout(2000)
      createdTemplate = await page.getByText('E2E-mall: Sök 5 jobb per vecka').first().isVisible().catch(() => false)
      check('Mall kan skapas', createdTemplate)
    }

    const useBtn = page.getByRole('button', { name: 'Använd', exact: true }).first()
    if (await useBtn.isVisible().catch(() => false)) {
      await useBtn.click()
      await page.waitForTimeout(800)
      await page.getByRole('button', { name: 'Använd för deltagare' }).click()
      await page.waitForTimeout(1200)
      const goalDialog = await page.getByRole('heading', { name: 'Skapa mål' }).isVisible().catch(() => false)
      const participantStep = await page.getByText('Välj deltagare').isVisible().catch(() => false)
      check('Mall→deltagare öppnar måldialog med deltagarväljare', goalDialog && participantStep)
      await snap('03-mall-till-deltagare')
      // Välj första deltagaren → ska hoppa direkt till anpassa-steget med förifyllt mål
      const firstParticipant = page.locator('input[placeholder="Sök deltagare..."]')
      if (await firstParticipant.isVisible().catch(() => false)) {
        const pBtn = page.locator('div.space-y-2 button').first()
        if (await pBtn.isVisible().catch(() => false)) {
          await pBtn.click()
          await page.waitForTimeout(800)
          const titleInput = page.locator('input[placeholder="Vad ska uppnås?"]')
          const prefilled = await titleInput.inputValue().catch(() => '')
          check('Målet förifyllt från mallen', prefilled.length > 3, `titel: "${prefilled}"`)
          await snap('04-mall-forifylld')
        }
      }
      // Stäng utan att spara
      await page.keyboard.press('Escape')
      const cancelBtn = page.getByRole('button', { name: 'Avbryt' }).last()
      if (await cancelBtn.isVisible().catch(() => false)) await cancelBtn.click()
      await page.waitForTimeout(500)
    } else {
      check('Mall→deltagare öppnar måldialog med deltagarväljare', false, 'Ingen mall hittades')
    }

    // 4. Jobbsamlingar CRUD
    await page.getByRole('button', { name: 'Jobbsamlingar' }).click()
    await page.waitForTimeout(1500)
    await page.getByRole('button', { name: 'Ny samling' }).first().click()
    await page.waitForTimeout(800)
    const collDialog = await page.getByRole('heading', { name: 'Ny jobbsamling' }).isVisible().catch(() => false)
    check('Ny samling-dialog öppnas', collDialog)
    if (collDialog) {
      await page.fill('input#collection-name', 'E2E-test: Lagerjobb Göteborg')
      await page.fill('input#collection-industry', 'Lager & logistik')
      await page.locator('input[placeholder^="Jobbtitel"]').first().fill('Lagermedarbetare — Testbolaget AB')
      await page.locator('input[placeholder^="Länk till annonsen"]').first().fill('https://example.com/jobb/123')
      await snap('05-ny-samling-dialog')
      await page.getByRole('button', { name: 'Skapa samling' }).click()
      await page.waitForTimeout(2000)
      const cardVisible = await page.getByText('E2E-test: Lagerjobb Göteborg').first().isVisible().catch(() => false)
      check('Samlingen sparas och visas som kort', cardVisible)
      await snap('06-samling-skapad')

      if (cardVisible) {
        // Ta bort samlingen (städning)
        page.once('dialog', d => d.accept())
        await page.getByLabel('Åtgärder för samling').first().click()
        await page.waitForTimeout(400)
        await page.getByRole('button', { name: 'Ta bort' }).click()
        await page.waitForTimeout(1500)
        const stillThere = await page.getByText('E2E-test: Lagerjobb Göteborg').first().isVisible().catch(() => false)
        check('Samlingen kan tas bort', !stillThere)
      }
    }

    // 5. Analytics: fastnat + insatseffekt
    await page.goto(`${BASE_URL}/#/consultant/analytics`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)
    const stuckCard = await page.getByText('Riskerar att fastna').first().isVisible().catch(() => false)
    const effectCard = await page.getByText('Insatseffekt').first().isVisible().catch(() => false)
    check('Riskerar att fastna-kortet renderas', stuckCard)
    check('Insatseffekt-kortet renderas', effectCard)
    await snap('07-analytics-stuck-effekt')

    // 6. Settings: export + ingen åtkomstlogg
    await page.goto(`${BASE_URL}/#/consultant/settings`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
    const accessLogGone = !(await page.getByText('Se åtkomstlogg').isVisible().catch(() => false))
    check('Åtkomstlogg-knappen borttagen', accessLogGone)
    const downloadPromise = page.waitForEvent('download', { timeout: 20000 }).catch(() => null)
    await page.getByRole('button', { name: 'Exportera all data' }).click()
    const download = await downloadPromise
    check('Export laddar ner JSON-fil', !!download, download ? download.suggestedFilename() : 'ingen nedladdning')
    await snap('08-settings-privacy')

    // 7. Deltagardetalj: rapportutkast-dialog
    await page.goto(`${BASE_URL}/#/consultant/participants`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)
    let profileLink = page.locator('a[href*="consultant/participants/"]').first()
    if (!(await profileLink.isVisible().catch(() => false))) {
      profileLink = page.getByText('Visa profil').first()
    }
    if (await profileLink.isVisible().catch(() => false)) {
      await profileLink.click()
      await page.waitForTimeout(2500)
      await page.getByRole('button', { name: 'Dagbok' }).click()
      await page.waitForTimeout(1000)
      const draftBtn = page.getByRole('button', { name: 'Rapportutkast (AI)' })
      const draftBtnVisible = await draftBtn.isVisible().catch(() => false)
      check('Rapportutkast (AI)-knappen syns i journalen', draftBtnVisible)
      if (draftBtnVisible) {
        await draftBtn.click()
        await page.waitForTimeout(800)
        const draftDialog = await page.getByRole('heading', { name: 'Rapportutkast från journalen' }).isVisible().catch(() => false)
        check('Rapportutkast-dialogen öppnas', draftDialog)
        await snap('09-rapportutkast-dialog')
      }
    } else {
      check('Rapportutkast (AI)-knappen syns i journalen', false, 'Ingen deltagare i listan')
    }
  } catch (err) {
    console.error('SCRIPT ERROR:', err.message)
    await snap('99-error')
  } finally {
    await browser.close()
  }

  const failed = results.filter(r => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} kontroller passerade`)
  process.exit(failed.length > 0 ? 1 : 0)
})()
