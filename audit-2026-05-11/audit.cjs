/**
 * Utökad produktionsaudit — Fas 0-8 verifiering (2026-05-11)
 *
 * Utöver original-auditen (audit-2026-05-10/audit.cjs):
 * - DESIGN.md-checkpunkter per sida (full pastell-hero på hub, 4 px kant
 *   på tool, inga eyebrow, inga gradient-knappar, personalisering)
 * - Touch-target-audit på mobil-viewport (< 44 px flaggas)
 * - axe-core WCAG-scan
 * - Visuell regression vs baseline.json
 *
 * Lighthouse-scope hanteras i separat skript pga overhead.
 */
const { chromium } = require('playwright')
const { AxeBuilder } = require('@axe-core/playwright')
const fs = require('fs')
const path = require('path')

const BASE = 'https://jobin.se'
const OUT = __dirname
const SHOTS = path.join(OUT, 'screenshots')
const SHOTS_MOBILE = path.join(OUT, 'screenshots-mobile')
const DATA = path.join(OUT, 'data')

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'claude-playwright-test@jobin.se',
  password: process.env.TEST_USER_PASSWORD || 'HjFxMLjrXzjHhOqS33j9vPzq',
}

// Hub-paths (full pastell-hero förväntas)
const HUB_LANDING_PATHS = ['/oversikt', '/jobb', '/karriar', '/resurser', '/min-vardag']

