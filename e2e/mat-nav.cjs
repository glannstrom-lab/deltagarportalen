/**
 * Mäter navigationens höjd och tar skärmbild. (Steg 2-finjustering, 2026-08-17)
 *
 *   node e2e/mat-nav.cjs [route] [bredd]
 *
 * Chrome-höjd är inte en smaksak utan ett tal: allt som toppnaven tar går från
 * sidans innehåll. Att mäta det slår att titta och tycka.
 */
const { chromium } = require('@playwright/test')
const path = require('path')

const ROOT = path.join(__dirname, '..')
let route = process.argv[2] || '/applications'
const bredd = Number(process.argv[3] || 1440)

/**
 * Git Bash på Windows (MSYS) gör om ett argument som börjar med `/` till en
 * Windows-sökväg: `/jobb` blir `C:/Program Files/Git/jobb`. Skriptet mätte då
 * catch-all-rutten och rapporterade tal som såg fullt rimliga ut — det syns i
 * `e2e/screenshots/C-ProgramFiles-Git-oversikt.png`, som någon tagit utan att
 * märka det. Ett tyst fel som ger fel svar är värre än ett som stannar.
 */
if (/^[A-Za-z]:[\\/]/.test(route)) {
  const svans = route.replace(/\\/g, '/').split('/').pop()
  console.error(
    `\nRUTTEN MANGLADES AV GIT BASH: "${route}"\n` +
      `Skriptet hade mätt fel sida utan att säga till.\n\n` +
      `Kör i stället något av:\n` +
      `  MSYS_NO_PATHCONV=1 node e2e/mat-nav.cjs /${svans} ${bredd}\n` +
      `  node e2e/mat-nav.cjs ${svans} ${bredd}      (utan inledande snedstreck)\n`
  )
  process.exit(1)
}
if (!route.startsWith('/')) route = `/${route}`

;(async () => {
  const b = await chromium.launch()
  const ctx = await b.newContext({
    viewport: { width: bredd, height: 900 },
    storageState: path.join(ROOT, 'e2e/.auth/state.json'),
  })
  const p = await ctx.newPage()
  await p.goto(`http://localhost:3000/#${route}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1500)

  // Avfärda onboardingmodaler så de inte skymmer sidan i skärmbilden.
  for (const etikett of ['Hoppa över', 'Stäng', 'Skip']) {
    const knapp = p.getByRole('button', { name: new RegExp(etikett, 'i') }).first()
    if (await knapp.count().catch(() => 0)) {
      await knapp.click({ timeout: 1500 }).catch(() => {})
      await p.waitForTimeout(600)
    }
  }
  await p.keyboard.press('Escape').catch(() => {})
  await p.waitForTimeout(600)

  const m = await p.evaluate(() => {
    const r = (el) => (el ? Math.round(el.getBoundingClientRect().height) : null)
    const header = document.querySelector('header')
    const sub = document.querySelector('nav[aria-label*="ndersidor"]')
    const kat = document.querySelector('nav[aria-label*="uvudkategorier"]')
    const main = document.querySelector('#main-content')
    return {
      topbar: r(header),
      undersidesrad: r(sub),
      kategorirad: r(kat),
      totalChrome: (r(header) || 0) + (r(sub) || 0),
      innehallBorjar: main ? Math.round(main.getBoundingClientRect().top) : null,
      // Klipps någon kategoritext?
      klippta: [...document.querySelectorAll('nav a')]
        .filter((a) => a.scrollWidth > a.clientWidth + 1)
        .map((a) => a.textContent.trim()),
    }
  })
  console.log(JSON.stringify(m, null, 2))
  // Namnet bär rutten: flera granskare kör skriptet samtidigt, och ett fast
  // filnamn hade låtit dem skriva över varandras bild utan att någon märkte det.
  const namn = route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'rot'
  await p.screenshot({ path: path.join(ROOT, `e2e/screenshots/sida-${namn}-${bredd}.png`), fullPage: true })
  await b.close()
})()
