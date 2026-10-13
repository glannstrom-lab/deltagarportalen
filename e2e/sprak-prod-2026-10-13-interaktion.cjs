// Google Translate: interaktion + tillbaka till svenska via menyn (2026-10-13)
const { chromium } = require('playwright')
const fs = require('fs'), path = require('path')
;(() => { const p = path.join(__dirname, '..', '.env.test.local'); if (!fs.existsSync(p)) return
  for (const l of fs.readFileSync(p, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim() } })()
const BASE = process.env.BASE || 'https://www.jobin.se'
const OUT = process.env.OUT || path.join(__dirname, '..', 'test-results', 'sprak')
fs.mkdirSync(OUT, { recursive: true })
const logg = (...a) => console.log(...a)
;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const fel = []
  page.on('pageerror', (e) => fel.push('pageerror ' + e.message.slice(0, 200)))
  page.on('console', (m) => { if (m.type() === 'error') fel.push('console ' + m.text().slice(0, 200)) })
  await page.goto(BASE + '/#/login', { waitUntil: 'networkidle' })
  await page.fill('#email', process.env.DEMO_PARTICIPANT_EMAIL); await page.fill('#password', process.env.DEMO_PARTICIPANT_PASSWORD)
  await page.keyboard.press('Enter'); await page.waitForURL((u) => !u.hash.includes('/login'), { timeout: 30000 }); await page.waitForTimeout(2500)
  // Välj somaliska via toppnavens glob
  const glob = page.getByRole('button', { name: /Översätt sidan/i }).first()
  logg('globknapp synlig', await glob.isVisible())
  await glob.click(); await page.getByRole('button', { name: /Soomaali/ }).click()
  await page.waitForLoadState('networkidle'); await page.waitForTimeout(7000)
  logg('efter so: lang', await page.evaluate(() => document.documentElement.lang), 'cookies', (await ctx.cookies()).filter(c => c.name === 'googtrans').map(c => `${c.domain}=${c.value}`))
  // Interaktion: Visa något annat, flikar på ansökningar, dagbok
  const annat = page.locator('[data-testid="radgivar-halsning"] button').filter({ hasText: /./ })
  logg('dialogknappar', await annat.count())
  for (const s of ['/applications', '/diary', '/wellness', '/jobb']) {
    await page.goto(BASE + '/#' + s, { waitUntil: 'networkidle' }); await page.waitForTimeout(3500)
    const tabs = page.locator('main [role="tab"], main nav a, main button').filter({ visible: true })
    const n = Math.min(await tabs.count(), 6)
    for (let i = 0; i < n; i++) { await tabs.nth(i).click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(700); await page.keyboard.press('Escape').catch(() => {}) }
    const krasch = await page.evaluate(() => /Could not load the page|Sidan kunde inte|Something went wrong|Något gick fel/i.test(document.body.innerText))
    logg('interaktion', s, 'krasch', krasch)
    if (krasch) await page.screenshot({ path: path.join(OUT, `krasch${s.replace(/\//g, '_')}.png`) })
  }
  // Tillbaka till svenska via menyn
  await page.goto(BASE + '/#/oversikt', { waitUntil: 'networkidle' }); await page.waitForTimeout(3000)
  await page.locator('button[aria-label]').filter({ has: page.locator('svg') }).evaluateAll(() => {})
  const glob2 = page.locator('header button[aria-expanded]').filter({ has: page.locator('svg') })
  // knappens etikett är översatt nu — hitta den via title-attributet
  const g = page.locator('button[title*="so"], button[title*="Soomaali"], button[title*="Översatt"]').first()
  const hittad = await g.count()
  logg('glob (översatt) hittad', hittad)
  if (hittad) { await g.click(); await page.locator('button:has-text("Svenska")').first().click() }
  await page.waitForLoadState('networkidle'); await page.waitForTimeout(5000)
  logg('efter tillbaka: lang', await page.evaluate(() => document.documentElement.lang), 'klass', await page.evaluate(() => document.documentElement.className),
    'cookies', (await ctx.cookies()).filter(c => c.name === 'googtrans').map(c => `${c.domain}=${c.value}`),
    'h1', await page.evaluate(() => document.querySelector('h1')?.innerText))
  await page.screenshot({ path: path.join(OUT, 'tillbaka-svenska.png') })
  // English via översättningslistan
  const g3 = page.getByRole('button', { name: /Översätt sidan/i }).first()
  await g3.click(); await page.getByRole('button', { name: /^🇬🇧\s*English|English/ }).first().click()
  await page.waitForLoadState('networkidle'); await page.waitForTimeout(6000)
  logg('efter English-i-listan: i18n-lang', await page.evaluate(() => localStorage.getItem('language')), 'google', await page.evaluate(() => localStorage.getItem('googleTranslateLanguage')), 'klass', await page.evaluate(() => document.documentElement.className))
  await page.screenshot({ path: path.join(OUT, 'english-i-listan.png') })
  // Städa: tillbaka
  await page.evaluate(() => { localStorage.removeItem('googleTranslateLanguage') }); await ctx.clearCookies()
  logg('FEL', fel.length); fel.slice(0, 12).forEach((f) => logg(' ', f))
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
