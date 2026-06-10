/**
 * Mobil-screenshots av alla hub-undersidor + overflow-detektering.
 *
 * Loggar in fräscht (auth-token i .auth/state.json är gammal och triggar
 * ErrorBoundary på datadrivna sidor). Mäter horisontell scroll, hittar
 * element vars right-bound överstiger viewportbredden.
 */

const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

// Lightweight .env loader (no dotenv-dep)
;(() => {
  const envPath = path.join(__dirname, '..', '.env.test.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
})()

const SUBPAGES = [
  { path: '/job-search', label: 'job-search' },
  { path: '/applications', label: 'applications' },
  { path: '/spontanansökan', label: 'spontanansokan' },
  { path: '/cv', label: 'cv' },
  { path: '/cover-letter', label: 'cover-letter' },
  { path: '/interview-simulator', label: 'interview-simulator' },
  { path: '/salary', label: 'salary' },
  { path: '/career', label: 'career' },
  { path: '/interest-guide', label: 'interest-guide' },
  { path: '/skills-gap-analysis', label: 'skills-gap-analysis' },
  { path: '/personal-brand', label: 'personal-brand' },
  { path: '/education', label: 'education' },
  { path: '/knowledge-base', label: 'knowledge-base' },
  { path: '/resources', label: 'resources' },
  { path: '/print-resources', label: 'print-resources' },
  { path: '/externa-resurser', label: 'externa-resurser' },
  { path: '/ai-team', label: 'ai-team' },
  { path: '/nätverk', label: 'natverk' },
  { path: '/wellness', label: 'wellness' },
  { path: '/diary', label: 'diary' },
  { path: '/calendar', label: 'calendar' },
  { path: '/exercises', label: 'exercises' },
  { path: '/my-consultant', label: 'my-consultant' },
  { path: '/profile', label: 'profile' },
  { path: '/settings', label: 'settings' },
]

const VIEWPORT = { w: 360, h: 740 }
const EMAIL = process.env.TEST_USER_EMAIL
const PASSWORD = process.env.TEST_USER_PASSWORD

async function dismissOverlays(page) {
  const dismissCandidates = [
    'button:has-text("Hoppa över")',
    'button[aria-label="Stäng"]',
    'button:has-text("Avfärda")',
  ]
  for (const sel of dismissCandidates) {
    try {
      const btn = page.locator(sel).first()
      if (await btn.isVisible({ timeout: 200 })) {
        await btn.click({ timeout: 800 }).catch(() => {})
        await page.waitForTimeout(200)
      }
    } catch {}
  }
}

async function main() {
  const out = path.join(__dirname, 'screenshots', 'subpages-mobile')
  fs.mkdirSync(out, { recursive: true })

  if (!EMAIL || !PASSWORD) {
    console.error('Saknar TEST_USER_EMAIL/PASSWORD i .env.test.local')
    process.exit(1)
  }

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: VIEWPORT.w, height: VIEWPORT.h },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  await context.addInitScript(() => {
    try {
      localStorage.setItem('jobin_cookie_consent', 'true')
      localStorage.setItem('jobin_cookie_preferences', JSON.stringify({ necessary: true, analytics: false }))
    } catch {}
  })
  const page = await context.newPage()
  // Logga konsolfel så vi kan diagnostisera ErrorBoundaries
  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 220))
  })
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + String(err.message).slice(0, 220)))

  // Fresh login
  console.log('Loggar in...')
  await page.goto(`http://localhost:3000/#/login?bust=${Date.now()}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.locator('input#email').fill(EMAIL)
  await page.locator('input#password').fill(PASSWORD)
  await page.getByRole('button', { name: /^logga in$/i }).click()
  await page.waitForURL(/#\/(?!login).*$|^[^#]*#\/?$/, { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(1500)
  console.log('Inloggad — URL:', page.url())

  const findings = []

  for (const sub of SUBPAGES) {
    const url = `http://localhost:3000/#${sub.path}?bust=${Date.now()}`
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
      await page.waitForTimeout(900)
      await dismissOverlays(page)
      await page.waitForTimeout(300)

      const m = await page.evaluate((vw) => {
        const docEl = document.documentElement
        const horizScroll = docEl.scrollWidth - docEl.clientWidth
        // Hitta containers vars naturalwidth överskrider sin parent-bredd och saknar overflow-clip
        const overflowing = []
        const all = document.querySelectorAll('main *')
        for (const el of all) {
          if (overflowing.length > 8) break
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue
          if (r.right > vw + 1 && r.left < vw + 50) {
            // Skippa om någon förälder har overflow-clip
            let p = el.parentElement
            let clipped = false
            while (p && p !== docEl) {
              const cs = window.getComputedStyle(p)
              if (cs.overflowX === 'auto' || cs.overflowX === 'hidden' || cs.overflowX === 'scroll'
                || cs.overflow === 'auto' || cs.overflow === 'hidden' || cs.overflow === 'scroll') {
                clipped = true; break
              }
              p = p.parentElement
            }
            if (clipped) continue
            overflowing.push({
              tag: el.tagName,
              cls: (el.className || '').toString().slice(0, 70),
              right: Math.round(r.right),
              width: Math.round(r.width),
            })
          }
        }
        const h1 = document.querySelector('main h1, h1')
        // Mer specifik ErrorBoundary-detektion: leta efter komponentens roll/struktur
        const errBoundary = !!document.querySelector('[data-error-boundary]')
          || (document.body.textContent?.includes('Något gick fel') && document.body.textContent?.includes('Ladda om sidan')) || false
        return {
          horizScroll,
          docScrollWidth: docEl.scrollWidth,
          h1Text: h1 ? h1.textContent.slice(0, 60) : null,
          errBoundary,
          overflowing,
        }
      }, VIEWPORT.w)

      findings.push({ path: sub.path, ...m, errors: consoleErrors.splice(0).slice(0, 4) })
      await page.screenshot({ path: path.join(out, `${sub.label}-fold.png`), fullPage: false })
    } catch (e) {
      findings.push({ path: sub.path, error: String(e.message || e) })
    }
  }

  await context.close()
  await browser.close()

  console.log('\n=== SUMMARY ===')
  for (const f of findings) {
    if (f.error) { console.log(`ERROR ${f.path}: ${f.error}`); continue }
    const flag = f.errBoundary ? 'EB ' : (f.horizScroll > 0 ? 'HS ' : (f.overflowing && f.overflowing.length > 0 ? 'OV ' : '   '))
    console.log(`${flag}${f.path}  scroll=${f.horizScroll}  ovfl=${(f.overflowing||[]).length}  h1="${f.h1Text}"`)
  }

  // Detaljer för problemfall
  console.log('\n=== DETAILS (problems) ===')
  for (const f of findings) {
    if (!f.error && (f.errBoundary || f.horizScroll > 0 || (f.overflowing && f.overflowing.length > 0))) {
      console.log(JSON.stringify(f, null, 2))
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
