/**
 * Visuellt svep över /knowledge-base i alla dess tillstånd.
 *
 *   BASE_URL=https://www.jobin.se node e2e/svep-resurser.cjs [bredd] [--mork]
 *
 * Sidan har inga flikar — landning, kategorivy och sökvy styrs av
 * `?category=` och `?q=`. Svepet fotograferar alla tre plus en artikel.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const BAS = process.env.BASE_URL || 'https://www.jobin.se'
const bredd = Number(process.argv[2] || 1440)
const mork = process.argv.includes('--mork')
const hojd = bredd < 700 ? 844 : 950

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
  } catch {}
}
async function stangRundtur(page) {
  for (const n of [/hoppa över/i, /^stäng$/i]) {
    try {
      const b = page.getByRole('button', { name: n }).first()
      if (await b.isVisible({ timeout: 600 })) { await b.click(); await page.waitForTimeout(400); return }
    } catch {}
  }
}
;(async () => {
  const env = laddaEnv()
  const utDir = path.join(__dirname, 'screenshots', `resurser-${bredd}${mork ? '-mork' : ''}`)
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
  await page.getByRole('button', { name: /^logga in$/i }).click()
  await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 30000 })
  await page.waitForTimeout(1500)

  const logg = {}
  async function besok(namn, rutt, vantetid = 3500) {
    await page.goto(`${BAS}/#${rutt}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(vantetid)
    await stangKakor(page); await stangRundtur(page)
    await page.waitForTimeout(400)
    const m = await page.evaluate(() => {
      const skena = document.querySelector('[data-skena]')
      const h1 = document.querySelector('h1')
      const main = document.querySelector('main')
      return {
        h1: h1 && h1.textContent.trim(),
        rubriker: [...document.querySelectorAll('main h1, main h2, main h3, main h4')].map(h => h.tagName + ':' + h.textContent.trim().slice(0, 45)).slice(0, 25),
        skenPoster: skena ? [...skena.querySelectorAll('button, a')].map(e => e.textContent.trim()).filter(Boolean).slice(0, 14) : [],
        hscroll: window.innerWidth < document.documentElement.scrollWidth,
        text: main ? main.innerText.slice(0, 1400) : null,
        knappar: [...document.querySelectorAll('main button')].map(b => (b.getAttribute('aria-label') || b.innerText || '').split(String.fromCharCode(10)).join(' ').trim().slice(0, 40)).filter(Boolean).slice(0, 24),
      }
    })
    logg[namn] = m
    await page.screenshot({ path: path.join(utDir, `${namn}.png`), fullPage: true })
    console.log(`bild: ${namn}  h1="${m.h1}" hscroll=${m.hscroll}`)
    return m
  }

  await besok('01-alla', '/resources')
  await besok('02-dokument', '/resources?tab=documents')
  await besok('03-jobb', '/resources?tab=jobs')
  await besok('04-artiklar', '/resources?tab=articles')
  await besok('05-externa', '/externa-resurser')
  await besok('06-utskrift', '/print-resources')

  fs.writeFileSync(path.join(utDir, 'matt.json'), JSON.stringify({ logg, fel: [...new Set(fel)] }, null, 2))
  console.log('\n--- unika konsolfel ---')
  ;[...new Set(fel)].slice(0, 15).forEach((f) => console.log('  ' + f))
  await browser.close()
})()
