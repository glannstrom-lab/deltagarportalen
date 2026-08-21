/**
 * Visuellt svep över hela portalen efter layoutomläggningen (2026-08-17/18).
 *
 *   node e2e/svep-visuellt.cjs [bredd] [--full]
 *
 * Loggar in en gång, går igenom alla hubbar och verktygssidor, och sparar en
 * skärmbild per sida i e2e/screenshots/svep-<bredd>/. Mäter samtidigt tre tal
 * som annars bara går att tycka om: skenans bredd, innehållets bredd och hur
 * mycket vitt det är ovanför första innehållselementet.
 *
 * BASE_URL styr målet (default http://localhost:3000).
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const BAS = process.env.BASE_URL || 'http://localhost:3000'
const bredd = Number(process.argv[2] || 1440)
const full = process.argv.includes('--full')
const hojd = bredd < 700 ? 844 : 900

const SIDOR = [
  '/career',
  '/career/adaptation',
  '/career/credentials',
  '/career/relocation',
  '/career/plan',
];
const _GAMLA = [
  '/oversikt',
  '/jobb',
  '/karriar',
  '/resurser',
  '/min-vardag',
  '/job-search',
  '/applications',
  '/spontanansökan',
  '/cv',
  '/cover-letter',
  '/interview-simulator',
  '/salary',
  '/linkedin-optimizer',
  '/international',
  '/career',
  '/interest-guide',
  '/skills-gap-analysis',
  '/personal-brand',
  '/education',
  '/knowledge-base',
  '/resources',
  '/print-resources',
  '/externa-resurser',
  '/ai-team',
  '/nätverk',
  '/wellness',
  '/diary',
  '/calendar',
  '/exercises',
  '/my-consultant',
  '/profile',
]

function laddaEnv() {
  const p = path.join(ROOT, '.env.test.local')
  const env = {}
  for (const rad of fs.readFileSync(p, 'utf-8').split(/\r?\n/)) {
    const m = rad.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

async function stangKakor(page) {
  try {
    const btn = page.getByRole('button', { name: /endast nödvändiga|acceptera/i }).first()
    if (await btn.isVisible({ timeout: 1200 })) {
      await btn.click()
      await page.waitForTimeout(200)
    }
  } catch {}
}

/**
 * Stänger rundturen. Fyra sidor öppnar en onboarding-modal första gången
 * (CV, Profil m.fl.) — utan det här fotograferar svepet modalen, inte sidan.
 */
async function stangRundtur(page) {
  for (const namn of [/hoppa över/i, /^stäng$/i]) {
    try {
      const b = page.getByRole('button', { name: namn }).first()
      if (await b.isVisible({ timeout: 600 })) {
        await b.click()
        await page.waitForTimeout(400)
        return
      }
    } catch {}
  }
}

async function loggaIn(page, context, env, statePath) {
  await page.goto(`${BAS}/#/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await stangKakor(page)
  const utloggad = await page.getByRole('heading', { name: /stärk dina deltagare/i }).count()
  if (utloggad === 0) return
  await page.goto(`${BAS}/#/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  await stangKakor(page)
  await page.locator('input#email').waitFor({ state: 'visible', timeout: 15000 })
  await page.locator('input#email').fill(env.TEST_USER_EMAIL)
  await page.locator('input#password').fill(env.TEST_USER_PASSWORD)
  await page.getByRole('button', { name: /^logga in$/i }).click()
  await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 25000 })
  await page.waitForTimeout(1200)
  await context.storageState({ path: statePath })
}

;(async () => {
  const env = laddaEnv()
  const authDir = path.join(__dirname, '.auth')
  const statePath = path.join(authDir, 'state.json')
  const utDir = path.join(__dirname, 'screenshots', `career-${bredd}`)
  fs.mkdirSync(authDir, { recursive: true })
  fs.mkdirSync(utDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: bredd, height: hojd },
    storageState: fs.existsSync(statePath) ? statePath : undefined,
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  const fel = []
  page.on('pageerror', (e) => fel.push({ sida: page.url(), text: e.message }))
  page.on('console', (m) => {
    if (m.type() === 'error') fel.push({ sida: page.url(), text: m.text().slice(0, 200) })
  })

  await loggaIn(page, context, env, statePath)

  const matt = []
  for (const rutt of SIDOR) {
    const slug = rutt.replace(/^\//, '').replace(/\//g, '-')
    try {
      await page.goto(`${BAS}/#${rutt}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2600)
      try { await page.waitForLoadState('networkidle', { timeout: 4000 }) } catch {}
      await stangKakor(page)
      await stangRundtur(page)
      await page.waitForTimeout(600)

      const m = await page.evaluate(() => {
        const r = (el) => (el ? el.getBoundingClientRect() : null)
        const skena = document.querySelector('[data-skena]')
        const huvud = document.querySelector('main')
        const nav = document.querySelector('header') || document.querySelector('nav')
        const h1 = document.querySelector('h1')
        return {
          skena: skena ? Math.round(r(skena).width) : null,
          skenaHojd: skena ? Math.round(r(skena).height) : null,
          navH: nav ? Math.round(r(nav).height) : null,
          huvudTop: huvud ? Math.round(r(huvud).top) : null,
          h1: h1 ? h1.textContent.trim().slice(0, 40) : null,
          h1Top: h1 ? Math.round(r(h1).top) : null,
          docBredd: document.documentElement.scrollWidth,
          scrollX: window.innerWidth < document.documentElement.scrollWidth,
        }
      })
      matt.push({ rutt, ...m })
      await page.screenshot({ path: path.join(utDir, `${slug}.png`), fullPage: full })
      console.log(`${rutt.padEnd(24)} skena=${String(m.skena).padStart(4)} h1="${m.h1}" hscroll=${m.scrollX}`)
    } catch (e) {
      console.log(`${rutt.padEnd(24)} FEL: ${e.message.split('\n')[0]}`)
      matt.push({ rutt, fel: e.message.split('\n')[0] })
    }
  }

  fs.writeFileSync(path.join(utDir, 'matt.json'), JSON.stringify({ matt, fel }, null, 2))
  const unika = [...new Set(fel.map((f) => f.text))]
  if (unika.length) {
    console.log(`\n--- ${unika.length} unika konsolfel ---`)
    unika.slice(0, 25).forEach((t) => console.log('  ' + t))
  }
  await browser.close()
})()