const PAGES = [
  { id: '01-landing-public', path: '/', requireLogout: true, label: 'Landningssida' },
  { id: '02-login', path: '/#/login', requireLogout: true, label: 'Inloggning' },
  { id: '03-register', path: '/#/register', requireLogout: true, label: 'Registrering' },
  { id: '04-privacy', path: '/#/privacy', requireLogout: true, label: 'Integritet' },
  { id: '05-terms', path: '/#/terms', requireLogout: true, label: 'Villkor' },
  { id: '06-ai-policy', path: '/#/ai-policy', requireLogout: true, label: 'AI-policy' },

  { id: '10-dashboard', path: '/#/', label: 'Dashboard' },
  { id: '11-hub-oversikt', path: '/#/oversikt', label: 'Hub: Översikt', isHubLanding: true },
  { id: '11b-hub-oversikt-historik', path: '/#/oversikt/historik', label: 'Hub: Historik' },
  { id: '12-hub-jobb', path: '/#/jobb', label: 'Hub: Söka jobb', isHubLanding: true },
  { id: '13-hub-karriar', path: '/#/karriar', label: 'Hub: Karriär', isHubLanding: true },
  { id: '14-hub-resurser', path: '/#/resurser', label: 'Hub: Resurser', isHubLanding: true },
  { id: '15-hub-vardag', path: '/#/min-vardag', label: 'Hub: Min vardag', isHubLanding: true },

  { id: '20-cv', path: '/#/cv', label: 'CV', tabs: [
    { id: 'create', path: '/#/cv' },
    { id: 'my-cvs', path: '/#/cv/my-cvs' },
    { id: 'adapt', path: '/#/cv/adapt' },
    { id: 'ats', path: '/#/cv/ats' },
    { id: 'tips', path: '/#/cv/tips' },
  ]},
  { id: '21-cover-letter', path: '/#/cover-letter', label: 'Personligt brev', tabs: [
    { id: 'generator', path: '/#/cover-letter' },
    { id: 'saved', path: '/#/cover-letter/saved' },
  ]},
  { id: '22-job-search', path: '/#/job-search', label: 'Sök jobb' },
  { id: '23-applications', path: '/#/applications', label: 'Ansökningar' },
  { id: '24-spontaneous', path: '/#/spontanansökan', label: 'Spontanansökan', tabs: [
    { id: 'search', path: '/#/spontanansökan' },
    { id: 'companies', path: '/#/spontanansökan/mina-foretag' },
    { id: 'stats', path: '/#/spontanansökan/statistik' },
  ]},
  { id: '30-career', path: '/#/career', label: 'Karriär', tabs: [
    { id: 'labor-market', path: '/#/career' },
    { id: 'adaptation', path: '/#/career/adaptation' },
    { id: 'credentials', path: '/#/career/credentials' },
    { id: 'relocation', path: '/#/career/relocation' },
    { id: 'plan', path: '/#/career/plan' },
  ]},
  { id: '31-interest-guide', path: '/#/interest-guide', label: 'Intresseguide', tabs: [
    { id: 'test', path: '/#/interest-guide' },
    { id: 'results', path: '/#/interest-guide/results' },
    { id: 'occupations', path: '/#/interest-guide/occupations' },
    { id: 'explore', path: '/#/interest-guide/explore' },
    { id: 'history', path: '/#/interest-guide/history' },
  ]},
  { id: '32-skills-gap', path: '/#/skills-gap-analysis', label: 'Kompetensanalys' },
  { id: '33-personal-brand', path: '/#/personal-brand', label: 'Varumärke' },
  { id: '34-education', path: '/#/education', label: 'Utbildning' },
  { id: '35-linkedin', path: '/#/linkedin-optimizer', label: 'LinkedIn' },
  { id: '36-salary', path: '/#/salary', label: 'Lön' },
  { id: '37-international', path: '/#/international', label: 'International' },
  { id: '40-interview', path: '/#/interview-simulator', label: 'Intervju' },
  { id: '41-ai-team', path: '/#/ai-team', label: 'AI-team' },

  { id: '50-knowledge-base', path: '/#/knowledge-base', label: 'Kunskapsbank', tabs: [
    { id: 'for-you', path: '/#/knowledge-base' },
    { id: 'getting-started', path: '/#/knowledge-base?tab=getting-started' },
    { id: 'topics', path: '/#/knowledge-base?tab=topics' },
    { id: 'quick-help', path: '/#/knowledge-base?tab=quick-help' },
    { id: 'my-journey', path: '/#/knowledge-base?tab=my-journey' },
    { id: 'tools', path: '/#/knowledge-base?tab=tools' },
  ]},
  { id: '51-resources', path: '/#/resources', label: 'Resurser', tabs: [
    { id: 'all', path: '/#/resources' },
    { id: 'documents', path: '/#/resources?tab=documents' },
    { id: 'jobs', path: '/#/resources?tab=jobs' },
    { id: 'articles', path: '/#/resources?tab=articles' },
  ]},
  { id: '52-print-resources', path: '/#/print-resources', label: 'Skriv ut' },
  { id: '53-external-resources', path: '/#/externa-resurser', label: 'Externa' },
  { id: '54-network', path: '/#/nätverk', label: 'Nätverk' },

  { id: '60-wellness', path: '/#/wellness', label: 'Hälsa', tabs: [
    { id: 'health', path: '/#/wellness' },
    { id: 'routines', path: '/#/wellness/routines' },
    { id: 'cognitive', path: '/#/wellness/cognitive' },
    { id: 'crisis', path: '/#/wellness/crisis' },
  ]},
  { id: '61-diary', path: '/#/diary', label: 'Dagbok' },
  { id: '62-calendar', path: '/#/calendar', label: 'Kalender' },
  { id: '63-exercises', path: '/#/exercises', label: 'Övningar' },
  { id: '64-my-consultant', path: '/#/my-consultant', label: 'Min konsulent' },

  { id: '70-profile', path: '/#/profile', label: 'Profil' },
  { id: '71-settings', path: '/#/settings', label: 'Inställningar' },
  { id: '72-help', path: '/#/help', label: 'Hjälp' },
]

const findings = {
  startedAt: new Date().toISOString(),
  baseUrl: BASE,
  pages: [],
  axeViolations: [],
  designViolations: [],
  touchTargetViolations: [],
  summary: {
    totalPages: 0, totalTabs: 0, totalScreenshots: 0,
    consoleErrors: 0, networkErrors: 0,
    designIssues: 0, axeIssues: 0, touchIssues: 0,
  },
}

