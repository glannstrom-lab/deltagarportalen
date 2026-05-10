/**
 * Comprehensive Production Audit — jobin.se
 * Tests every page, every tab, every major interactive element.
 *
 * Output: audit-2026-05-10/data/findings.json + screenshots/<page>.png
 */
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const BASE = 'https://jobin.se'
const OUT = path.join(__dirname)
const SHOTS = path.join(OUT, 'screenshots')
const DATA = path.join(OUT, 'data')

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'claude-playwright-test@jobin.se',
  password: process.env.TEST_USER_PASSWORD || 'HjFxMLjrXzjHhOqS33j9vPzq',
}

// All pages to audit. `tabs` = sub-paths to try after main page. `clicks` = labels to click and screenshot.
const PAGES = [
  { id: '01-landing-public', path: '/', requireLogout: true, label: 'Landningssida (utloggad)' },
  { id: '02-login', path: '/#/login', requireLogout: true, label: 'Inloggning' },
  { id: '03-register', path: '/#/register', requireLogout: true, label: 'Registrering' },
  { id: '04-privacy', path: '/#/privacy', requireLogout: true, label: 'Integritetspolicy' },
  { id: '05-terms', path: '/#/terms', requireLogout: true, label: 'Användarvillkor' },
  { id: '06-ai-policy', path: '/#/ai-policy', requireLogout: true, label: 'AI-policy' },

  // Hubs (after login)
  { id: '10-dashboard', path: '/#/', label: 'Dashboard' },
  { id: '11-hub-oversikt', path: '/#/oversikt', label: 'Hub: Översikt' },
  { id: '11b-hub-oversikt-historik', path: '/#/oversikt/historik', label: 'Hub: Översikt - Historik' },
  { id: '12-hub-jobb', path: '/#/jobb', label: 'Hub: Söka jobb' },
  { id: '13-hub-karriar', path: '/#/karriar', label: 'Hub: Karriär' },
  { id: '14-hub-resurser', path: '/#/resurser', label: 'Hub: Resurser' },
  { id: '15-hub-vardag', path: '/#/min-vardag', label: 'Hub: Min vardag' },

  // CV
  { id: '20-cv', path: '/#/cv', label: 'CV - Skapa', tabs: [
    { id: 'create', path: '/#/cv' },
    { id: 'my-cvs', path: '/#/cv/my-cvs' },
    { id: 'adapt', path: '/#/cv/adapt' },
    { id: 'ats', path: '/#/cv/ats' },
    { id: 'tips', path: '/#/cv/tips' },
  ]},

  // Cover Letter
  { id: '21-cover-letter', path: '/#/cover-letter', label: 'Personligt brev', tabs: [
    { id: 'generator', path: '/#/cover-letter' },
    { id: 'saved', path: '/#/cover-letter/saved' },
  ]},

  // Job Search & Applications
  { id: '22-job-search', path: '/#/job-search', label: 'Sök jobb' },
  { id: '23-applications', path: '/#/applications', label: 'Ansökningar' },
  { id: '24-spontaneous', path: '/#/spontanansökan', label: 'Spontanansökan', tabs: [
    { id: 'search', path: '/#/spontanansökan' },
    { id: 'companies', path: '/#/spontanansökan/mina-foretag' },
    { id: 'stats', path: '/#/spontanansökan/statistik' },
  ]},

  // Career
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
  { id: '33-personal-brand', path: '/#/personal-brand', label: 'Personligt varumärke' },
  { id: '34-education', path: '/#/education', label: 'Utbildning' },
  { id: '35-linkedin', path: '/#/linkedin-optimizer', label: 'LinkedIn-optimerare' },
  { id: '36-salary', path: '/#/salary', label: 'Lönestatistik' },
  { id: '37-international', path: '/#/international', label: 'International' },

  // AI & Tools
  { id: '40-interview', path: '/#/interview-simulator', label: 'Intervjusimulator' },
  { id: '41-ai-team', path: '/#/ai-team', label: 'AI-team' },

  // Resources
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
  { id: '52-print-resources', path: '/#/print-resources', label: 'Utskrivbara resurser' },
  { id: '53-external-resources', path: '/#/externa-resurser', label: 'Externa resurser' },
  { id: '54-network', path: '/#/nätverk', label: 'Nätverk' },

  // Min vardag
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

  // Profile / Settings
  { id: '70-profile', path: '/#/profile', label: 'Profil' },
  { id: '71-settings', path: '/#/settings', label: 'Inställningar' },
  { id: '72-help', path: '/#/help', label: 'Hjälp' },
]

