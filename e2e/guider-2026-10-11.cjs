// Visuell kontroll av de inbyggda guiderna (2026-10-11): konsulentens "Så kommer du igång"
// på Översikt och deltagarens "Vad förväntas av mig?" i Min vecka. 390 px och 1440 px, ljust
// och mörkt. Bara läsning — guiden skriver ingenting till databasen.
// Kör: node e2e/guider-2026-10-11.cjs  (PLAYWRIGHT_BASE_URL, default http://localhost:3000)
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')
;(function lasEnv() {
  const p = path.join(__dirname, '..', '.env.test.local'); if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2] }
})()
const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const OUT = process.env.GUIDE_OUT || path.join(__dirname, '..', 'test-results', 'guider-2026-10-11')
fs.mkdirSync(OUT, { recursive: true })
const KONTON = [
  ['konsulent', process.env.TEST_CONSULTANT_EMAIL, process.env.TEST_CONSULTANT_PASSWORD, '/#/consultant', 'kom-igang'],
  ['deltagare', process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD, '/#/min-vecka', 'vad-forvantas'],
]

async function cookies(page) { const b = page.getByRole('button', { name: 'Endast nödvändiga' }); if (await b.isVisible({ timeout: 3000 }).catch(() => false)) await b.click() }

;(async () => {
  const browser = await chromium.launch()
  for (const [namn, epost, losen, sida, testid] of KONTON) {
    if (!epost || !losen) { console.log('SAKNAR konto för', namn); continue }
    for (const [bredd, hojd] of [[390, 844], [1440, 900]]) {
      for (const tema of ['light', 'dark']) {
        const ctx = await browser.newContext({ viewport: { width: bredd, height: hojd }, locale: 'sv-SE', colorScheme: tema })
        const page = await ctx.newPage()
        const fel = []
        page.on('pageerror', (e) => fel.push(String(e)))
        await page.goto(BASE + '/#/login', { waitUntil: 'networkidle' })
        await cookies(page)
        await page.fill('#email', epost); await page.fill('#password', losen)
        await page.click('button[type="submit"]')
        await page.waitForURL((u) => !u.hash.includes('/login'), { timeout: 30000 })
        await page.goto(BASE + sida, { waitUntil: 'networkidle' })
        await page.waitForTimeout(2500)
        const kort = page.locator(`[data-testid="${testid}-guide"], [data-testid="${testid}"]`).first()
        const oppna = page.locator(`[data-testid="${testid}-oppna"]`)
        const syns = await kort.isVisible().catch(() => false)
        const knapp = await oppna.isVisible().catch(() => false)
        console.log(namn, bredd, tema, 'kort:', syns, 'öppna-knapp:', knapp, fel.length ? 'FEL: ' + fel.join(' | ') : '')
        if (syns) {
          await kort.scrollIntoViewIfNeeded()
          await kort.screenshot({ path: path.join(OUT, `${namn}-${bredd}-${tema}.png`) })
          const text = (await kort.innerText()).replace(/\s+/g, ' ').slice(0, 600)
          if (bredd === 390 && tema === 'light') console.log('  text:', text)
          const sidbredd = await page.evaluate(() => document.documentElement.scrollWidth)
          if (sidbredd > bredd) console.log('  VARNING horisontell scroll', sidbredd)
        } else if (knapp) {
          await page.screenshot({ path: path.join(OUT, `${namn}-${bredd}-${tema}-stangd.png`) })
        } else {
          await page.screenshot({ path: path.join(OUT, `${namn}-${bredd}-${tema}-saknas.png`), fullPage: true })
        }
        await ctx.close()
      }
    }
  }
  await browser.close()
})()
