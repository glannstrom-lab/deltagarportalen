/**
 * Live UX/content audit against production (jobin.se).
 * Dismisses cookie banner, captures full-page screenshots of every
 * participant route at desktop + mobile widths for UX/UI review.
 *
 *   node e2e/live-ux-audit.cjs
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const EMAIL = process.env.E2E_EMAIL || 'claude-playwright-test@jobin.se'
const PASSWORD = process.env.E2E_PASSWORD || process.env.TEST_USER_PASSWORD
const BASE_URL = process.env.E2E_BASE_URL || 'https://www.jobin.se'
const OUT = path.join(__dirname, '..', 'audit-2026-05-28', 'ux')

const ROUTES = [
  ['/', 'dashboard'],
  ['/profile', 'profil'],
  ['/cv', 'cv'],
  ['/cover-letter', 'cover-letter'],
  ['/job-search', 'job-search'],
  ['/applications', 'applications'],
  ['/spontanansökan', 'spontan'],
  ['/salary', 'salary'],
  ['/interview-simulator', 'interview'],
  ['/career', 'career'],
  ['/interest-guide', 'interest'],
  ['/skills-gap-analysis', 'skills-gap'],
  ['/personal-brand', 'personal-brand'],
  ['/education', 'education'],
  ['/knowledge-base', 'kb'],
  ['/resources', 'resources'],
  ['/ai-team', 'ai-team'],
  ['/nätverk', 'network'],
  ['/wellness', 'wellness'],
  ['/diary', 'diary'],
  ['/calendar', 'calendar'],
  ['/exercises', 'exercises'],
  ['/my-consultant', 'my-consultant'],
  ['/steg-till-arbete', 'sta'],
  ['/linkedin-optimizer', 'linkedin'],
  ['/international', 'international'],
  ['/print-resources', 'print-resources'],
  ['/externa-resurser', 'externa'],
]

async function dismissCookies(page) {
  try {
    const btn = page.getByRole('button', { name: /Acceptera alla|Endast nödvändiga/i }).first()
    if (await btn.isVisible({ timeout: 4000 })) {
      await btn.click()
      await page.waitForTimeout(400)
    }
  } catch { /* no banner */ }
}

async function main() {
  fs.mkdirSync(path.join(OUT, 'desktop'), { recursive: true })
  fs.mkdirSync(path.join(OUT, 'mobile'), { recursive: true })
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sv-SE' })
  // Pre-set cookie consent so the GDPR banner never overlays screenshots.
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('jobin_cookie_consent', 'true')
      localStorage.setItem('jobin_cookie_preferences', JSON.stringify({ necessary: true, analytics: false }))
    } catch { /* ignore */ }
  })
  const page = await ctx.newPage()

  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' })
  await page.locator('input#email').fill(EMAIL)
  await page.locator('input#password').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 20000 }).catch(() => {})
  await dismissCookies(page)
  console.log('logged in, cookies dismissed ->', page.url())

  const ONLY = (process.env.ONLY || '').toLowerCase() // 'desktop' | 'mobile' | ''

  // Desktop full-page
  if (ONLY !== 'mobile') {
    await page.setViewportSize({ width: 1440, height: 900 })
    for (const [route, slug] of ROUTES) {
      try {
        await page.goto(`${BASE_URL}/#${route}`, { waitUntil: 'networkidle', timeout: 35000 })
        await page.waitForTimeout(1500)
        await page.screenshot({ path: path.join(OUT, 'desktop', `${slug}.png`), fullPage: true })
        console.log('desktop', slug)
      } catch (e) { console.log('ERR desktop', slug, String(e).slice(0, 100)) }
    }
  }

  // Mobile (iPhone 12-ish) for ALL routes
  if (ONLY !== 'desktop') {
    await page.setViewportSize({ width: 390, height: 844 })
    for (const [route, slug] of ROUTES) {
      try {
        await page.goto(`${BASE_URL}/#${route}`, { waitUntil: 'networkidle', timeout: 35000 })
        await page.waitForTimeout(1500)
        await page.screenshot({ path: path.join(OUT, 'mobile', `${slug}.png`), fullPage: true })
        console.log('mobile', slug)
      } catch (e) { console.log('ERR mobile', slug, String(e).slice(0, 100)) }
    }
  }

  await browser.close()
  console.log('done ->', OUT)
}

main().catch((e) => { console.error(e); process.exit(1) })
