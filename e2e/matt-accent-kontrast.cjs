/**
 * Mäter faktisk textkontrast i mörkt läge på de sidor som bar
 * `dark:text-[var(--c-accent)]`.
 *
 *   node e2e/matt-accent-kontrast.cjs
 *
 * Klassen togs bort 2026-08-22 (37 förekomster i 25 nåbara filer). Accenten
 * är MÖRK i mörkt läge — som textfärg gav den 1,55–1,77:1 beroende på
 * underlag. `--c-text` vänder med temat och räcker ensam i båda lägena.
 *
 * Skriptet räknar inte på tokenvärden utan läser `getComputedStyle` på
 * riktigt renderade element och jämför mot elementets faktiska bakgrund —
 * en handräknad hexkontrast missar att Tailwind v4:s palett är `oklch()`.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const BAS = process.env.BASE_URL || 'http://localhost:3000'

const SIDOR = [
  ['/#/education', 'Utbildning'],
  ['/#/exercises', 'Övningar'],
  ['/#/profile', 'Profil'],
  ['/#/cv', 'CV'],
  ['/#/interview-simulator', 'Intervjusimulator'],
]

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
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'dark',
  })
  const page = await context.newPage()

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
  await page.waitForTimeout(3500)
  for (const n of [/hoppa över/i, /^stäng$/i]) {
    try {
      const b = page.getByRole('button', { name: n }).first()
      if (await b.isVisible({ timeout: 600 })) { await b.click(); await page.waitForTimeout(400); break }
    } catch { /* ingen rundtur */ }
  }

  let varsta = { v: 99, txt: '', sida: '' }
  let underAA = 0
  let matta = 0

  for (const [vag, namn] of SIDOR) {
    await page.goto(`${BAS}${vag}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2800)

    const res = await page.evaluate(() => {
      const parse = (s) => {
        const m = s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/)
        return m ? [ +m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4] ] : null
      }
      const lum = ([r, g, b]) => {
        const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
      }
      const bakgrund = (el) => {
        let n = el
        while (n && n !== document.documentElement) {
          const bg = parse(getComputedStyle(n).backgroundColor)
          if (bg && bg[3] > 0.5) return bg
          n = n.parentElement
        }
        return [12, 10, 9]
      }
      const ut = []
      for (const el of document.querySelectorAll('*')) {
        if (!el.textContent || el.children.length) continue
        const txt = el.textContent.trim()
        if (!txt || txt.length > 80) continue
        const cs = getComputedStyle(el)
        if (cs.visibility === 'hidden' || cs.display === 'none') continue
        const r = el.getBoundingClientRect()
        if (r.width < 4 || r.height < 4) continue
        const fg = parse(cs.color)
        if (!fg || fg[3] < 0.5) continue
        const bg = bakgrund(el)
        const l = [lum(fg), lum(bg)].sort((a, b) => b - a)
        const k = (l[0] + 0.05) / (l[1] + 0.05)
        const px = parseFloat(cs.fontSize)
        const fet = parseInt(cs.fontWeight, 10) >= 700
        const krav = px >= 24 || (px >= 18.66 && fet) ? 3 : 4.5
        ut.push({ txt: txt.slice(0, 50), k: Math.round(k * 100) / 100, krav, klass: el.className.toString().slice(0, 90) })
      }
      return ut
    })

    const fall = res.filter((r) => r.k < r.krav)
    matta += res.length
    underAA += fall.length
    const v = res.reduce((a, b) => (b.k < a.k ? b : a), { k: 99 })
    if (v.k < varsta.v) varsta = { v: v.k, txt: v.txt, sida: namn }
    console.log(`${namn.padEnd(20)} mätta ${String(res.length).padStart(4)}  under AA ${String(fall.length).padStart(3)}  lägsta ${v.k}`)
    for (const f of fall.slice(0, 4)) {
      console.log(`   ${f.k} (krav ${f.krav})  "${f.txt}"`)
      console.log(`      ${f.klass}`)
    }
  }

  console.log('')
  console.log(`TOTALT: ${matta} textnoder mätta i mörkt läge, ${underAA} under AA.`)
  console.log(`Lägsta: ${varsta.v}:1 — "${varsta.txt}" på ${varsta.sida}`)
  await browser.close()
  process.exit(underAA > 0 ? 1 : 0)
})()
