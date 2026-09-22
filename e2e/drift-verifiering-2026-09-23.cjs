/**
 * Verifierar driftpassets tre kritiska rättelser mot skarp drift (jobin.se).
 * Kör: node e2e/drift-verifiering-2026-09-23.cjs
 *
 * 1. Mobilbredd: inga undersidor bredare än 375 px (mäts mot 375, inte innerWidth —
 *    Playwrights isMobile låter innerWidth växa med innehållet).
 * 2. Inbjudningslänken: get_invitation_by_token får faktiskt en parameter.
 * 3. Språket: engelska finns kvar efter omladdning. Testkontot återställs till svenska.
 *
 * Skriver bara testkontots eget språkval. Inga andra skrivningar.
 */
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const env = {}
for (const f of [path.join(ROOT, '.env.test.local'), path.join(ROOT, 'client', '.env')]) {
  if (!fs.existsSync(f)) continue
  for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z_]+)=(.*)$/)
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
const BASE = 'https://www.jobin.se'
const cc = fs.readFileSync(path.join(ROOT, 'client/src/components/CookieConsent.tsx'), 'utf8')
const CK = (cc.match(/COOKIE_CONSENT_KEY\s*=\s*['"]([^'"]+)/) || [])[1] || 'cookie-consent'
const CP = (cc.match(/COOKIE_PREFERENCES_KEY\s*=\s*['"]([^'"]+)/) || [])[1] || 'cookie-preferences'
const COOKIE_INIT = `(() => { try { localStorage.setItem(${JSON.stringify(CK)}, 'true'); localStorage.setItem(${JSON.stringify(CP)}, JSON.stringify({necessary:true,analytics:false,marketing:false,functional:false})) } catch (e) {} })()`

let fel = 0
const utfall = (ok, text) => { console.log(`${ok ? 'OK  ' : 'FEL '} ${text}`); if (!ok) fel++ }

async function loggaIn(page) {
  await page.goto(BASE + '/#/login', { waitUntil: 'domcontentloaded' })
  await page.locator('input#email').waitFor({ timeout: 20000 })
  await page.locator('input#email').fill(env.TEST_USER_EMAIL)
  await page.locator('input#password').fill(env.TEST_USER_PASSWORD)
  await page.locator('button[type="submit"]').first().click()
  await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 30000 })
  await page.waitForTimeout(2500)
}

async function valjSprak(page, namn) {
  await page.getByRole('button', { name: /välj språk|choose language|select language|språk|language/i }).first().click()
  await page.waitForTimeout(400)
  await page.getByText(new RegExp(`^${namn}$`)).first().click()
  await page.waitForTimeout(2500)
}

;(async () => {
  const browser = await chromium.launch()

  // 1. Mobilbredd
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
    await ctx.addInitScript(COOKIE_INIT)
    const page = await ctx.newPage()
    await loggaIn(page)
    for (const r of ['/cv', '/job-search', '/applications', '/diary', '/settings', '/interest-guide', '/cover-letter', '/knowledge-base']) {
      await page.goto(BASE + '/#' + r, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2500)
      const bredd = await page.evaluate(() => document.documentElement.scrollWidth)
      utfall(bredd <= 375, `mobil ${r}: ${bredd} px`)
    }
    await ctx.close()
  }

  // 2. Inbjudningslänken
  {
    const ctx = await browser.newContext()
    await ctx.addInitScript(COOKIE_INIT)
    const page = await ctx.newPage()
    let kropp = null
    page.on('request', (req) => { if (req.url().includes('get_invitation_by_token')) kropp = req.postData() })
    await page.goto(BASE + '/#/invite/verifiering-kod-123', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(4000)
    utfall(!!kropp && kropp.includes('verifiering-kod-123'), `inbjudan skickar koden till RPC:n (kropp: ${kropp})`)
    await ctx.close()
  }

  // 3. Språket överlever omladdning
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await ctx.addInitScript(COOKIE_INIT)
    const page = await ctx.newPage()
    await loggaIn(page)
    await valjSprak(page, 'English')
    const fore = await page.evaluate(() => document.documentElement.lang)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(5000)
    const efter = await page.evaluate(() => document.documentElement.lang)
    utfall(fore.startsWith('en') && efter.startsWith('en'), `språk före omladdning: ${fore}, efter: ${efter}`)
    // Lämna testkontot som det var
    await valjSprak(page, 'Svenska').catch(() => console.log('     (kunde inte välja Svenska igen — kontrollera testkontot)'))
    await page.waitForTimeout(2000)
    console.log(`     återställt till: ${await page.evaluate(() => document.documentElement.lang)}`)
    await ctx.close()
  }

  await browser.close()
  console.log(fel ? `\n${fel} kontroll(er) föll` : '\nAlla kontroller gröna')
  process.exit(fel ? 1 : 0)
})().catch((e) => { console.error(e); process.exit(2) })