const findings = {
  startedAt: new Date().toISOString(),
  baseUrl: BASE,
  pages: [],
  globalErrors: [],
  summary: { totalPages: 0, totalTabs: 0, totalErrors: 0, totalScreenshots: 0 },
}

function record(pageId, kind, message, extra = {}) {
  findings.globalErrors.push({ pageId, kind, message, ts: new Date().toISOString(), ...extra })
  findings.summary.totalErrors += 1
}

async function waitForReady(page, timeout = 8000) {
  try {
    await page.waitForLoadState('domcontentloaded', { timeout })
    await page.waitForTimeout(800)
    // dismiss cookie consent
    try {
      const cookies = page.getByRole('button', { name: /endast nödvändiga|godkänn alla|acceptera/i })
      if (await cookies.first().isVisible({ timeout: 700 })) {
        await cookies.first().click({ timeout: 1500 })
        await page.waitForTimeout(300)
      }
    } catch {}
    // wait for "Laddar Jobin..." to disappear if present
    try {
      const loading = page.getByText(/Laddar Jobin|Laddar\.\.\./i).first()
      if (await loading.isVisible({ timeout: 700 })) {
        await loading.waitFor({ state: 'hidden', timeout: 12000 })
      }
    } catch {}
  } catch (e) {
    // continue anyway
  }
}

