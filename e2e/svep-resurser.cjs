/**
 * Visuellt svep över `/resources` med påhittad men prod-formad data.
 *
 *   node e2e/svep-resurser.cjs [bredd] [--mork] [--tom]
 *   BASE_URL=https://www.jobin.se node e2e/svep-resurser.cjs   (utan mockar)
 *
 * Testkontot är tomt, så mot dev mockas `saved_jobs`, `cover_letters`,
 * `article_bookmarks`, `articles` och `cv_versions` via `page.route`. Utan det
 * renderas bara tomtillståndet och ingenting av det som ska granskas syns.
 *
 * Fixturen bär ETT jobb per status i prods check constraint — inte bara de
 * fem som den gamla koden kände till — just för att en okänd status ska
 * synas som okänd i stället för som en tom bricka.
 *
 * `--tom` kör utan mockar mot dev och fotograferar tomtillstånden per flik.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const BAS = process.env.BASE_URL || 'http://localhost:3000'
const bredd = Number(process.argv[2] || 1440)
const mork = process.argv.includes('--mork')
const tom = process.argv.includes('--tom')
const hojd = bredd < 700 ? 900 : 1100

const STATUSAR = [
  'SAVED', 'INTERESTED', 'APPLIED', 'SCREENING', 'PHONE',
  'ASSESSMENT', 'INTERVIEW', 'OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN',
]

const JOBB = STATUSAR.map((status, i) => ({
  id: `job-${i}`,
  user_id: 'u1',
  job_id: `af-${i}`,
  status,
  created_at: `2026-08-${String(i + 1).padStart(2, '0')}T09:00:00Z`,
  job_data: {
    headline: `${status.charAt(0)}${status.slice(1).toLowerCase()} — testtjänst ${i + 1}`,
    employer: { name: 'Testföretaget AB' },
    workplace_address: { municipality: 'Sigtuna' },
    description: { text: 'En påhittad annonstext för svepet.' },
    webpage_url: 'https://arbetsformedlingen.se/',
  },
}))
// Ett värde som INTE finns i konstrainten — vakten mot tom bricka.
JOBB.push({
  id: 'job-x', user_id: 'u1', job_id: 'af-x', status: 'NAGOT_NYTT',
  created_at: '2026-08-20T09:00:00Z',
  job_data: { headline: 'Okänd status — testtjänst', employer: { name: 'Testföretaget AB' } },
})

const BREV = [
  { id: 'b1', user_id: 'u1', title: 'Ansökan till Testföretaget', company: 'Testföretaget AB', job_title: 'Lagerarbetare', content: 'Hej!\n\nJag söker tjänsten.\n\nVänliga hälsningar', created_at: '2026-08-10T09:00:00Z', ai_generated: true },
  { id: 'b2', user_id: 'u1', title: 'Spontanansökan', company: 'Annat AB', content: 'Hej!\n\nJag hörde av mig spontant.', created_at: '2026-08-12T09:00:00Z', ai_generated: false },
]

const VERSIONER = [
  { id: '11111111-1111-4111-8111-111111111111', user_id: 'u1', name: 'Version 1 — vårdbiträde', created_at: '2026-08-01T09:00:00Z', updated_at: '2026-08-01T09:00:00Z',
    data: { firstName: 'Sara', lastName: 'Testsson', title: 'Vårdbiträde', workExperience: [{ title: 'Undersköterska', company: 'Vårdbolaget' }], education: [{ degree: 'Vård och omsorg', school: 'Komvux' }], skills: [{ id: 's1', name: 'Omvårdnad' }] } },
  { id: '22222222-2222-4222-8222-222222222222', user_id: 'u1', name: 'Version 2 — lager', created_at: '2026-08-05T09:00:00Z', updated_at: '2026-08-05T09:00:00Z',
    data: { firstName: 'Sara', lastName: 'Testsson', title: 'Lagermedarbetare', workExperience: [], education: [], skills: [] } },
]

const BOKMARKEN = [{ article_id: 'ny-i-sverige', user_id: 'u1', created_at: '2026-08-01T09:00:00Z' }]
const ARTIKLAR = [{ id: 'a1', slug: 'ny-i-sverige', title: 'Ny i Sverige — så kommer du igång', category_key: 'digital-presence', reading_time: 6, summary: 'Kort sammanfattning.' }]

function laddaEnv() {
  const env = {}
  for (const rad of fs.readFileSync(path.join(ROOT, '.env.test.local'), 'utf-8').split(/\r?\n/)) {
    const m = rad.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

async function stangKakor(page) {
  try {
    const b = page.getByRole('button', { name: /endast nödvändiga|acceptera/i }).first()
    if (await b.isVisible({ timeout: 1200 })) { await b.click(); await page.waitForTimeout(200) }
  } catch { /* ingen kakruta */ }
}
async function stangRundtur(page) {
  for (const n of [/hoppa över/i, /^stäng$/i]) {
    try {
      const b = page.getByRole('button', { name: n }).first()
      if (await b.isVisible({ timeout: 600 })) { await b.click(); await page.waitForTimeout(400); return }
    } catch { /* ingen rundtur */ }
  }
}

