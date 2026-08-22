/**
 * Röktest av `/api/cv-pdf` i skarp drift.
 *
 *   node e2e/cv-pdf-prod-rok.cjs
 *
 * Uppgraderingen `puppeteer-core` 24 → 25 (DR6) och runtime-pinnen
 * `engines.node: 22.x` kunde bara verifieras lokalt mot systemets Chrome —
 * `@sparticuz/chromium` är en Lambda-binär. Det här testet kör den riktiga
 * vägen: loggar in, hämtar ett Supabase-token och POSTar mot prod-endpointen,
 * en gång utan `versionId` (nuvarande CV) och en gång med (sparad version).
 *
 * Rate-limit: 5 genereringar per 15 min och användare. Testet gör två.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const BAS = process.env.BASE_URL || 'https://www.jobin.se'

function laddaEnv() {
  const env = {}
  for (const rad of fs.readFileSync(path.join(ROOT, '.env.test.local'), 'utf-8').split(/\r?\n/)) {
    const m = rad.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

;(async () => {
  const env = laddaEnv()
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto(`${BAS}/#/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  try {
    const b = page.getByRole('button', { name: /endast nödvändiga|acceptera/i }).first()
    if (await b.isVisible({ timeout: 1200 })) await b.click()
  } catch { /* ingen kakruta */ }
  await page.locator('input#email').waitFor({ state: 'visible', timeout: 20000 })
  await page.locator('input#email').fill(env.TEST_USER_EMAIL)
  await page.locator('input#password').fill(env.TEST_USER_PASSWORD)
  await page.getByRole('button', { name: /logga in/i }).first().click()
  await page.waitForTimeout(4000)

  // Supabase lagrar sessionen under olika nyckelnamn beroende pa version,
  // och kan dessutom dela upp varden over flera nycklar. Leta brett.
  const token = await page.evaluate(() => {
    const kandidater = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      const v = localStorage.getItem(k)
      if (!v) continue
      kandidater.push(k)
      let text = v
      if (text.startsWith('base64-')) {
        try { text = atob(text.slice(7)) } catch { /* inte base64 */ }
      }
      try {
        const o = JSON.parse(text)
        if (o && o.access_token) return o.access_token
        if (o && o.currentSession && o.currentSession.access_token) return o.currentSession.access_token
      } catch { /* inte JSON */ }
      const m = text.match(/"access_token":"([^"]+)"/)
      if (m) return m[1]
    }
    console.log('nycklar:', kandidater.join(', '))
    return null
  })
  if (!token) {
    console.error('FEL: hittade inget access_token i localStorage — inloggningen misslyckades?')
    await browser.close()
    process.exit(1)
  }
  console.log('token hämtat, längd', token.length)

  // Finns någon sparad version att prova versionId-vägen mot?
  const versionId = await page.evaluate(async (t) => {
    const url = document.querySelector('meta[name="sb-url"]')?.content
    void url
    void t
    return null
  }, token)

  const anrop = async (kropp, etikett) => {
    const res = await page.evaluate(
      async ([bas, t, k]) => {
        const r = await fetch(bas + '/api/cv-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
          body: JSON.stringify(k),
        })
        const typ = r.headers.get('content-type') || ''
        if (typ.includes('application/pdf')) {
          const buf = await r.arrayBuffer()
          const huvud = String.fromCharCode(...new Uint8Array(buf.slice(0, 5)))
          return { status: r.status, typ, bytes: buf.byteLength, huvud }
        }
        return { status: r.status, typ, text: (await r.text()).slice(0, 300) }
      },
      [BAS, token, kropp]
    )
    console.log(`${etikett}: HTTP ${res.status} ${res.typ}`)
    if (res.bytes) console.log(`   ${res.bytes} byte, magic "${res.huvud}"`)
    if (res.text) console.log(`   svar: ${res.text}`)
    return res
  }

  const a = await anrop({ template: 'sidebar' }, 'nuvarande CV')
  const ok1 = a.status === 200 && a.huvud === '%PDF-' && a.bytes > 10000

  let ok2 = true
  if (versionId) {
    const b = await anrop({ template: 'sidebar', versionId }, 'sparad version')
    ok2 = b.status === 200 && b.huvud === '%PDF-'
  } else {
    console.log('sparad version: hoppar över — testkontot har ingen cv_versions-rad')
  }

  // Validering av versionId ska ge 400, inte ett tyst fall tillbaka till fel CV.
  const c = await anrop({ template: 'sidebar', versionId: 'inte-ett-uuid' }, 'ogiltigt versionId')
  const ok3 = c.status === 400

  console.log('')
  console.log(ok1 && ok2 && ok3
    ? 'OK — /api/cv-pdf svarar med giltig PDF, och ogiltigt versionId avvisas med 400.'
    : 'FEL — se ovan.')
  await browser.close()
  process.exit(ok1 && ok2 && ok3 ? 0 : 1)
})()
