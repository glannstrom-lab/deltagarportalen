/**
 * Visuellt svep över /education i alla dess tillstånd.
 *   BASE_URL=https://www.jobin.se node e2e/svep-utbildning.cjs [bredd]
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const BAS = process.env.BASE_URL || 'https://www.jobin.se'
const bredd = Number(process.argv[2] || 1440)
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
  const utDir = path.join(__dirname, 'screenshots', `utbildning-${bredd}`)
  fs.mkdirSync(utDir, { recursive: true })
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: bredd, height: hojd }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const fel = []
  page.on('pageerror', (e) => fel.push(`PAGEERROR ${e.message.slice(0, 200)}`))
  page.on('console', (m) => { if (m.type() === 'error') fel.push('CONSOLE ' + m.text().slice(0, 220)) })
  const nat = []
  page.on('response', (r) => {
    const u = r.url()
    if (u.includes('education-search')) nat.push(`${r.status()} ${u.slice(0, 160)}`)
  })

  // logga in
  await page.goto(`${BAS}/#/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await stangKakor(page)
  await page.locator('input#email').waitFor({ state: 'visible', timeout: 20000 })
  await page.locator('input#email').fill(env.TEST_USER_EMAIL)
  await page.locator('input#password').fill(env.TEST_USER_PASSWORD)
  await page.getByRole('button', { name: /^logga in$/i }).click()
  await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 30000 })
  await page.waitForTimeout(1500)

  async function skott(namn, full = true) {
    await page.screenshot({ path: path.join(utDir, `${namn}.png`), fullPage: full })
    console.log('  bild: ' + namn)
  }
  async function matt() {
    return page.evaluate(() => {
      const r = (el) => (el ? el.getBoundingClientRect() : null)
      const skena = document.querySelector('[data-skena]')
      const h1 = document.querySelector('h1')
      const flikar = [...document.querySelectorAll('[data-skena] a, [data-skena] button')].map(e => e.textContent.trim()).filter(Boolean)
      return {
        skena: skena ? Math.round(r(skena).width) : null,
        h1: h1 ? h1.textContent.trim() : null,
        skenPoster: flikar.slice(0, 20),
        docBredd: document.documentElement.scrollWidth,
        hscroll: window.innerWidth < document.documentElement.scrollWidth,
        kort: document.querySelectorAll('h3').length,
      }
    })
  }

  const logg = {}
  // 1. startläge
  await page.goto(`${BAS}/#/education`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await stangKakor(page); await stangRundtur(page)
  await page.waitForTimeout(500)
  logg.start = await matt()
  await skott('01-start')

  // 2. filterpanelen öppen. Kraschade hela sidan i prod till 2026-08-22:
  //    /types skickade JobEds {key, value}-objekt som label, och React kastade
  //    #31 på <option>. Det här steget är regressionsvakten för det.
  try {
    await page.getByRole('button', { name: /filter/i }).first().click()
    await page.waitForTimeout(800)
    await skott('02-filter-oppen')
    const opts = await page.evaluate(() => [...document.querySelectorAll('select')].map(s => ({
      etikett: s.previousElementSibling ? s.previousElementSibling.textContent.trim() : '?',
      val: [...s.options].map(o => o.textContent.trim()),
    })))
    logg.filterval = opts
  } catch (e) { logg.filterFel = e.message.split('\n')[0] }

  // 3. sökning med träffar
  await page.getByPlaceholder(/Sök utbildning/i).first().fill('undersköterska')
  await page.waitForTimeout(4000)
  logg.sok = await matt()
  await skott('03-sok-underskoterska')
  // läs ut första kortets innehåll + länkar
  logg.forstaKort = await page.evaluate(() => {
    const kort = document.querySelectorAll('main a[target="_blank"]')
    const lankar = [...kort].map(a => a.getAttribute('href')).slice(0, 8)
    const h3 = [...document.querySelectorAll('main h3')].map(h => h.textContent.trim()).slice(0, 6)
    const taggar = [...document.querySelectorAll('main span')].map(s => s.textContent.trim()).filter(t => t && t.length < 40).slice(0, 40)
    const text = document.querySelector('main').innerText.slice(0, 2500)
    return { lankar, h3, taggar, text }
  })

  // 4. sökning utan träffar
  await page.getByPlaceholder(/Sök utbildning/i).first().fill('qwertyxyz')
  await page.waitForTimeout(4000)
  await skott('04-inga-traffar')

  // 5. snabbsök YH — full omladdning så att sidans tillstånd nollställs
  await page.goto(`${BAS}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  await page.goto(`${BAS}/#/education`, { waitUntil: 'domcontentloaded' })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  try {
    await page.getByRole('button', { name: /Praktiska utbildningar/i }).first().click()
    await page.waitForTimeout(4000)
    await skott('05-snabbsok-yh')
    logg.yh = await matt()
  } catch (e) { logg.yhFel = e.message.split('\n')[0] }

  fs.writeFileSync(path.join(utDir, 'matt.json'), JSON.stringify({ logg, nat, fel: [...new Set(fel)] }, null, 2))
  console.log(JSON.stringify({ logg: { start: logg.start, sok: logg.sok }, nat: nat.slice(0, 10), fel: [...new Set(fel)].slice(0, 15) }, null, 2))
  await browser.close()
})()
