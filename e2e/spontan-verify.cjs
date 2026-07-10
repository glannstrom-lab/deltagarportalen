/**
 * Verifiering av Spontanansökan-flödena mot prod (jobin.se).
 * Kör hela granskningens punkt 1-20-funktioner med testkontot:
 * sök/spara via Bolagsverket, batchstatus, uppföljning, kontaktperson,
 * prioritet, nästa steg, brevkoppling, statistik, widget, fokusutkast,
 * mobilfilter, ConfirmDialog-borttagning + cleanup.
 *
 *   node e2e/spontan-verify.cjs
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const BASE = process.env.BASE_URL || 'https://www.jobin.se'
const STATE = path.join(__dirname, '.auth', 'spontan-prod.json')
const SHOTS = path.join(__dirname, 'screenshots', 'spontan-verify')
const ORG_NR = '5560747551' // exempelnumret från appens egen placeholder

const results = []
function pass(name) { results.push(['PASS', name]); console.log('  PASS', name) }
function fail(name, err) { results.push(['FAIL', `${name} — ${err}`]); console.log('  FAIL', name, '—', err) }
function skip(name, why) { results.push(['SKIP', `${name} — ${why}`]); console.log('  SKIP', name, '—', why) }

async function check(name, fn) {
  try { await fn(); pass(name) } catch (e) { fail(name, String(e).split('\n')[0]) }
}

function loadEnv() {
  const env = {}
  for (const line of fs.readFileSync(path.join(ROOT, '.env.test.local'), 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

async function dismissCookies(page) {
  try {
    const btn = page.getByRole('button', { name: /endast nödvändiga|acceptera/i }).first()
    if (await btn.isVisible({ timeout: 2000 })) { await btn.click(); await page.waitForTimeout(300) }
  } catch { /* ingen banner */ }
}

