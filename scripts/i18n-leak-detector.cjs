/**
 * i18n-läckage-detektor
 *
 * Roadmap-uppgift 0.3 i docs/DESIGN-ROADMAP.md.
 * Bestyrkt av audit 2026-05-10 där `myConsultant.noConsultantFullDesc` läckte
 * till UI på /my-consultant.
 *
 * Loggar in och navigerar genom alla rutter i portalen, plockar `innerText`
 * och hittar strängar som ser ut som oöversatta i18n-keys
 * (t.ex. "myConsultant.noConsultantFullDesc", "auth.welcomeBack").
 *
 * Kör: node scripts/i18n-leak-detector.cjs
 * Utdata: scripts/i18n-leak-report.json
 *
 * Konfiguration:
 *   PLAYWRIGHT_BASE_URL=https://jobin.se   (default)
 *   TEST_USER_EMAIL=...
 *   TEST_USER_PASSWORD=...
 */
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://jobin.se'
const USER = {
  email: process.env.TEST_USER_EMAIL || 'claude-playwright-test@jobin.se',
  password: process.env.TEST_USER_PASSWORD || 'HjFxMLjrXzjHhOqS33j9vPzq',
}

// Rutter att besöka. Subset av audit-skriptets rutter — räcker för i18n-sweep.
const ROUTES = [
  '/#/login',
  '/#/register',
  '/#/privacy',
  '/#/terms',
  '/#/ai-policy',
  '/#/',
  '/#/oversikt',
  '/#/oversikt/historik',
  '/#/jobb',
  '/#/karriar',
  '/#/resurser',
  '/#/min-vardag',
  '/#/cv',
  '/#/cv/my-cvs',
  '/#/cv/adapt',
  '/#/cv/ats',
  '/#/cv/tips',
  '/#/cover-letter',
  '/#/cover-letter/saved',
  '/#/job-search',
  '/#/applications',
  '/#/spontanansökan',
  '/#/spontanansökan/mina-foretag',
  '/#/spontanansökan/statistik',
  '/#/career',
  '/#/career/adaptation',
  '/#/career/credentials',
  '/#/career/relocation',
  '/#/career/plan',
  '/#/interest-guide',
  '/#/interest-guide/results',
  '/#/interest-guide/occupations',
  '/#/interest-guide/explore',
  '/#/interest-guide/history',
  '/#/skills-gap-analysis',
  '/#/personal-brand',
  '/#/education',
  '/#/linkedin-optimizer',
  '/#/salary',
  '/#/international',
  '/#/interview-simulator',
  '/#/ai-team',
  '/#/knowledge-base',
  '/#/knowledge-base?tab=getting-started',
  '/#/knowledge-base?tab=topics',
  '/#/knowledge-base?tab=quick-help',
  '/#/knowledge-base?tab=my-journey',
  '/#/knowledge-base?tab=tools',
  '/#/resources',
  '/#/print-resources',
  '/#/externa-resurser',
  '/#/nätverk',
  '/#/wellness',
  '/#/wellness/routines',
  '/#/wellness/cognitive',
  '/#/wellness/crisis',
  '/#/diary',
  '/#/calendar',
  '/#/exercises',
  '/#/my-consultant',
  '/#/profile',
  '/#/settings',
  '/#/help',
]

// Mönster för en oöversatt i18n-key. Konservativ heuristik:
//   - två eller fler segment åtskilda med punkt
//   - första segmentet är camelCase (lowerCase första bokstav)
//   - segment efter punkt är camelCase eller PascalCase
//   - hela strängen får inte innehålla blanksteg eller skiljetecken (utöver punkt)
//
// Exempel som matchar:
//   myConsultant.noConsultantFullDesc
//   auth.welcomeBack
//   wellness.tabs.healthDesc
//   nav.groups.action
//
// Exempel som INTE matchar (för att undvika falsa positiva):
//   "Du har 3.5 år erfarenhet"  (siffror)
//   "https://example.com"       (URL)
//   "auth.welcomeBack är fint"  (innehåller blanksteg)
const I18N_KEY_REGEX = /^[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)+$/

// Strängar som ser ut som i18n-keys men är legitima (whitelist).
const ALLOWED_LITERALS = new Set([
  'jobin.se', // logotyp / hostname
  'deltagarportalen.se',
  'www.jobin.se',
  // URL:er till externa myndigheter / partners (matchar regex pga punkt-separation)
  'www.imy.se',
  'www.arbetsformedlingen.se',
  'www.bolagsverket.se',
])

