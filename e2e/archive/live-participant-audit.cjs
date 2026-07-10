/**
 * Live participant audit against production (jobin.se).
 * Logs in as the test participant and walks every participant route,
 * capturing console errors, uncaught exceptions, failed network calls,
 * untranslated i18n keys, and crash/empty render.
 *
 *   node e2e/live-participant-audit.cjs
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const EMAIL = process.env.E2E_EMAIL || 'claude-playwright-test@jobin.se'
const PASSWORD = process.env.E2E_PASSWORD || process.env.TEST_USER_PASSWORD
const BASE_URL = process.env.E2E_BASE_URL || 'https://jobin.se'
const OUT = path.join(__dirname, '..', 'audit-2026-05-28', 'live')

const ROUTES = [
  ['/', 'Översikt/Dashboard'],
  ['/oversikt', 'Hub: Översikt'],
  ['/jobb', 'Hub: Söka jobb'],
  ['/karriar', 'Hub: Karriär'],
  ['/resurser', 'Hub: Resurser'],
  ['/min-vardag', 'Hub: Min vardag'],
  ['/profile', 'Profil'],
  ['/my-consultant', 'Min konsulent'],
  ['/ai-team', 'AI-team'],
  ['/nätverk', 'Nätverk'],
  ['/knowledge-base', 'Kunskapsbank'],
  ['/resources', 'Mina dokument'],
  ['/cv', 'CV-byggare'],
  ['/cover-letter', 'Personligt brev'],
  ['/wellness', 'Hälsa'],
  ['/diary', 'Dagbok'],
  ['/career', 'Karriär'],
  ['/interest-guide', 'Intresseguide'],
  ['/skills-gap-analysis', 'Kompetensanalys'],
  ['/personal-brand', 'Personligt varumärke'],
  ['/education', 'Utbildning'],
  ['/interview-simulator', 'Intervjusimulator'],
  ['/calendar', 'Kalender'],
  ['/exercises', 'Övningar'],
  ['/job-search', 'Jobbsökning'],
  ['/applications', 'Ansökningar'],
  ['/spontanansökan', 'Spontanansökan'],
  ['/salary', 'Lön'],
  ['/print-resources', 'Utskriftsresurser'],
  ['/externa-resurser', 'Externa resurser'],
  ['/linkedin-optimizer', 'LinkedIn-optimerare'],
  ['/international', 'Internationellt'],
  ['/steg-till-arbete', 'Steg till arbete (STA)'],
]

function ts() { return new Date().toISOString() }

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'sv-SE' })
  const page = await ctx.newPage()

  const report = []          // per-route findings
  let cur = { console: [], pageerr: [], net: [] }

  page.on('console', (msg) => {
    if (msg.type() === 'error') cur.console.push(msg.text().slice(0, 400))
  })
  page.on('pageerror', (err) => cur.pageerr.push(String(err).slice(0, 400)))
  page.on('requestfailed', (req) => {
    const f = req.failure()
    cur.net.push(`FAIL ${req.method()} ${req.url().slice(0, 160)} :: ${f && f.errorText}`)
  })
  page.on('response', (res) => {
    const s = res.status()
    if (s >= 400) cur.net.push(`HTTP ${s} ${res.request().method()} ${res.url().slice(0, 160)}`)
  })

  // ---- LOGIN ----
  console.log(`[${ts()}] login as ${EMAIL} @ ${BASE_URL}`)
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' })
  await page.locator('input#email').fill(EMAIL)
  await page.locator('input#password').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()
  await Promise.race([
    page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 20000 }),
    page.waitForSelector('[role="alert"]', { timeout: 20000 }),
  ]).catch(() => {})
  if (page.url().includes('/login')) {
    const err = await page.locator('[role="alert"]').first().innerText().catch(() => '?')
    console.error('LOGIN FAILED:', err)
    fs.writeFileSync(path.join(OUT, 'LOGIN-FAILED.txt'), err)
    await browser.close()
    process.exit(1)
  }
  console.log(`[${ts()}] logged in -> ${page.url()}`)

  // ---- WALK ROUTES ----
  for (const [route, label] of ROUTES) {
    cur = { console: [], pageerr: [], net: [] }
    const finding = { route, label }
    try {
      await page.goto(`${BASE_URL}/#${route}`, { waitUntil: 'networkidle', timeout: 35000 })
      await page.waitForTimeout(1800) // let lazy chunks + queries settle
    } catch (e) {
      finding.navError = String(e).slice(0, 200)
    }

    // crash / blank detection
    const bodyText = await page.evaluate(() => document.body.innerText || '').catch(() => '')
    finding.textLen = bodyText.length
    finding.blank = bodyText.trim().length < 40
    finding.errorBoundary = /Något gick fel|Oops|Ett fel uppstod|Try again|Error boundary/i.test(bodyText)
    // untranslated i18n keys visible on screen (e.g. "nav.foo", "common.bar")
    const i18nLeaks = (bodyText.match(/\b[a-zA-Z]+\.[a-zA-Z]+(?:\.[a-zA-Z]+)?\b/g) || [])
      .filter((k) => /^(nav|common|dashboard|cv|wellness|diary|career|profile|jobs|sta|ai|resources|knowledge|interview|salary|education|skills|brand|interest|calendar|exercises)\./.test(k))
      .filter((k) => !/\.(js|ts|tsx|png|svg|com|se|io)$/.test(k))
    finding.i18nLeaks = [...new Set(i18nLeaks)].slice(0, 10)

    finding.console = cur.console.slice(0, 8)
    finding.pageerr = cur.pageerr.slice(0, 8)
    finding.net = cur.net.filter((n) => !/sentry|google-analytics|gtag|doubleclick|hotjar/i.test(n)).slice(0, 12)

    const slug = route.replace(/[^\w]+/g, '_') || 'root'
    await page.screenshot({ path: path.join(OUT, `route${slug}.png`), fullPage: false }).catch(() => {})

    const flags = []
    if (finding.navError) flags.push('NAV-ERR')
    if (finding.blank) flags.push('BLANK')
    if (finding.errorBoundary) flags.push('ERROR-BOUNDARY')
    if (finding.pageerr.length) flags.push(`PAGEERR(${finding.pageerr.length})`)
    if (finding.console.length) flags.push(`CONSOLE(${finding.console.length})`)
    if (finding.net.length) flags.push(`NET(${finding.net.length})`)
    if (finding.i18nLeaks.length) flags.push(`I18N(${finding.i18nLeaks.length})`)
    finding.flags = flags
    console.log(`[${ts()}] ${route.padEnd(24)} ${flags.length ? flags.join(' ') : 'ok'} (${finding.textLen}b)`)
    report.push(finding)
  }

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`\nDone. Report -> ${path.join(OUT, 'report.json')}`)
  await browser.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