async function ensureLoggedIn(page, context, env) {
  await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await dismissCookies(page)
  const landing = await page.getByRole('heading', { name: /stärk dina deltagare/i }).count()
  if (landing === 0) return
  console.log('Loggar in...')
  await page.goto(`${BASE}/#/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  await dismissCookies(page)
  await page.locator('input#email').fill(env.TEST_USER_EMAIL)
  await page.locator('input#password').fill(env.TEST_USER_PASSWORD)
  await page.getByRole('button', { name: /^logga in$/i }).click()
  await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 30000 })
  await page.waitForTimeout(1500)
  await context.storageState({ path: STATE })
  console.log('Inloggad, session cachad')
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false })
}

async function openCardMenu(page) {
  await page.getByRole('button', { name: 'Åtgärder för företag' }).first().click()
  await page.waitForTimeout(300)
}

async function main() {
  fs.mkdirSync(path.dirname(STATE), { recursive: true })
  fs.mkdirSync(SHOTS, { recursive: true })
  const env = loadEnv()

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: fs.existsSync(STATE) ? STATE : undefined,
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))

  await ensureLoggedIn(page, context, env)

  // ---------- 1. Sök-fliken ----------
  console.log('\n[1] Sök-fliken')
  await page.goto(`${BASE}/#/spontanansökan`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  await dismissCookies(page)
  await shot(page, '01-sok-flik')

  await check('AI-läge förvalt med aria-pressed', async () => {
    const btn = page.getByRole('button', { name: /AI-sökning/ })
    if (await btn.getAttribute('aria-pressed') !== 'true') throw new Error('aria-pressed != true')
  })
  await check('Ortfält synligt i AI-läge (P12)', async () => {
    await page.getByLabel('Ort (valfritt)').waitFor({ state: 'visible', timeout: 5000 })
  })

  await page.getByRole('button', { name: /Org\.nummer/ }).click()
  await page.waitForTimeout(300)
  await check('Lägesbyte till org.nr: aria-pressed växlar (P15)', async () => {
    const btn = page.getByRole('button', { name: /Org\.nummer/ })
    if (await btn.getAttribute('aria-pressed') !== 'true') throw new Error('aria-pressed != true')
  })
  await check('Ortfält dolt i org.nr-läge', async () => {
    if (await page.getByLabel('Ort (valfritt)').count() !== 0) throw new Error('ortfält kvar')
  })

  // ---------- 2. Spara företag via Bolagsverket ----------
  console.log('\n[2] Org.nr-sökning + spara')
  let companyName = null
  await check('Bolagsverket-sökning ger resultatkort', async () => {
    await page.locator('input[placeholder*="Organisationsnummer"]').fill(ORG_NR)
    await page.getByRole('button', { name: /^Sök$/ }).click()
    const h3 = page.locator('h3').filter({ hasNotText: /Tips/ }).first()
    await h3.waitFor({ state: 'visible', timeout: 30000 })
    companyName = (await h3.textContent()).trim()
    if (!companyName) throw new Error('inget företagsnamn')
    console.log('    Företag:', companyName)
  })
  await shot(page, '02-sokresultat')

  await check('Spara företag + toast', async () => {
    await page.getByRole('button', { name: /Spara företag/ }).click()
    await page.getByText(/har sparats/).first().waitFor({ state: 'visible', timeout: 15000 })
  })

  // ---------- 3. Mina företag ----------
  console.log('\n[3] Mina företag')
  await page.goto(`${BASE}/#/spontanansökan/mina-foretag`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  const totalCards = await page.getByRole('button', { name: 'Åtgärder för företag' }).count()
  const preexisting = Math.max(0, totalCards - 1)
  console.log(`    ${totalCards} kort totalt (${preexisting} fanns sedan innan)`)
  await shot(page, '03-mina-foretag')

  const searchWord = companyName.split(/\s+/)[0]
  await check('Textsökning isolerar kortet (P10)', async () => {
    await page.getByLabel('Sök på namn, ort eller bransch...').fill(searchWord)
    await page.waitForTimeout(500)
    const visible = await page.getByRole('button', { name: 'Åtgärder för företag' }).count()
    if (visible < 1) throw new Error('kortet försvann')
    const nameVisible = await page.locator('h3').filter({ hasText: companyName }).count()
    if (nameVisible !== 1) throw new Error(`förväntade 1 kort, fick ${nameVisible}`)
  })

  await check('Sorteringsval finns (P10)', async () => {
    const sel = page.locator('#spontaneous-sort')
    await sel.waitFor({ state: 'visible', timeout: 3000 })
    await sel.selectOption('name')
    await sel.selectOption('newest')
  })

  // Batchläge → status Kontaktad (verifierar även auto-outreach_date, P2)
  await check('Batchläge: välj + ändra status i klump (P18)', async () => {
    await page.getByRole('button', { name: /Välj flera/ }).click()
    await page.getByLabel(`Välj ${companyName}`).check()
    await page.getByRole('button', { name: /Ändra status till/ }).click()
    await page.getByRole('button', { name: /^Kontaktad$/ }).click()
    await page.getByText(/företag ändrade till/).first().waitFor({ state: 'visible', timeout: 15000 })
  })
  await page.waitForTimeout(800)
  await page.getByLabel('Sök på namn, ort eller bransch...').fill(searchWord)
  await page.waitForTimeout(500)

  await check('outreach_date stämplades vid Kontaktad (P2)', async () => {
    await page.getByText(/^Kontaktad: \d/).first().waitFor({ state: 'visible', timeout: 5000 })
  })

  await check('Uppföljningsförslag + Om 1 vecka (P1)', async () => {
    await page.getByText('Vill du planera en uppföljning?').waitFor({ state: 'visible', timeout: 5000 })
    await page.getByRole('button', { name: 'Om 1 vecka' }).click()
    await page.getByText(/^Uppföljning: \d/).first().waitFor({ state: 'visible', timeout: 15000 })
  })
  await shot(page, '04-kontaktad-uppfoljning')

  await check('Kontaktperson kan läggas till (P3)', async () => {
    await page.getByRole('button', { name: 'Lägg till kontaktperson' }).click()
    await page.getByLabel('Namn', { exact: true }).fill('Anna Testsson')
    await page.getByLabel('E-post', { exact: true }).fill('anna.testsson@example.com')
    await page.getByRole('button', { name: /^Spara$/ }).click()
    await page.getByText('Anna Testsson').waitFor({ state: 'visible', timeout: 15000 })
    const mailto = await page.locator('a[href^="mailto:"]').count()
    if (mailto < 1) throw new Error('ingen mailto-länk')
  })

  await check('Hög prioritet via menyn (P11)', async () => {
    await openCardMenu(page)
    await page.getByRole('button', { name: 'Markera som hög prioritet' }).click()
    await page.getByText('Hög prioritet').first().waitFor({ state: 'visible', timeout: 15000 })
  })

  await check('Positivt svar visar nästa steg (P8)', async () => {
    await openCardMenu(page)
    await page.getByRole('button', { name: /^Positivt svar$/ }).click()
    await page.getByText(/Grattis till svaret/).waitFor({ state: 'visible', timeout: 15000 })
    await page.getByRole('button', { name: 'Lägg till i Ansökningar' }).waitFor({ state: 'visible' })
    await page.getByRole('button', { name: 'Öva inför intervju' }).waitFor({ state: 'visible' })
  })
  await shot(page, '05-positivt-svar')

  await check('Skriv personligt brev förifyller generatorn (P4)', async () => {
    await openCardMenu(page)
    await page.getByRole('button', { name: 'Skriv personligt brev' }).click()
    await page.waitForURL(/cover-letter/, { timeout: 15000 })
    await page.waitForTimeout(2500)
    await page.getByText(new RegExp(`Spontanansökan på`)).first().waitFor({ state: 'visible', timeout: 10000 })
  })
  await shot(page, '06-brev-forifyllt')

  // Tillbaka + status till Väntar svar så uppföljningen blir aktiv för widget/statistik
  await page.goto(`${BASE}/#/spontanansökan/mina-foretag`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  await page.getByLabel('Sök på namn, ort eller bransch...').fill(searchWord)
  await page.waitForTimeout(500)
  await check('Status tillbaka till Väntar svar via menyn', async () => {
    await openCardMenu(page)
    await page.getByRole('button', { name: /Markera som: Väntar svar/ }).click()
    await page.getByText(/Status ändrad till/).first().waitFor({ state: 'visible', timeout: 15000 })
  })

  // ---------- 4. Statistik ----------
  console.log('\n[4] Statistik')
  await page.goto(`${BASE}/#/spontanansökan/statistik`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  await shot(page, '07-statistik')

  await check('Statistik visar data + komplett statusfördelning (P16)', async () => {
    await page.getByText('Totalt sparade').waitFor({ state: 'visible', timeout: 5000 })
    await page.getByText('Statusfördelning').waitFor({ state: 'visible' })
    for (const label of ['Sparad', 'Arkiverad']) {
      if (await page.getByText(label, { exact: true }).count() === 0) throw new Error(`saknar rad: ${label}`)
    }
  })
  await check('Kommande uppföljningar listar företaget (P1)', async () => {
    await page.getByText('Kommande uppföljningar').waitFor({ state: 'visible' })
    await page.getByText(companyName).first().waitFor({ state: 'visible', timeout: 5000 })
  })

  // ---------- 5. Dashboard-widget ----------
  console.log('\n[5] Widget i Jobb-hubben')
  await page.goto(`${BASE}/#/jobb`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3500)
  await shot(page, '08-jobb-hub')
  const widgetVisible = await page.getByText('företag i pipeline').count()
  if (widgetVisible === 0) {
    skip('Widget: uppföljningsrad (P7)', 'SpontaneousWidget hittades inte på /jobb')
  } else {
    await check('Widget: uppföljningsrad (P7)', async () => {
      await page.getByText(/uppföljning( |ar)/).first().waitFor({ state: 'visible', timeout: 5000 })
    })
  }

  // ---------- 6. Fokusutkast-banner ----------
  console.log('\n[6] Fokusutkast')
  await page.evaluate(() => {
    localStorage.setItem('spontaneous-focus-draft', JSON.stringify({
      industry: 'IT', company: 'Testföretaget AB',
      message: 'Hej! Jag heter Test och söker arbete inom IT.',
      createdAt: new Date().toISOString(),
    }))
  })
  await page.goto(`${BASE}/#/spontanansökan`, { waitUntil: 'domcontentloaded' })
  await page.reload()
  await page.waitForTimeout(2500)
  await shot(page, '09-fokusutkast')
  await check('Utkastbanner visas + sökning förifylld (P6)', async () => {
    await page.getByText('Ditt utkast från fokusläget').waitFor({ state: 'visible', timeout: 5000 })
    await page.getByText('Hej! Jag heter Test och söker arbete inom IT.').waitFor({ state: 'visible' })
    const val = await page.locator('input[placeholder*="Reklambyråer"]').inputValue()
    if (!val.includes('Testföretaget')) throw new Error(`sökfältet: "${val}"`)
  })
  await check('Utkast kan tas bort', async () => {
    await page.getByRole('button', { name: 'Ta bort utkastet' }).click()
    await page.waitForTimeout(300)
    if (await page.getByText('Ditt utkast från fokusläget').count() !== 0) throw new Error('banner kvar')
    const draft = await page.evaluate(() => localStorage.getItem('spontaneous-focus-draft'))
    if (draft) throw new Error('localStorage inte rensad')
  })

  // ---------- 7. Mobilvy ----------
  console.log('\n[7] Mobilfilter')
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: STATE })
  const mpage = await mobile.newPage()
  await mpage.goto(`${BASE}/#/spontanansökan/mina-foretag`, { waitUntil: 'domcontentloaded' })
  await mpage.waitForTimeout(3000)
  await shot(mpage, '10-mobil-filter')
  await check('Mobil: statusfilter som select (P19)', async () => {
    await mpage.locator('#spontaneous-filter').waitFor({ state: 'visible', timeout: 5000 })
  })
  await mobile.close()

  // ---------- 8. Cleanup: ta bort via ConfirmDialog ----------
  console.log('\n[8] Borttagning + ConfirmDialog')
  await page.goto(`${BASE}/#/spontanansökan/mina-foretag`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  await page.getByLabel('Sök på namn, ort eller bransch...').fill(searchWord)
  await page.waitForTimeout(500)
  await check('ConfirmDialog vid borttagning (P13)', async () => {
    await openCardMenu(page)
    await page.getByRole('button', { name: /^Ta bort$/ }).click()
    await page.getByText('Är du säker på att du vill ta bort detta företag?').waitFor({ state: 'visible', timeout: 5000 })
    await shot(page, '11-confirmdialog')
    await page.getByRole('button', { name: /^Ta bort$/ }).last().click()
    await page.getByText(/har tagits bort/).first().waitFor({ state: 'visible', timeout: 15000 })
  })

  if (preexisting === 0) {
    await check('Statistik-EmptyState med CTA vid noll företag (P16)', async () => {
      await page.goto(`${BASE}/#/spontanansökan/statistik`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2500)
      await page.getByText('Här samlas din överblick').waitFor({ state: 'visible', timeout: 5000 })
      await page.getByRole('button', { name: 'Hitta företag att kontakta' }).waitFor({ state: 'visible' })
      await shot(page, '12-statistik-empty')
    })
  } else {
    skip('Statistik-EmptyState (P16)', `${preexisting} företag fanns sedan innan`)
  }

  await browser.close()

  // ---------- Sammanfattning ----------
  console.log('\n================ RESULTAT ================')
  for (const [status, name] of results) console.log(`${status}  ${name}`)
  const failed = results.filter(r => r[0] === 'FAIL').length
  console.log(`\n${results.length} kontroller: ${results.filter(r => r[0] === 'PASS').length} PASS, ${failed} FAIL, ${results.filter(r => r[0] === 'SKIP').length} SKIP`)
  if (errors.length) console.log('\nSidfel:', errors.slice(0, 5).join('\n'))
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
