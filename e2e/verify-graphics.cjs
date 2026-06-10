/**
 * Live-verifiering av de nya grafik-ytorna (Hink A / Fas 5 / Fas 6) mot jobin.se.
 * Loggar in som testdeltagaren, besöker varje yta i LJUST + MÖRKT läge, och
 * kontrollerar att den förväntade illustrationen faktiskt laddat (naturalWidth>0,
 * synlig i viewport). Skärmdumpar allt.
 *
 *   node e2e/verify-graphics.cjs
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const EMAIL = process.env.E2E_EMAIL || 'claude-playwright-test@jobin.se'
const PASSWORD = process.env.E2E_PASSWORD || process.env.TEST_USER_PASSWORD
const BASE_URL = process.env.E2E_BASE_URL || 'https://jobin.se'
const OUT = path.join(__dirname, '..', 'audit-2026-06-06', 'graphics-verify')

// [route, label, expected-illustration-substring, alltid-synlig?]
const SURFACES = [
  ['/diary', 'Dagbok', 'spot-dagbok', true],
  ['/career', 'Karriär', 'spot-karriarbygge', true],
  ['/salary', 'Lön', 'spot-lon', true],
  ['/personal-brand', 'Personligt varumärke', 'spot-varumarke', true],
  ['/international', 'Internationellt', 'spot-internationellt', true],
  ['/interest-guide', 'Intresseguide (resultat)', 'success-intresse', false],
  ['/skills-gap-analysis', 'Kompetensanalys (resultat)', 'success-kompetens', false],
  ['/interview-simulator', 'Intervjusimulator (milstolpe)', 'success-intervju', false],
]

function ts() { return new Date().toISOString().slice(11, 19) }

async function login(ctx) {
  const page = await ctx.newPage()
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' })
  await page.locator('input#email').fill(EMAIL)
  await page.locator('input#password').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 25000 })
  await page.close()
}

async function checkImg(page, sub) {
  return page.evaluate((s) => {
    const img = document.querySelector(`img[src*="${s}"]`)
    if (!img) return { present: false }
    const r = img.getBoundingClientRect()
    const cs = getComputedStyle(img)
    return {
      present: true,
      loaded: img.complete && img.naturalWidth > 0,
      naturalW: img.naturalWidth,
      visible: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05,
      rect: { w: Math.round(r.width), h: Math.round(r.height) },
    }
  }, sub)
}

async function run(theme) {
  const ctx = await chromium.launch().then((b) =>
    b.newContext({
      viewport: { width: 1366, height: 900 },
      locale: 'sv-SE',
      colorScheme: theme,
    }).then((c) => ({ b, c }))
  )
  const { b, c } = ctx
  // Tvinga tema deterministiskt (default är 'system', men sätt explicit ändå).
  await c.addInitScript((t) => { try { localStorage.setItem('theme', t) } catch (e) {} }, theme)
  await login(c)

  const page = await c.newPage()
  const rows = []
  for (const [route, label, sub, always] of SURFACES) {
    let nav = 'ok'
    try {
      await page.goto(`${BASE_URL}/#${route}`, { waitUntil: 'networkidle', timeout: 35000 })
    } catch (e) { nav = 'NAV-ERR' }
    await page.waitForTimeout(2200) // lazy chunks + queries + bild-dekod
    const res = await checkImg(page, sub).catch((e) => ({ present: false, err: String(e).slice(0, 80) }))
    const slug = route.replace(/[^\w]+/g, '_')
    await page.screenshot({ path: path.join(OUT, `${theme}${slug}.png`), fullPage: false }).catch(() => {})

    let verdict
    if (res.present && res.loaded && res.visible) verdict = 'PASS'
    else if (!res.present && !always) verdict = 'SKIP (villkorad — ingen data)'
    else if (res.present && !res.loaded) verdict = 'FAIL (trasig bild)'
    else if (res.present && !res.visible) verdict = 'FAIL (osynlig)'
    else verdict = 'FAIL (saknas i DOM)'
    rows.push({ theme, route, label, sub, always, nav, ...res, verdict })
    console.log(`[${ts()}] ${theme.padEnd(5)} ${route.padEnd(24)} ${verdict}`)
  }
  await b.close()
  return rows
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  console.log(`Verifierar grafik mot ${BASE_URL} som ${EMAIL}\n`)
  const light = await run('light')
  const dark = await run('dark')
  const all = [...light, ...dark]
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(all, null, 2))

  console.log('\n=== SAMMANFATTNING ===')
  for (const r of all) {
    console.log(`${r.theme.padEnd(5)} ${r.label.padEnd(32)} ${r.verdict}`)
  }
  const fails = all.filter((r) => r.verdict.startsWith('FAIL'))
  console.log(`\n${all.length} kontroller, ${fails.length} FAIL. Skärmdumpar -> ${OUT}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
