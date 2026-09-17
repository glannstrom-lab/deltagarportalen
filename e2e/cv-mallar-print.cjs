/**
 * Alla CV-mallar genom print-vägen — den väg PDF:en faktiskt tar.
 *
 *   node e2e/cv-mallar-print.cjs                      # mot dev (:3000)
 *   BASE_URL=https://www.jobin.se node e2e/cv-mallar-print.cjs
 *
 * VAD DEN MÄTER. `CVPrintLayout` målar sidopanelen som canvas-bakgrund på
 * `html`-elementet i print-läge — det är så färgen når papperskanten och
 * upprepas på sida 2 och framåt (lärdomen 2026-07-03). Fram till 2026-09-18
 * slogs den upp på det RÅA mall-id:t, så ett id utanför registret gav
 * `undefined` och släckte bakgrunden, medan renderingen samtidigt föll på
 * ModernTemplate som HAR en panel. 7 av 33 CV:n i prod bar ett sådant id.
 *
 * Testet kräver därför två saker av varje mall:
 *   1. rätt mallar har en bakgrund, rätt mallar har ingen
 *   2. ett arvt id ger EXAKT samma bakgrund som sitt kanoniska
 *
 * Ett okulärt "ser rätt ut" duger inte här: skillnaden syns bara i print-läge
 * och först på sida 2 av ett flersidigt CV.
 */
const { chromium } = require('@playwright/test')

const BAS = process.env.BASE_URL || 'http://localhost:3000'

/** Mallar utan sidopanel — de SKA sakna canvas-bakgrund. */
const UTAN_PANEL = ['centered', 'minimal']

const KANONISKA = [
  'sidebar', 'centered', 'minimal', 'creative', 'executive', 'nordic',
  'budapest', 'rotterdam', 'chicago', 'atelier', 'manhattan', 'berlin',
]

/** Arvt id → det kanoniska det ska bete sig exakt som. */
const ARVDA = {
  modern: 'sidebar',
  sidokolumn: 'sidebar',
  centrerad: 'centered',
  classic: 'centered',
  nordisk: 'nordic',
}

const CV = {
  firstName: 'Kim', lastName: 'Testsson', title: 'Lagerarbetare',
  email: 'kim@example.test', phone: '070-000 00 00', location: 'Göteborg',
  summary: 'Testdata för mallkontrollen.',
  workExperience: [{ id: 'w1', title: 'Lagermedarbetare', company: 'Testlagret AB', startDate: '2022-01', endDate: '2024-06', current: false, location: 'Göteborg', description: 'Plock och pack.' }],
  education: [{ id: 'e1', degree: 'Gymnasieexamen', school: 'Testgymnasiet', field: 'Handel', startDate: '2016-08', endDate: '2019-06', location: 'Göteborg', description: '' }],
  skills: [{ id: 's1', name: 'Truckkort A+B', level: 'expert', category: 'technical' }],
  languages: [], certificates: [], links: [], references: [],
  colorScheme: 'indigo', font: 'inter', profileImage: null,
}

const b64 = Buffer.from(JSON.stringify(CV), 'utf8')
  .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

async function bakgrund(page, mall) {
  await page.goto(`${BAS}/#/print/cv?data=${b64}&template=${mall}&manual=1`, { waitUntil: 'networkidle' })
  await page.emulateMedia({ media: 'print' })
  await page.waitForTimeout(600)
  return page.evaluate(() => getComputedStyle(document.documentElement).backgroundImage)
}

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 900, height: 1300 } })
  const bakgrunder = {}
  let fel = 0

  console.log(`Mallar genom print-vägen mot ${BAS}\n`)
  for (const mall of KANONISKA) {
    const bg = await bakgrund(page, mall)
    bakgrunder[mall] = bg
    const harPanel = bg !== 'none'
    const skaHa = !UTAN_PANEL.includes(mall)
    const ok = harPanel === skaHa
    if (!ok) fel++
    console.log(`${ok ? 'OK  ' : 'FEL '} ${mall.padEnd(10)} ${harPanel ? 'bakgrund målas' : 'ingen bakgrund'}${ok ? '' : `  ← förväntade ${skaHa ? 'en bakgrund' : 'ingen'}`}`)
  }

  console.log('\nArvda id ska bete sig som sitt kanoniska:')
  for (const [arvt, kanoniskt] of Object.entries(ARVDA)) {
    const bg = await bakgrund(page, arvt)
    const ok = bg === bakgrunder[kanoniskt]
    if (!ok) fel++
    console.log(`${ok ? 'OK  ' : 'FEL '} ${arvt.padEnd(10)} → ${kanoniskt}${ok ? '' : `  ← fick "${bg.slice(0, 40)}", väntade "${(bakgrunder[kanoniskt] || '').slice(0, 40)}"`}`)
  }

  const okant = await bakgrund(page, 'finns-inte-alls')
  const okantOk = okant === bakgrunder.sidebar
  if (!okantOk) fel++
  console.log(`${okantOk ? 'OK  ' : 'FEL '} okänt id  → sidebar (standardmallen)`)

  await browser.close()
  console.log(fel === 0 ? '\nOK — alla mallar målar rätt bakgrund, och inget id ger en panel utan färg.' : `\nFEL — ${fel} avvikelse(r).`)
  process.exit(fel === 0 ? 0 : 1)
})()
