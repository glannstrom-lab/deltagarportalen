/**
 * HELTÄCKANDE mobil-audit av ALLA deltagar-nåbara sidor.
 * Fold + full-page screenshots @ 360px. Mäter horisontell scroll, overflow,
 * ErrorBoundary, knapptäthet, små tap-targets. Loggar in fräscht.
 *
 * Kör: node e2e/mobile-full-audit.cjs
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

;(() => {
  const envPath = path.join(__dirname, '..', '.env.test.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
})()

const PAGES = [
  // Hubbar
  { path: '/oversikt', label: 'hub-oversikt' },
  { path: '/jobb', label: 'hub-jobb' },
  { path: '/karriar', label: 'hub-karriar' },
  { path: '/resurser', label: 'hub-resurser' },
  { path: '/min-vardag', label: 'hub-min-vardag' },
  { path: '/oversikt/historik', label: 'oversikt-historik' },
  // Jobb-hub
  { path: '/job-search', label: 'job-search' },
  { path: '/applications', label: 'applications' },
  { path: '/spontanansökan', label: 'spontanansokan' },
  { path: '/cv', label: 'cv' },
  { path: '/cover-letter', label: 'cover-letter' },
  { path: '/interview-simulator', label: 'interview-simulator' },
  { path: '/salary', label: 'salary' },
  { path: '/linkedin-optimizer', label: 'linkedin-optimizer' },
  { path: '/international', label: 'international' },
  // Karriär-hub
  { path: '/career', label: 'career' },
  { path: '/interest-guide', label: 'interest-guide' },
  { path: '/skills-gap-analysis', label: 'skills-gap-analysis' },
  { path: '/personal-brand', label: 'personal-brand' },
  { path: '/education', label: 'education' },
  // Resurser-hub
  { path: '/knowledge-base', label: 'knowledge-base' },
  { path: '/resources', label: 'resources' },
  { path: '/print-resources', label: 'print-resources' },
  { path: '/externa-resurser', label: 'externa-resurser' },
  { path: '/ai-team', label: 'ai-team' },
  { path: '/nätverk', label: 'natverk' },
  { path: '/help', label: 'help' },
  // Min vardag-hub
  { path: '/wellness', label: 'wellness' },
  { path: '/diary', label: 'diary' },
  { path: '/calendar', label: 'calendar' },
  { path: '/exercises', label: 'exercises' },
  { path: '/my-consultant', label: 'my-consultant' },
  // Övrigt
  { path: '/profile', label: 'profile' },
  { path: '/settings', label: 'settings' },
  { path: '/steg-till-arbete', label: 'steg-till-arbete' },
]

const VIEWPORT = { w: 360, h: 740 }
const EMAIL = process.env.TEST_USER_EMAIL
const PASSWORD = process.env.TEST_USER_PASSWORD

async function dismissOverlays(page) {
  const sels = [
    'button:has-text("Hoppa över")',
    'button[aria-label="Stäng"]',
    'button:has-text("Avfärda")',
    'button:has-text("Senare")',
    'button:has-text("Acceptera alla")',
  ]
  for (const sel of sels) {
    try {
      const btn = page.locator(sel).first()
      if (await btn.isVisible({ timeout: 150 })) {
        await btn.click({ timeout: 700 }).catch(() => {})
        await page.waitForTimeout(150)
      }
    } catch {}
  }
}

async function main() {
  const out = path.join(__dirname, 'screenshots', 'mobile-full-audit')
  fs.mkdirSync(out, { recursive: true })
  if (!EMAIL || !PASSWORD) { console.error('Saknar TEST_USER_EMAIL/PASSWORD'); process.exit(1) }

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: VIEWPORT.w, height: VIEWPORT.h },
    deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  })
  await context.addInitScript(() => {
    try {
      localStorage.setItem('jobin_cookie_consent', 'true')
      localStorage.setItem('jobin_cookie_preferences', JSON.stringify({ necessary: true, analytics: false }))
      localStorage.setItem('VITE_HUB_NAV_ENABLED', 'true')
    } catch {}
  })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200)) })
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + String(err.message).slice(0, 200)))

  console.log('Loggar in...')
  await page.goto(`http://localhost:3000/#/login?bust=${Date.now()}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  await page.locator('input#email').fill(EMAIL)
  await page.locator('input#password').fill(PASSWORD)
  await page.getByRole('button', { name: /^logga in$/i }).click()
  await page.waitForTimeout(2500)
  console.log('Inloggad — URL:', page.url())

  const findings = []
  for (const p of PAGES) {
    const url = `http://localhost:3000/#${p.path}?bust=${Date.now()}`
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
      await page.waitForTimeout(900)
      await dismissOverlays(page)
      await page.waitForTimeout(250)

      const m = await page.evaluate((vw) => {
        const docEl = document.documentElement
        const horizScroll = docEl.scrollWidth - docEl.clientWidth
        const overflowing = []
        for (const el of document.querySelectorAll('main *')) {
          if (overflowing.length > 6) break
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue
          if (r.right > vw + 1 && r.left < vw + 50) {
            let pp = el.parentElement, clipped = false
            while (pp && pp !== docEl) {
              const cs = getComputedStyle(pp)
              if (/auto|hidden|scroll/.test(cs.overflowX) || /auto|hidden|scroll/.test(cs.overflow)) { clipped = true; break }
              pp = pp.parentElement
            }
            if (clipped) continue
            overflowing.push({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 60), right: Math.round(r.right) })
          }
        }
        // Tap targets < 40px (interaktiva)
        const tinyTargets = []
        for (const el of document.querySelectorAll('main button, main a[href], main [role="button"]')) {
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue
          if (r.height < 36 || r.width < 36) {
            tinyTargets.push({ tag: el.tagName, h: Math.round(r.height), w: Math.round(r.width), txt: (el.textContent || '').trim().slice(0, 24) })
          }
        }
        const h1 = document.querySelector('main h1, h1')
        const errBoundary = !!document.querySelector('[data-error-boundary]')
          || (document.body.textContent?.includes('Något gick fel') && document.body.textContent?.includes('Ladda om')) || false
        const onLogin = !!document.querySelector('input#email')
        return { horizScroll, h1: h1 ? h1.textContent.slice(0, 50) : null, errBoundary, onLogin, overflowing, tinyCount: tinyTargets.length, tiny: tinyTargets.slice(0, 5) }
      }, VIEWPORT.w)

      findings.push({ path: p.path, ...m, errors: consoleErrors.splice(0).slice(0, 3) })
      await page.screenshot({ path: path.join(out, `${p.label}-fold.png`), fullPage: false })
      await page.screenshot({ path: path.join(out, `${p.label}-full.png`), fullPage: true })
    } catch (e) {
      findings.push({ path: p.path, error: String(e.message || e) })
      consoleErrors.splice(0)
    }
  }

  await context.close(); await browser.close()

  console.log('\n=== SUMMARY (flagga: EB=errorboundary LOGIN HS=horizscroll OV=overflow) ===')
  for (const f of findings) {
    if (f.error) { console.log(`ERR  ${f.path}: ${f.error}`); continue }
    const flags = []
    if (f.errBoundary) flags.push('EB')
    if (f.onLogin) flags.push('LOGIN')
    if (f.horizScroll > 0) flags.push('HS' + f.horizScroll)
    if (f.overflowing?.length) flags.push('OV' + f.overflowing.length)
    if (f.tinyCount > 0) flags.push('tiny' + f.tinyCount)
    console.log(`${(flags.join(',')||'ok').padEnd(16)} ${f.path.padEnd(26)} h1="${f.h1}"`)
  }
  console.log('\n=== DETAILS (problem) ===')
  for (const f of findings) {
    if (!f.error && (f.errBoundary || f.onLogin || f.horizScroll > 0 || f.overflowing?.length || f.errors?.length)) {
      console.log(JSON.stringify({ path: f.path, hs: f.horizScroll, ov: f.overflowing, eb: f.errBoundary, login: f.onLogin, tiny: f.tiny, errors: f.errors }, null, 1))
    }
  }
  fs.writeFileSync(path.join(out, '_findings.json'), JSON.stringify(findings, null, 2))
  console.log('\nScreenshots:', out)
}
main().catch((e) => { console.error(e); process.exit(1) })