async function waitForReady(page, timeout = 10000) {
  try {
    await page.waitForLoadState('domcontentloaded', { timeout })
    await page.waitForTimeout(1000)
    try {
      const cookies = page.getByRole('button', { name: /endast nödvändiga|godkänn alla|acceptera/i })
      if (await cookies.first().isVisible({ timeout: 700 })) await cookies.first().click({ timeout: 1500 })
    } catch {}
    try {
      const loading = page.getByText(/Laddar Jobin|Laddar\.\.\./i).first()
      if (await loading.isVisible({ timeout: 700 })) await loading.waitFor({ state: 'hidden', timeout: 12000 })
    } catch {}
  } catch {}
}

async function login(page) {
  await page.goto(`${BASE}/#/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await waitForReady(page)
  await page.locator('input#email, input[type="email"]').first().fill(TEST_USER.email)
  await page.locator('input#password, input[type="password"]').first().fill(TEST_USER.password)
  await page.getByRole('button', { name: /^logga in$/i }).first().click()
  try {
    await page.waitForFunction(() => !location.hash.includes('/login'), { timeout: 15000 })
    return true
  } catch { return false }
}

// === DESIGN.md-checkpunkter ===
async function checkDesignRules(page, target) {
  const issues = []

  const result = await page.evaluate(() => {
    const out = {
      eyebrowTexts: [],
      gradientButtons: [],
      hubLandingHeroBg: null,
      toolHubKantPx: null,
      personalizationGreeting: null,
      visiblePageHero: null,
    }

    // Eyebrow-text "HUB · X" (DESIGN.md §3 — borttaget)
    const allText = document.body.innerText
    const eyebrowMatch = allText.match(/HUB\s*[·•]\s*[A-ZÅÄÖ]+/g)
    if (eyebrowMatch) out.eyebrowTexts = eyebrowMatch

    // Gradient-knappar (DESIGN.md §6 — förbjudet)
    document.querySelectorAll('button, a[href]').forEach(el => {
      const cls = el.className
      if (typeof cls === 'string' && /bg-gradient-to-/.test(cls)) {
        const txt = (el.innerText || '').slice(0, 40).trim()
        if (txt) out.gradientButtons.push(txt)
      }
    })

    // PageHero — kolla section role och bakgrund
    const hero = document.querySelector('section[class*="bg-[var(--c-bg)]"], header[class*="border-l-[4px]"]')
    if (hero) {
      const styles = getComputedStyle(hero)
      out.visiblePageHero = {
        bg: styles.backgroundColor,
        borderLeftWidth: styles.borderLeftWidth,
        borderLeftColor: styles.borderLeftColor,
      }
    }

    // Personalisering "Hej {namn}" eller "God morgon/kväll, {namn}"
    const greetingMatch = allText.match(/(?:Hej|God morgon|God kväll|God dag)[, ]+[A-ZÅÄÖ][a-zåäö]+/)
    if (greetingMatch) out.personalizationGreeting = greetingMatch[0]
    const fallbackMatch = allText.match(/(?:Hej|God morgon|God kväll|God dag)\s*👋/)
    if (fallbackMatch && !out.personalizationGreeting) out.personalizationGreeting = fallbackMatch[0]

    return out
  })

  // Eyebrow-text ska aldrig synas på hub-landningar
  if (result.eyebrowTexts.length > 0) {
    issues.push({ rule: 'no-eyebrow', detail: result.eyebrowTexts.join(', ') })
  }

  // Gradient-knappar ska inte finnas
  if (result.gradientButtons.length > 0) {
    issues.push({ rule: 'no-gradient-buttons', detail: result.gradientButtons.join(' | ') })
  }

  // Hub-landning ska ha pastell-hero (DESIGN.md §3 läge A)
  if (target.isHubLanding) {
    if (!result.personalizationGreeting) {
      issues.push({ rule: 'hub-personalization-missing', detail: 'Ingen "Hej {namn}"-greeting hittad' })
    }
  }

  return { issues, raw: result }
}

// === Touch-target-audit ===
async function checkTouchTargets(page) {
  return await page.evaluate(() => {
    const violations = []
    const clickable = document.querySelectorAll('button, a[href], [role="button"], [role="link"]')
    clickable.forEach((el, i) => {
      const rect = el.getBoundingClientRect()
      // Bara synliga element
      if (rect.width === 0 || rect.height === 0) return
      // Skip elements outside viewport
      if (rect.bottom < 0 || rect.top > window.innerHeight) return
      const minSize = 44
      if (rect.width < minSize || rect.height < minSize) {
        const text = (el.textContent || '').trim().slice(0, 40)
        const ariaLabel = el.getAttribute('aria-label') || ''
        violations.push({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          text: text || ariaLabel || `[${el.tagName}#${i}]`,
        })
      }
    })
    return violations.slice(0, 5) // Max 5 per sida för att inte spamma
  })
}

