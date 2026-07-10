/**
 * Verifiering av spår F mot prod: i18n-svepet får inte ha lämnat råa
 * nycklar i UI:t, hubbarna ska visa svenska, och engelska ska ge
 * engelska hubbkort (nya nycklarna finns i en.json).
 *
 *   node e2e/spar-f-verify.cjs
 */
const { chromium } = require('@playwright/test')
const path = require('path')

const BASE = process.env.BASE_URL || 'https://www.jobin.se'
const STATE = path.join(__dirname, '.auth', 'spontan-prod.json')
const SHOTS = path.join(__dirname, 'screenshots', 'spontan-verify')

const results = []
const pass = (n) => { results.push(['PASS', n]); console.log('  PASS', n) }
const fail = (n, e) => { results.push(['FAIL', `${n} — ${e}`]); console.log('  FAIL', n, '—', String(e).split('\n')[0]) }
async function check(name, fn) { try { await fn(); pass(name) } catch (e) { fail(name, e) } }

// Råa i18n-nycklar syns som "hubOverview.xxx" / "jobsokHub.xxx" i texten
const RAW_KEY = /\b(hubOverview|hubOverviewHistory|jobsokHub|karriarHub|resurserHub|minVardagHub|hubs)\.[a-zA-Z.]+\b/

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: STATE })
  const page = await ctx.newPage()

  for (const [route, mustContain] of [
    ['/#/oversikt', /Vad vill du göra idag\?|God morgon|God kväll|Hej/],
    ['/#/jobb', /Hitta och söka jobb/],
    ['/#/karriar', /Karriär/],
    ['/#/resurser', /Resurser/],
    ['/#/min-vardag', /vardag/i],
  ]) {
    await check(`${route}: svensk text, inga råa nycklar`, async () => {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(3500)
      const text = await page.locator('main, body').first().innerText()
      if (!mustContain.test(text)) throw new Error('förväntad text saknas')
      const m = text.match(RAW_KEY)
      if (m) throw new Error(`rå nyckel i UI: ${m[0]}`)
    })
  }
  await page.screenshot({ path: path.join(SHOTS, '21-hub-i18n.png') })

  // Byt till engelska via i18next-localStorage och verifiera engelska hubbkort
  await check('Engelska: hubbkorten översatta', async () => {
    await page.evaluate(() => localStorage.setItem('language', 'en'))
    await page.goto(`${BASE}/#/jobb`, { waitUntil: 'domcontentloaded' })
    await page.reload()
    await page.waitForTimeout(4000)
    const text = await page.locator('body').innerText()
    if (!/Find and search for jobs|Search jobs|Find jobs/i.test(text)) throw new Error('ingen engelsk hubbtitel — fick: ' + text.slice(0, 120))
    const m = text.match(RAW_KEY)
    if (m) throw new Error(`rå nyckel i UI: ${m[0]}`)
    await page.screenshot({ path: path.join(SHOTS, '22-hub-english.png') })
    await page.evaluate(() => localStorage.setItem('language', 'sv'))
  })

  await ctx.close()
  await browser.close()
  console.log('\n================ RESULTAT ================')
  for (const [s, n] of results) console.log(`${s}  ${n}`)
  process.exit(results.some(r => r[0] === 'FAIL') ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