async function mocka(page) {
  const svar = (body) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  await page.route(/\/rest\/v1\/saved_jobs/, (r) => r.fulfill(svar(JOBB)))
  await page.route(/\/rest\/v1\/cover_letters/, (r) => r.fulfill(svar(BREV)))
  await page.route(/\/rest\/v1\/cv_versions/, (r) => r.fulfill(svar(VERSIONER)))
  await page.route(/\/rest\/v1\/article_bookmarks/, (r) => r.fulfill(svar(BOKMARKEN)))
  await page.route(/\/rest\/v1\/articles/, (r) => r.fulfill(svar(ARTIKLAR)))
}

;(async () => {
  const env = laddaEnv()
  const suffix = `${bredd}${mork ? '-mork' : ''}${tom ? '-tom' : ''}`
  const utDir = path.join(__dirname, 'screenshots', `resurser-${suffix}`)
  fs.mkdirSync(utDir, { recursive: true })
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: bredd, height: hojd },
    deviceScaleFactor: 1,
    colorScheme: mork ? 'dark' : 'light',
  })
  const page = await context.newPage()
  const fel = []
  page.on('pageerror', (e) => fel.push('PAGEERROR ' + e.message.slice(0, 220)))
  page.on('console', (m) => { if (m.type() === 'error') fel.push('CONSOLE ' + m.text().slice(0, 220)) })

  await page.goto(`${BAS}/#/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await stangKakor(page)
  await page.locator('input#email').waitFor({ state: 'visible', timeout: 20000 })
  await page.locator('input#email').fill(env.TEST_USER_EMAIL)
  await page.locator('input#password').fill(env.TEST_USER_PASSWORD)
  await page.getByRole('button', { name: /logga in/i }).first().click()
  await page.waitForTimeout(3500)
  await stangRundtur(page)

  if (!tom) await mocka(page)

  const flikar = [
    ['01-alla', '/#/resources?tab=all'],
    ['02-dokument', '/#/resources?tab=documents'],
    ['03-jobb', '/#/resources?tab=jobs'],
    ['04-artiklar', '/#/resources?tab=articles'],
  ]

  for (const [namn, vag] of flikar) {
    await page.goto(`${BAS}${vag}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2600)
    const h1 = await page.locator('h1').first().textContent().catch(() => '')
    const hscroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    // Fynden från granskningen, mätta direkt i DOM:en.
    const matt = await page.evaluate(() => ({
      undefinedIKlass: document.querySelectorAll('[class*="undefined"]').length,
      tommaBrickor: Array.from(document.querySelectorAll('span.rounded-full')).filter((e) => !e.textContent.trim()).length,
      dialog: document.querySelectorAll('[role="dialog"]').length,
      flikEtiketter: Array.from(document.querySelectorAll('nav [aria-current]')).map((e) => e.textContent.trim()),
      sektionsrubriker: Array.from(document.querySelectorAll('main h2, h2')).map((e) => e.textContent.trim()).slice(0, 8),
      namnlosaKnappar: Array.from(document.querySelectorAll('button')).filter((b) => !b.textContent.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')).length,
    }))
    await page.screenshot({ path: path.join(utDir, `${namn}.png`), fullPage: false })
    console.log(`bild: ${namn}  h1="${(h1 || '').trim()}" hscroll=${hscroll}`)
    console.log(`      undefined-i-klass=${matt.undefinedIKlass} tomma-brickor=${matt.tommaBrickor} namnlösa-knappar=${matt.namnlosaKnappar}`)
    console.log(`      flikar=${JSON.stringify(matt.flikEtiketter)}`)
    console.log(`      h2=${JSON.stringify(matt.sektionsrubriker)}`)
  }

  // Modalen: öppnas, får role/aria, och stängs med Escape.
  if (!tom) {
    await page.goto(`${BAS}/#/resources?tab=jobs`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2600)
    const visa = page.getByRole('button', { name: /Visa detaljer för/ }).first()
    if (await visa.count()) {
      await visa.focus()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(700)
      const m = await page.evaluate(() => {
        const d = document.querySelector('[role="dialog"]')
        return {
          finns: !!d,
          ariaModal: d?.getAttribute('aria-modal'),
          harEtikett: !!d?.getAttribute('aria-labelledby'),
          fokusInne: !!(d && document.activeElement && d.contains(document.activeElement)),
        }
      })
      await page.screenshot({ path: path.join(utDir, '05-modal.png') })
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
      const kvar = await page.locator('[role="dialog"]').count()
      console.log(`modal: ${JSON.stringify(m)} escape-stänger=${kvar === 0}`)
    } else {
      console.log('modal: knappen hittades inte')
    }
  }

  console.log('\n--- unika konsolfel ---')
  ;[...new Set(fel)].forEach((f) => console.log('  ' + f))
  await browser.close()
})()