async function login(page) {
  console.log('  → Loggar in...')
  await page.goto(`${BASE}/#/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await waitForReady(page)
  await page.locator('input#email, input[type="email"]').first().fill(TEST_USER.email)
  await page.locator('input#password, input[type="password"]').first().fill(TEST_USER.password)
  await page.getByRole('button', { name: /^logga in$/i }).first().click()
  // wait for redirect away from login
  try {
    await page.waitForFunction(() => !location.hash.includes('/login'), { timeout: 15000 })
    console.log('  ✓ Inloggad')
    return true
  } catch {
    console.log('  ✗ Inloggning misslyckades')
    return false
  }
}

async function logout(page) {
  // try to logout by going directly to login route after clearing storage
  await page.evaluate(() => {
    try { localStorage.clear() } catch {}
    try { sessionStorage.clear() } catch {}
  })
  await page.context().clearCookies()
}

async function visitAndCapture(page, target, options = {}) {
  const { screenshotName, recordEntry, fullPage = true } = options
  const url = `${BASE}${target.path}`
  const errors = []
  const consoleErrors = []
  const networkErrors = []

  const consoleHandler = (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      // Filter known noise
      if (/Failed to load resource: the server responded with a status of 4\d\d/.test(text)) return
      if (/Sentry/i.test(text)) return
      consoleErrors.push(text.slice(0, 500))
    }
  }
  const requestFailedHandler = (req) => {
    const failure = req.failure()
    if (failure && !/(favicon|sentry|googletagmanager|google-analytics|fonts\.gstatic)/.test(req.url())) {
      networkErrors.push(`${req.method()} ${req.url()} — ${failure.errorText}`)
    }
  }
  const pageErrorHandler = (err) => {
    errors.push(`PAGE ERROR: ${err.message}`)
  }

  page.on('console', consoleHandler)
  page.on('requestfailed', requestFailedHandler)
  page.on('pageerror', pageErrorHandler)

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await waitForReady(page)
    await page.waitForTimeout(1500) // let lazy components render
  } catch (e) {
    errors.push(`NAV: ${e.message}`)
  }

  // Capture screenshot
  let shotPath = null
  if (screenshotName) {
    shotPath = path.join(SHOTS, `${screenshotName}.png`)
    try {
      await page.screenshot({ path: shotPath, fullPage })
      findings.summary.totalScreenshots += 1
    } catch (e) {
      errors.push(`SCREENSHOT: ${e.message}`)
    }
  }

  // Detect error boundary / 404 / blank page
  const bodyText = await page.locator('body').innerText().catch(() => '')
  const detectedIssues = []
  if (/Något gick fel|Ett fel uppstod|Error Boundary|application error/i.test(bodyText)) {
    detectedIssues.push('Error boundary visas')
  }
  if (bodyText.length < 80 && !target.path.includes('print')) {
    detectedIssues.push(`Blank/tom sida (${bodyText.length} tecken)`)
  }
  if (/404|Sidan kunde inte hittas|Page not found/i.test(bodyText)) {
    detectedIssues.push('404 visas')
  }

  page.off('console', consoleHandler)
  page.off('requestfailed', requestFailedHandler)
  page.off('pageerror', pageErrorHandler)

  if (recordEntry) {
    recordEntry.url = url
    recordEntry.bodyLength = bodyText.length
    recordEntry.consoleErrors = consoleErrors
    recordEntry.networkErrors = networkErrors
    recordEntry.pageErrors = errors
    recordEntry.detectedIssues = detectedIssues
    recordEntry.screenshot = shotPath
    findings.summary.totalErrors += consoleErrors.length + networkErrors.length + errors.length + detectedIssues.length
  }

  return { errors, consoleErrors, networkErrors, detectedIssues, bodyText }
}

async function auditPage(page, target) {
  console.log(`\n[${target.id}] ${target.label} ${target.path}`)
  const entry = {
    id: target.id,
    label: target.label,
    path: target.path,
    tabs: [],
    interactions: [],
  }
  findings.pages.push(entry)
  findings.summary.totalPages += 1

  // Main page
  await visitAndCapture(page, target, { screenshotName: target.id, recordEntry: entry })
  if (entry.consoleErrors.length || entry.networkErrors.length || entry.pageErrors.length || entry.detectedIssues.length) {
    console.log(`  ⚠ ${entry.consoleErrors.length} console / ${entry.networkErrors.length} net / ${entry.pageErrors.length} page / ${entry.detectedIssues.length} detected`)
  } else {
    console.log(`  ✓ ren`)
  }

  // Tabs
  if (target.tabs && target.tabs.length) {
    for (const tab of target.tabs) {
      findings.summary.totalTabs += 1
      const tabEntry = { id: tab.id, path: tab.path }
      entry.tabs.push(tabEntry)
      const sub = { ...target, path: tab.path }
      await visitAndCapture(page, sub, {
        screenshotName: `${target.id}-tab-${tab.id}`,
        recordEntry: tabEntry,
      })
      if (tabEntry.consoleErrors.length || tabEntry.networkErrors.length || tabEntry.pageErrors.length || tabEntry.detectedIssues.length) {
        console.log(`    ⚠ tab ${tab.id}: ${tabEntry.consoleErrors.length}c/${tabEntry.networkErrors.length}n/${tabEntry.pageErrors.length}p/${tabEntry.detectedIssues.length}d`)
      } else {
        console.log(`    ✓ tab ${tab.id}`)
      }
    }
  }
}

async function auditInteractions(page, browser) {
  console.log('\n=== Interaktioner: kärnflöden ===')

  // 1) CV-byggare: skapa nytt CV och fyll i basinfo
  console.log('\n[INT-CV-CREATE] CV-byggare: starta nytt CV')
  try {
    await page.goto(`${BASE}/#/cv`, { waitUntil: 'domcontentloaded' })
    await waitForReady(page)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: path.join(SHOTS, 'int-cv-1-start.png'), fullPage: true })
    // Try to find a "Skapa nytt CV" or template selection button
    const cta = page.getByRole('button', { name: /skapa.*cv|nytt cv|skapa nytt|kom igång|välj mall|starta/i }).first()
    if (await cta.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cta.click({ timeout: 5000 }).catch(() => {})
      await page.waitForTimeout(2000)
      await page.screenshot({ path: path.join(SHOTS, 'int-cv-2-template.png'), fullPage: true })
    } else {
      record('int-cv', 'INFO', 'Hittade inget tydligt "Skapa CV"-CTA på /cv')
    }
  } catch (e) {
    record('int-cv', 'ERROR', `CV-flöde: ${e.message}`)
  }

  // 2) Cover Letter: open generator and check form
  console.log('\n[INT-COVER] Personligt brev')
  try {
    await page.goto(`${BASE}/#/cover-letter`, { waitUntil: 'domcontentloaded' })
    await waitForReady(page)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: path.join(SHOTS, 'int-cover-1.png'), fullPage: true })
    const inputs = await page.locator('textarea, input[type="text"]').count()
    record('int-cover', 'INFO', `Cover letter: ${inputs} input-fält hittade`)
  } catch (e) {
    record('int-cover', 'ERROR', `Cover-letter-flöde: ${e.message}`)
  }

  // 3) Interview simulator: open and check that it loads
  console.log('\n[INT-INTERVIEW] Intervjusimulator')
  try {
    await page.goto(`${BASE}/#/interview-simulator`, { waitUntil: 'domcontentloaded' })
    await waitForReady(page)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: path.join(SHOTS, 'int-interview.png'), fullPage: true })
  } catch (e) {
    record('int-interview', 'ERROR', `Intervju: ${e.message}`)
  }

  // 4) Job search: search for "lärare"
  console.log('\n[INT-JOBSEARCH] Jobbsökning')
  try {
    await page.goto(`${BASE}/#/job-search`, { waitUntil: 'domcontentloaded' })
    await waitForReady(page)
    await page.waitForTimeout(2000)
    const search = page.locator('input[type="search"], input[placeholder*="ök"], input[placeholder*="ärm"]').first()
    if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.fill('lärare')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(4000)
    }
    await page.screenshot({ path: path.join(SHOTS, 'int-jobsearch-results.png'), fullPage: true })
  } catch (e) {
    record('int-jobsearch', 'ERROR', `Jobbsökning: ${e.message}`)
  }

  // 5) Spontaneous: search for company
  console.log('\n[INT-SPONTANEOUS] Spontanansökan företagssökning')
  try {
    await page.goto(`${BASE}/#/spontanansökan`, { waitUntil: 'domcontentloaded' })
    await waitForReady(page)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: path.join(SHOTS, 'int-spontaneous.png'), fullPage: true })
  } catch (e) {
    record('int-spontaneous', 'ERROR', `Spontanansökan: ${e.message}`)
  }

  // 6) Diary: try to write entry
  console.log('\n[INT-DIARY] Dagbok')
  try {
    await page.goto(`${BASE}/#/diary`, { waitUntil: 'domcontentloaded' })
    await waitForReady(page)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: path.join(SHOTS, 'int-diary.png'), fullPage: true })
  } catch (e) {
    record('int-diary', 'ERROR', `Dagbok: ${e.message}`)
  }

  // 7) AI Team: open chat
  console.log('\n[INT-AITEAM] AI-team')
  try {
    await page.goto(`${BASE}/#/ai-team`, { waitUntil: 'domcontentloaded' })
    await waitForReady(page)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: path.join(SHOTS, 'int-aiteam.png'), fullPage: true })
  } catch (e) {
    record('int-aiteam', 'ERROR', `AI-team: ${e.message}`)
  }

  // 8) Mobile snapshot of dashboard
  console.log('\n[INT-MOBILE] Mobile-vy av dashboard + hubs')
  try {
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' })
    const mp = await mobile.newPage()
    await mp.context().addCookies(await page.context().cookies())
    // copy localStorage
    const ls = await page.evaluate(() => JSON.stringify(localStorage))
    await mp.goto(`${BASE}/#/`)
    await mp.evaluate((ls) => {
      const data = JSON.parse(ls)
      for (const k in data) localStorage.setItem(k, data[k])
    }, ls)
    for (const url of ['/#/', '/#/oversikt', '/#/jobb', '/#/karriar', '/#/resurser', '/#/min-vardag', '/#/cv', '/#/job-search']) {
      await mp.goto(`${BASE}${url}`)
      await waitForReady(mp)
      await mp.waitForTimeout(1500)
      const slug = url.replace(/[^a-z0-9]/gi, '_').replace(/^_+|_+$/g, '') || 'root'
      await mp.screenshot({ path: path.join(SHOTS, `mobile-${slug}.png`), fullPage: true })
    }
    await mobile.close()
  } catch (e) {
    record('int-mobile', 'ERROR', `Mobile: ${e.message}`)
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'sv-SE',
  })
  const page = await context.newPage()

  // Hook global console listener
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      if (text && !/Failed to load resource: the server responded with a status of 4\d\d|Sentry/i.test(text)) {
        // Per-page errors are captured separately
      }
    }
  })

  console.log('=== AUDIT START ===')

  // Public pages first (no login)
  console.log('\n=== PUBLIKA SIDOR (ej inloggad) ===')
  for (const target of PAGES.filter(p => p.requireLogout)) {
    await auditPage(page, target)
  }

  // Login
  console.log('\n=== LOGGAR IN ===')
  const ok = await login(page)
  if (!ok) {
    record('global', 'FATAL', 'Inloggning misslyckades — avbryter')
    fs.writeFileSync(path.join(DATA, 'findings.json'), JSON.stringify(findings, null, 2))
    await browser.close()
    return
  }

  // Authenticated pages
  console.log('\n=== INLOGGADE SIDOR ===')
  for (const target of PAGES.filter(p => !p.requireLogout)) {
    await auditPage(page, target)
  }

  // Interactions
  await auditInteractions(page, browser)

  findings.completedAt = new Date().toISOString()
  fs.writeFileSync(path.join(DATA, 'findings.json'), JSON.stringify(findings, null, 2))
  console.log('\n=== AUDIT SLUT ===')
  console.log(`Sidor: ${findings.summary.totalPages}, Tabbar: ${findings.summary.totalTabs}, Skärmdumpar: ${findings.summary.totalScreenshots}, Fel: ${findings.summary.totalErrors}`)
  console.log(`Resultat: ${path.join(DATA, 'findings.json')}`)

  await browser.close()
}

main().catch(e => {
  console.error('FATAL:', e)
  findings.fatal = e.message
  try { fs.writeFileSync(path.join(DATA, 'findings.json'), JSON.stringify(findings, null, 2)) } catch {}
  process.exit(1)
})
