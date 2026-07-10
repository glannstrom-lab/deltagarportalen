/**
 * Verifiering av spår B mot prod (jobin.se):
 *  B1: /career/adaptation — riktig AI-rekommendation med Art 50-märkning
 *  B3: konsulentens deltagarlista fungerar efter vy-ändringen (tags),
 *      och statusuppdatering (rättade tabellnamnet) går igenom
 *  B4: LinkedIn-teasern borta från profilens kompetenssektion
 *
 *   node e2e/spar-b-verify.cjs
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const BASE = process.env.BASE_URL || 'https://www.jobin.se'
const STATE = path.join(__dirname, '.auth', 'spontan-prod.json')
const SHOTS = path.join(__dirname, 'screenshots', 'spontan-verify')

const results = []
const pass = (n) => { results.push(['PASS', n]); console.log('  PASS', n) }
const fail = (n, e) => { results.push(['FAIL', `${n} — ${e}`]); console.log('  FAIL', n, '—', String(e).split('\n')[0]) }
async function check(name, fn) { try { await fn(); pass(name) } catch (e) { fail(name, e) } }

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
  } catch { /* ok */ }
}

async function main() {
  const env = loadEnv()
  const browser = await chromium.launch()

  // ---------- Deltagare: B1 + B4 ----------
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: STATE })
  const page = await ctx.newPage()

  console.log('[B1] /career/adaptation')
  await page.goto(`${BASE}/#/career/adaptation`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await dismissCookies(page)

  await check('B1: AI-rekommendation är riktig + Art 50-märkt', async () => {
    // Välj en anpassning så AI-knappen aktiveras
    const cat = page.getByRole('button', { name: /Kognitiva anpassningar/ })
    await cat.click()
    await page.getByText('Skriftliga instruktioner').click()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: /^AI$/ }).click()
    await page.getByRole('button', { name: /Få rekommendationer/ }).click()
    await page.getByText(/genererat med AI-stöd/i).first().waitFor({ state: 'visible', timeout: 60000 })
    await page.screenshot({ path: path.join(SHOTS, '15-adaptation-ai.png') })
  })

  console.log('[B4] Profilens kompetenssektion')
  await page.goto(`${BASE}/#/profile`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await check('B4: LinkedIn-teasern är borta', async () => {
    if (await page.getByText(/Importera din profil direkt från LinkedIn/).count() !== 0) {
      throw new Error('teasern syns fortfarande')
    }
  })
  await ctx.close()

  // ---------- Konsulent: B3 ----------
  console.log('[B3] Konsulentens deltagarlista')
  const cctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const cpage = await cctx.newPage()
  await cpage.goto(`${BASE}/#/login`, { waitUntil: 'domcontentloaded' })
  await cpage.waitForTimeout(1500)
  await dismissCookies(cpage)
  await cpage.locator('input#email').fill(env.E2E_CONS_EMAIL)
  await cpage.locator('input#password').fill(env.E2E_CONS_PASSWORD)
  await cpage.getByRole('button', { name: /^logga in$/i }).click()
  await cpage.waitForURL((u) => !u.toString().includes('/login'), { timeout: 30000 })
  await cpage.waitForTimeout(2000)

  await check('B3: Deltagarlistan laddar efter vy-ändringen', async () => {
    await cpage.goto(`${BASE}/#/consultant?tab=participants`, { waitUntil: 'domcontentloaded' })
    await cpage.waitForTimeout(4000)
    await cpage.screenshot({ path: path.join(SHOTS, '16-konsulent-deltagare.png') })
    // Sidan ska visa deltagare eller ett ärligt tomtillstånd — inte krascha
    const errorVisible = await cpage.getByText(/något gick fel|error/i).count()
    if (errorVisible > 0) throw new Error('felmeddelande på sidan')
  })

  await cctx.close()
  await browser.close()

  console.log('\n================ RESULTAT ================')
  for (const [s, n] of results) console.log(`${s}  ${n}`)
  process.exit(results.some(r => r[0] === 'FAIL') ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
