/**
 * Mobil INTERAKTIONS-audit @ 360px. Verifierar att overlays/paneler/menyer
 * öppnas, ser bra ut och inte spiller över viewporten.
 *   - Hamburger-meny (mobilnavigation)
 *   - Notifikationer (klocka)
 *   - SamlingarFab-panel (bokmärke)
 *   - CoachWidget-panel (avatarer)
 *   - JobSearch filter-dropdown
 *   - En BottomSheet/modal om sådan triggas
 */
const { chromium } = require('@playwright/test')
const fs = require('fs'), path = require('path')
;(()=>{const e=path.join(__dirname,'..','.env.test.local');if(!fs.existsSync(e))return
  for(const l of fs.readFileSync(e,'utf8').split(/\r?\n/)){const m=/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(l);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}})()

const VW = { width: 360, height: 740 }

async function overflow(page) {
  return page.evaluate(() => {
    const d = document.documentElement
    return { hs: d.scrollWidth - d.clientWidth }
  })
}

async function shot(page, out, name) {
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: false })
  const o = await overflow(page)
  console.log(`${name.padEnd(34)} hs=${o.hs}`)
}

async function main() {
  const out = path.join(__dirname, 'screenshots', 'mobile-interactions')
  fs.mkdirSync(out, { recursive: true })
  const b = await chromium.launch()
  const c = await b.newContext({ viewport: VW, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await c.addInitScript(()=>{try{localStorage.setItem('jobin_cookie_consent','true')}catch{}})
  const p = await c.newPage()
  await p.goto(`http://localhost:3000/#/login?bust=${Date.now()}`,{waitUntil:'networkidle'});await p.waitForTimeout(700)
  await p.locator('input#email').fill(process.env.TEST_USER_EMAIL)
  await p.locator('input#password').fill(process.env.TEST_USER_PASSWORD)
  await p.getByRole('button',{name:/^logga in$/i}).click();await p.waitForTimeout(2500)

  // --- 1. Hamburger-meny ---
  await p.goto(`http://localhost:3000/#/oversikt?bust=${Date.now()}`,{waitUntil:'domcontentloaded'})
  await p.waitForLoadState('networkidle',{timeout:8000}).catch(()=>{});await p.waitForTimeout(1200)
  const burger = p.locator('header button[aria-label*="meny" i], header button[aria-label*="menu" i], header button:has(svg.lucide-menu)').first()
  if (await burger.count()) {
    await burger.click().catch(()=>{}); await p.waitForTimeout(700)
    await shot(p, out, '01-hamburger-open')
    await p.keyboard.press('Escape').catch(()=>{}); await p.waitForTimeout(400)
  } else { console.log('hamburger: hittades inte') }

  // --- 2. Notifikationer ---
  const bell = p.locator('header button[aria-label*="notif" i], header button[aria-label*="avisering" i], header button[aria-label*="meddelande" i]').first()
  if (await bell.count()) {
    await bell.click().catch(()=>{}); await p.waitForTimeout(700)
    await shot(p, out, '02-notifications-open')
    await p.keyboard.press('Escape').catch(()=>{}); await p.waitForTimeout(400)
    await p.mouse.click(5,400).catch(()=>{}); await p.waitForTimeout(300)
  } else { console.log('bell: hittades inte') }

  // --- 3. SamlingarFab ---
  const fab = p.locator('button[aria-label*="samlingar" i]').first()
  if (await fab.count()) {
    await fab.click().catch(()=>{}); await p.waitForTimeout(700)
    await shot(p, out, '03-samlingar-panel')
    await p.keyboard.press('Escape').catch(()=>{}); await p.waitForTimeout(400)
  } else { console.log('samlingar-fab: hittades inte') }

  // --- 4. CoachWidget ---
  const coach = p.locator('button[aria-label*="coachtips" i], button[aria-label*="coach" i]').first()
  if (await coach.count()) {
    await coach.click().catch(()=>{}); await p.waitForTimeout(700)
    await shot(p, out, '04-coach-panel')
    await p.keyboard.press('Escape').catch(()=>{}); await p.waitForTimeout(400)
  } else { console.log('coach-widget: hittades inte') }

  // --- 5. JobSearch filter ---
  await p.goto(`http://localhost:3000/#/job-search?bust=${Date.now()}`,{waitUntil:'domcontentloaded'})
  await p.waitForLoadState('networkidle',{timeout:8000}).catch(()=>{});await p.waitForTimeout(1500)
  const filterBtn = p.locator('button:has-text("Filter"), button[aria-label*="filter" i]').first()
  if (await filterBtn.count()) {
    await filterBtn.click().catch(()=>{}); await p.waitForTimeout(700)
    await shot(p, out, '05-jobsearch-filter')
  } else { console.log('jobsearch-filter: hittades inte'); await shot(p, out, '05-jobsearch-base') }

  // --- 6. Profil-meny (avatar) ---
  await p.goto(`http://localhost:3000/#/oversikt?bust=${Date.now()}`,{waitUntil:'domcontentloaded'})
  await p.waitForLoadState('networkidle',{timeout:8000}).catch(()=>{});await p.waitForTimeout(1200)
  const avatar = p.locator('header button[aria-label*="profil" i], header button[aria-label*="konto" i], header a[href*="profile"]').first()
  if (await avatar.count()) {
    await avatar.click().catch(()=>{}); await p.waitForTimeout(700)
    await shot(p, out, '06-profile-menu')
  } else { console.log('profile-menu: hittades inte') }

  await b.close()
  console.log('\nScreenshots:', out)
}
main().catch(e=>{console.error(e);process.exit(1)})
