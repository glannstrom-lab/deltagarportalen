/**
 * Hit-test: täcks sidans sista innehåll av bottennavet på mobil?
 *
 *   BASE_URL=https://www.jobin.se node e2e/career-bottennav-hittest.cjs
 *
 * Bakgrund: den visuella granskningen 2026-08-21 läste av fullPage-bilder och
 * drog slutsatsen att sista kortet ligger under bottennavet på hela portalen,
 * med `.has-mobile-nav` (som mycket riktigt aldrig appliceras) som orsak. Men
 * `Layout.tsx:195` sätter `pb-20` när bottennavet visas, så premissen behövde
 * mätas i stället för läsas av en bild — i en fullPage-skärmbild renderas ett
 * `position: fixed`-element vid dokumentets slut, inte vid vyportens.
 *
 * Lärdomen 2026-08-04: en geometrisk fix behöver en geometrisk regression, och
 * okulär besiktning duger inte. Det här är `document.elementFromPoint` mot de
 * verkliga elementen, längst ned i scrollen.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BAS = process.env.BASE_URL || 'http://localhost:3000'
const SIDOR = ['/career', '/career/adaptation', '/career/credentials', '/career/relocation', '/career/plan']

function laddaEnv() {
  const env = {}
  for (const rad of fs.readFileSync(path.join(__dirname, '..', '.env.test.local'), 'utf-8').split(/\r?\n/)) {
    const m = rad.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

;(async () => {
  const env = laddaEnv()
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()

  await page.goto(`${BAS}/#/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  try {
    const kakor = page.getByRole('button', { name: /endast nödvändiga|acceptera/i }).first()
    if (await kakor.isVisible({ timeout: 1500 })) await kakor.click()
  } catch {}
  await page.locator('input#email').waitFor({ state: 'visible', timeout: 20000 })
  await page.locator('input#email').fill(env.TEST_USER_EMAIL)
  await page.locator('input#password').fill(env.TEST_USER_PASSWORD)
  await page.getByRole('button', { name: /^logga in$/i }).click()
  await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 25000 })

  let fel = 0
  for (const rutt of SIDOR) {
    await page.goto(`${BAS}/#${rutt}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    try { await page.getByRole('button', { name: /hoppa över|^stäng$/i }).first().click({ timeout: 800 }) } catch {}

    /*
      Scrolla längst ned i den container som FAKTISKT scrollar. `window` gör
      ingenting här: Layout.tsx lägger scrollen på en inre wrapper, och en
      `window.scrollTo` som inte flyttar något gör hela mätningen meningslös
      utan att märkas.
    */
    await page.evaluate(() => {
      const scrollbar = [document.scrollingElement, ...document.querySelectorAll('*')].find((el) => {
        if (!el) return false
        const s = getComputedStyle(el)
        return el.scrollHeight - el.clientHeight > 40 && /auto|scroll/.test(s.overflowY)
      })
      const mal = scrollbar || document.scrollingElement
      if (mal) mal.scrollTop = mal.scrollHeight
      window.scrollTo(0, document.documentElement.scrollHeight)
    })
    await page.waitForTimeout(800)

    const resultat = await page.evaluate(() => {
      // Bottennavet: fixerat, brett, och sitter mot vyportens nederkant.
      // En bredare nav-sökning plockade upp toppnaven och gav navTop = -1559.
      const nav = [...document.querySelectorAll('nav')].find((n) => {
        const s = getComputedStyle(n)
        const r = n.getBoundingClientRect()
        return s.position === 'fixed' && r.width > 200 && r.bottom > window.innerHeight - 20
      })
      const navRect = nav ? nav.getBoundingClientRect() : null
      const main = document.querySelector('main')
      if (!main) return { fel: 'ingen <main>' }

      // Sista synliga innehållselementet i main.
      const kandidater = [...main.querySelectorAll('h1,h2,h3,h4,p,button,a,li,input,label')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.height > 0
        })
      const sista = kandidater[kandidater.length - 1]
      if (!sista) return { fel: 'inget innehåll i main' }
      const r = sista.getBoundingClientRect()

      // Hit-test mitt på elementets nedre kant: vem svarar där?
      const x = Math.round(r.left + r.width / 2)
      const y = Math.round(Math.min(r.bottom - 2, window.innerHeight - 2))
      const traff = document.elementFromPoint(x, y)
      const traffasAvNav = Boolean(nav && traff && nav.contains(traff))

      return {
        sistaText: (sista.textContent || '').trim().slice(0, 40),
        sistaBottom: Math.round(r.bottom),
        navTop: navRect ? Math.round(navRect.top) : null,
        navHojd: navRect ? Math.round(navRect.height) : null,
        vyhojd: window.innerHeight,
        mainPaddingBottom: getComputedStyle(main).paddingBottom,
        traffasAvNav,
      }
    })

    const dom = resultat.traffasAvNav ? 'TÄCKS AV NAVET' : 'fri'
    if (resultat.traffasAvNav) fel++
    console.log(
      `${rutt.padEnd(22)} ${dom.padEnd(16)} sista="${resultat.sistaText}" ` +
      `bottom=${resultat.sistaBottom} navTop=${resultat.navTop} mainPb=${resultat.mainPaddingBottom}`
    )
  }

  await browser.close()
  console.log(fel === 0 ? '\nOK — inget sista element täcks av bottennavet.' : `\n${fel} sidor täcks.`)
  process.exit(fel === 0 ? 0 : 1)
})()