async function dismissCookies(page) {
  try {
    const btn = page.getByRole('button', { name: /endast nödvändiga|godkänn alla|acceptera/i }).first()
    if (await btn.isVisible({ timeout: 1000 })) await btn.click({ timeout: 1500 })
  } catch {}
}

async function login(page) {
  await page.goto(`${BASE}/#/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(1500)
  await dismissCookies(page)
  await page.locator('input#email, input[type="email"]').first().fill(USER.email)
  await page.locator('input#password, input[type="password"]').first().fill(USER.password)
  await page.getByRole('button', { name: /^logga in$/i }).first().click()
  await page.waitForFunction(() => !location.hash.includes('/login'), { timeout: 15000 })
}

async function scanRoute(page, route) {
  try {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await page.waitForTimeout(1500)
  } catch (e) {
    return { route, error: e.message, hits: [] }
  }

  const text = await page.locator('body').innerText().catch(() => '')

  // Tokenize på whitespace, sen filter på regex
  const tokens = text.split(/\s+/)
  const seen = new Set()
  const hits = []

  for (const tok of tokens) {
    const cleaned = tok.replace(/[,;:!?()[\]{}"']+$/g, '').replace(/^[,;:!?()[\]{}"']+/g, '')
    if (!cleaned || cleaned.length < 5 || cleaned.length > 80) continue
    if (ALLOWED_LITERALS.has(cleaned)) continue
    if (!I18N_KEY_REGEX.test(cleaned)) continue
    if (seen.has(cleaned)) continue
    seen.add(cleaned)
    hits.push(cleaned)
  }

  return { route, hits }
}

async function main() {
  const startedAt = new Date().toISOString()
  console.log(`[i18n-leak] start ${startedAt} mot ${BASE}`)

  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sv-SE' })
  const page = await ctx.newPage()

  // Publika rutter först (kräver inte inlogg)
  const publicRoutes = ROUTES.filter(r => /\/(login|register|privacy|terms|ai-policy)$/.test(r))
  const authRoutes = ROUTES.filter(r => !publicRoutes.includes(r))

  const results = []
  for (const route of publicRoutes) {
    const r = await scanRoute(page, route)
    results.push(r)
    if (r.hits.length) console.log(`  ⚠ ${route}: ${r.hits.length} träffar`)
  }

  console.log('[i18n-leak] loggar in...')
  try {
    await login(page)
  } catch (e) {
    console.error('[i18n-leak] inloggning misslyckades:', e.message)
    await browser.close()
    process.exit(1)
  }

  for (const route of authRoutes) {
    const r = await scanRoute(page, route)
    results.push(r)
    if (r.hits.length) console.log(`  ⚠ ${route}: ${r.hits.length} träffar`)
  }

  // Aggregera
  const allHits = new Map() // key → [routes]
  for (const r of results) {
    for (const k of r.hits) {
      if (!allHits.has(k)) allHits.set(k, [])
      allHits.get(k).push(r.route)
    }
  }

  const report = {
    startedAt,
    completedAt: new Date().toISOString(),
    baseUrl: BASE,
    routesScanned: results.length,
    routesWithHits: results.filter(r => r.hits.length > 0).length,
    uniqueLeakedKeys: allHits.size,
    leakedKeys: Array.from(allHits.entries())
      .map(([key, routes]) => ({ key, occurrences: routes.length, routes }))
      .sort((a, b) => b.occurrences - a.occurrences),
    perRoute: results,
  }

  const outPath = path.join(__dirname, 'i18n-leak-report.json')
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2))

  console.log()
  console.log(`[i18n-leak] klar. ${report.uniqueLeakedKeys} unika läckande keys på ${report.routesWithHits}/${report.routesScanned} rutter.`)
  console.log(`[i18n-leak] rapport: ${outPath}`)

  if (report.uniqueLeakedKeys > 0) {
    console.log()
    console.log('Top läckande keys:')
    for (const { key, occurrences } of report.leakedKeys.slice(0, 20)) {
      console.log(`  ${occurrences}× ${key}`)
    }
  }

  await browser.close()

  // Exit-kod 0 för CI-användning även om läckor finns. Använd
  // `--strict` för att exit 1 om läckor hittas.
  if (process.argv.includes('--strict') && report.uniqueLeakedKeys > 0) {
    process.exit(1)
  }
}

main().catch(e => {
  console.error('FATAL:', e)
  process.exit(2)
})