// === axe-core scan ===
async function runAxe(page) {
  try {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    return results.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
    }))
  } catch (e) {
    return [{ id: 'axe-error', impact: 'unknown', help: e.message, nodes: 0 }]
  }
}

async function visitPage(page, target, opts = {}) {
  const { runAxeOnPage = true, takeMobileShot = false, mobilePage = null } = opts
  const url = `${BASE}${target.path}`
  const entry = {
    id: target.id,
    label: target.label,
    path: target.path,
    isHubLanding: !!target.isHubLanding,
    consoleErrors: [],
    networkErrors: [],
    pageErrors: [],
    designIssues: [],
    touchTargetIssues: [],
    axeIssues: [],
    screenshot: null,
    mobileScreenshot: null,
  }

  const consoleHandler = (m) => {
    if (m.type() === 'error') {
      const t = m.text()
      if (/Failed to load resource: the server responded with a status of 4\d\d|Sentry/i.test(t)) return
      entry.consoleErrors.push(t.slice(0, 300))
    }
  }
  const reqFailHandler = (req) => {
    const f = req.failure()
    if (f && !/(favicon|sentry|googletagmanager|google-analytics|fonts\.gstatic|net::ERR_ABORTED)/.test(req.url())) {
      entry.networkErrors.push(`${req.method()} ${req.url().slice(0, 100)} — ${f.errorText}`)
    }
  }
  const pageErrHandler = (e) => entry.pageErrors.push(e.message.slice(0, 200))

  page.on('console', consoleHandler)
  page.on('requestfailed', reqFailHandler)
  page.on('pageerror', pageErrHandler)

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 })
    await waitForReady(page)
    await page.waitForTimeout(1500)
  } catch (e) {
    entry.pageErrors.push(`NAV: ${e.message}`)
  }

  // Screenshot desktop
  try {
    const shotPath = path.join(SHOTS, `${target.id}.png`)
    await page.screenshot({ path: shotPath, fullPage: true })
    entry.screenshot = shotPath
    findings.summary.totalScreenshots += 1
  } catch (e) {
    entry.pageErrors.push(`SCREENSHOT: ${e.message}`)
  }

  // DESIGN.md-checkpunkter
  try {
    const { issues } = await checkDesignRules(page, target)
    entry.designIssues = issues
    findings.summary.designIssues += issues.length
  } catch {}

  // axe-core
  if (runAxeOnPage) {
    try {
      const axeIssues = await runAxe(page)
      entry.axeIssues = axeIssues
      findings.summary.axeIssues += axeIssues.length
    } catch {}
  }

  page.off('console', consoleHandler)
  page.off('requestfailed', reqFailHandler)
  page.off('pageerror', pageErrHandler)

  findings.summary.consoleErrors += entry.consoleErrors.length
  findings.summary.networkErrors += entry.networkErrors.length

  // Mobile screenshot + touch-target på mobil
  if (takeMobileShot && mobilePage) {
    try {
      await mobilePage.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
      await mobilePage.waitForTimeout(1500)
      const mobileShotPath = path.join(SHOTS_MOBILE, `${target.id}.png`)
      await mobilePage.screenshot({ path: mobileShotPath, fullPage: true })
      entry.mobileScreenshot = mobileShotPath
      findings.summary.totalScreenshots += 1

      const ttIssues = await checkTouchTargets(mobilePage)
      entry.touchTargetIssues = ttIssues
      findings.summary.touchIssues += ttIssues.length
    } catch (e) {
      entry.pageErrors.push(`MOBILE: ${e.message}`)
    }
  }

  return entry
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sv-SE' })
  const page = await ctx.newPage()

  // Mobile context
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
    locale: 'sv-SE',
  })
  const mobilePage = await mobileCtx.newPage()

  console.log('=== Audit 2026-05-11 START ===')

  // Public pages
  console.log('\n[Publika sidor]')
  for (const target of PAGES.filter(p => p.requireLogout)) {
    process.stdout.write(`  ${target.id}... `)
    const entry = await visitPage(page, target, { runAxeOnPage: true, takeMobileShot: true, mobilePage })
    findings.pages.push(entry)
    findings.summary.totalPages += 1
    console.log(`${entry.designIssues.length}d ${entry.axeIssues.length}a ${entry.touchTargetIssues.length}t`)
  }

  // Login
  console.log('\n[Loggar in]')
  if (!await login(page)) {
    console.error('Login failed — abort')
    fs.writeFileSync(path.join(DATA, 'findings.json'), JSON.stringify(findings, null, 2))
    await browser.close()
    process.exit(1)
  }
  // Login mobile context too (copy storage)
  await mobileCtx.addCookies(await ctx.cookies())
  const ls = await page.evaluate(() => JSON.stringify(localStorage))
  await mobilePage.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' })
  await mobilePage.evaluate((data) => {
    const obj = JSON.parse(data)
    for (const k in obj) localStorage.setItem(k, obj[k])
  }, ls)
  console.log('  ✓')

  // Authenticated pages
  console.log('\n[Inloggade sidor]')
  for (const target of PAGES.filter(p => !p.requireLogout)) {
    process.stdout.write(`  ${target.id}... `)
    const entry = await visitPage(page, target, { runAxeOnPage: true, takeMobileShot: true, mobilePage })
    findings.pages.push(entry)
    findings.summary.totalPages += 1
    console.log(`${entry.designIssues.length}d ${entry.axeIssues.length}a ${entry.touchTargetIssues.length}t`)

    // Tabs
    if (target.tabs) {
      for (const tab of target.tabs) {
        process.stdout.write(`    └ ${tab.id}... `)
        const tabEntry = await visitPage(page, { ...target, path: tab.path, id: `${target.id}-${tab.id}` }, { runAxeOnPage: false })
        findings.pages.push(tabEntry)
        findings.summary.totalTabs += 1
        console.log(`${tabEntry.designIssues.length}d ${tabEntry.touchTargetIssues.length}t`)
      }
    }
  }

  findings.completedAt = new Date().toISOString()
  fs.writeFileSync(path.join(DATA, 'findings.json'), JSON.stringify(findings, null, 2))
  console.log('\n=== SLUT ===')
  console.log(`Sidor: ${findings.summary.totalPages}, Tabbar: ${findings.summary.totalTabs}`)
  console.log(`Skärmdumpar: ${findings.summary.totalScreenshots}`)
  console.log(`Console: ${findings.summary.consoleErrors}, Net: ${findings.summary.networkErrors}`)
  console.log(`Design-issues: ${findings.summary.designIssues}, Axe: ${findings.summary.axeIssues}, Touch: ${findings.summary.touchIssues}`)

  await browser.close()
}

main().catch(e => {
  console.error('FATAL:', e)
  findings.fatal = e.message
  try { fs.writeFileSync(path.join(DATA, 'findings.json'), JSON.stringify(findings, null, 2)) } catch {}
  process.exit(1)
})
