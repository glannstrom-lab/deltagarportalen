/**
 * Mobil-screenshots av hub-sidor — verifiera att titel/hero/cards inte overflowar
 * eller staplar konstigt på smala skärmar.
 *
 * Använder den sparade auth-staten i e2e/.auth/state.json så vi får
 * inloggad vy direkt.
 */

const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const HUBS = [
  { path: '/', label: 'oversikt' },
  { path: '/jobb', label: 'jobb' },
  { path: '/karriar', label: 'karriar' },
  { path: '/resurser', label: 'resurser' },
  { path: '/min-vardag', label: 'min-vardag' },
  // Undersidor — verifiera att MobileBackButton inte överlappar topbar-loggan
  { path: '/cv', label: 'cv' },
  { path: '/wellness', label: 'wellness' },
  { path: '/job-search', label: 'job-search' },
]

const VIEWPORTS = [
  { w: 360, h: 740, name: '360' },
  { w: 414, h: 896, name: '414' },
]

async function main() {
  const out = path.join(__dirname, 'screenshots', 'hubs-mobile')
  fs.mkdirSync(out, { recursive: true })
  const authStatePath = path.join(__dirname, '.auth', 'state.json')
  const hasAuth = fs.existsSync(authStatePath)
  console.log('auth state present:', hasAuth)

  const browser = await chromium.launch()

  const findings = []

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      storageState: hasAuth ? authStatePath : undefined,
    })
    await context.addInitScript(() => {
      try {
        localStorage.setItem('jobin_cookie_consent', 'true')
        localStorage.setItem('jobin_cookie_preferences', JSON.stringify({ necessary: true, analytics: false }))
      } catch {}
    })
    const page = await context.newPage()

    for (const hub of HUBS) {
      const url = `http://localhost:3000/#${hub.path}?bust=${Date.now()}`
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
        await page.waitForTimeout(1500)

        const hasLogin = await page.locator('input#email').isVisible().catch(() => false)
        if (hasLogin) {
          findings.push({ vp: vp.name, hub: hub.label, status: 'redirected to login (auth expired?)' })
          await page.screenshot({ path: path.join(out, `${hub.label}-${vp.name}-LOGIN.png`), fullPage: false })
          continue
        }

        // Mät överflöd och faktisk hero-bredd
        const measurements = await page.evaluate(() => {
          const docEl = document.documentElement
          const main = document.getElementById('main-content')
          const horizScroll = (docEl.scrollWidth || 0) - (docEl.clientWidth || 0)
          const mainScroll = main ? main.scrollWidth - main.clientWidth : 0

          // Hitta första H1 på sidan + dess bounding box
          const h1 = document.querySelector('main h1, h1')
          const h1Box = h1 ? h1.getBoundingClientRect() : null

          // Hitta hero-section (första <section> med radial bakgrund eller bg-[var(--c-bg)])
          const hero = document.querySelector('section[aria-labelledby], section')
          const heroBox = hero ? hero.getBoundingClientRect() : null

          // Stil på H1
          const h1Style = h1 ? window.getComputedStyle(h1) : null

          return {
            docScrollWidth: docEl.scrollWidth,
            docClientWidth: docEl.clientWidth,
            horizScroll,
            mainScroll,
            h1: h1 ? {
              text: h1.textContent.slice(0, 80),
              fontSize: h1Style.fontSize,
              width: h1Box.width,
              right: h1Box.right,
            } : null,
            hero: heroBox ? { width: heroBox.width, right: heroBox.right } : null,
          }
        })

        findings.push({ vp: vp.name, hub: hub.label, ...measurements })

        await page.screenshot({ path: path.join(out, `${hub.label}-${vp.name}-fold.png`), fullPage: false })
        await page.screenshot({ path: path.join(out, `${hub.label}-${vp.name}-full.png`), fullPage: true })
      } catch (e) {
        findings.push({ vp: vp.name, hub: hub.label, error: String(e.message || e) })
      }
    }

    await context.close()
  }

  await browser.close()
  console.log(JSON.stringify(findings, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
