/**
 * CV-PDF:ns sidbrytningar — mäter i den färdiga PDF:en, inte i DOM:en.
 *
 *   node e2e/cv-pdf-sidbrytning.cjs                 # mot dev (:3000)
 *   BASE_URL=https://www.jobin.se node e2e/cv-pdf-sidbrytning.cjs
 *   MALLAR=sidebar,berlin node e2e/cv-pdf-sidbrytning.cjs
 *   PNG=1 node e2e/cv-pdf-sidbrytning.cjs           # + en PNG per sida (pdftoppm)
 *
 * Två krav, för varje mall och två CV-längder:
 *   1. En post (jobb/utbildning) delas aldrig mellan sidor: postens titel och
 *      sista raden i beskrivningen står på samma sida.
 *   2. Fortsätter en sektion på nästa sida står sektionsrubriken
 *      (t.ex. ERFARENHET) överst där också — på varje sida där sektionen har
 *      en post.
 *
 * PDF:en tas fram exakt som client/api/cv-pdf.js gör: ?data= + page.pdf med
 * preferCSSPageSize och printBackground. Sidtillhörigheten läses med
 * pdftotext per sida. Ett "ser rätt ut" i webbläsarens förhandsvisning bevisar
 * ingenting — Chrome paginerar bara i print.
 */
const { chromium } = require('@playwright/test')
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

const BAS = process.env.BASE_URL || 'http://localhost:3000'
const UT = process.env.OUT_DIR || path.join(__dirname, '..', 'cv-prints', 'sidbrytning')
const ALLA = [
  'sidebar', 'centered', 'minimal', 'creative', 'executive', 'nordic',
  'budapest', 'rotterdam', 'chicago', 'atelier', 'manhattan', 'berlin',
]
const MALLAR = process.env.MALLAR ? process.env.MALLAR.split(',') : ALLA

const MENING = 'Ansvarade för det dagliga arbetet i teamet och planerade bemanningen tillsammans med arbetsledningen'
function beskrivning(n, kod) {
  // Varierande längd så att brytpunkterna hamnar på olika ställen i olika mallar.
  const stycken = []
  for (let i = 0; i < n; i++) stycken.push(`${MENING} under period ${i + 1}.`)
  return `${stycken.join(' ')}\n\n- Planerade veckans arbete\n- Följde upp leveranser\n- Introducerade nyanställda\n\nAvslutat ${kod}.`
}

function cv(antalJobb) {
  const langder = [3, 6, 2, 8, 4, 7, 3, 9, 5, 2, 6, 4]
  const workExperience = []
  for (let i = 0; i < antalJobb; i++) {
    const kod = `J${String(i + 1).padStart(2, '0')}`
    workExperience.push({
      id: `w${i}`, title: `Lagerchef ${kod}`, company: `Företaget ${kod} AB`,
      startDate: `20${String(10 + i).padStart(2, '0')}-01`, endDate: `20${String(11 + i).padStart(2, '0')}-06`,
      current: false, location: 'Göteborg', description: beskrivning(langder[i % langder.length], kod),
    })
  }
  const education = []
  for (let i = 0; i < 4; i++) {
    const kod = `U${String(i + 1).padStart(2, '0')}`
    education.push({
      id: `e${i}`, degree: `Examen ${kod}`, school: `Skolan ${kod}`, field: 'Logistik',
      startDate: `200${i}-08`, endDate: `200${i + 1}-06`, location: 'Borås',
      description: beskrivning(2 + (i % 3), kod),
    })
  }
  return {
    firstName: 'Kim', lastName: 'Testsson', title: 'Lagerchef',
    email: 'kim@example.test', phone: '070-000 00 00', location: 'Göteborg',
    summary: 'Lagerchef med lång vana av att leda team och planera flöden i stora lager.',
    workExperience, education,
    skills: [
      { id: 's1', name: 'Truckkort A+B', level: 5, category: 'technical' },
      { id: 's2', name: 'Lagersystem', level: 4, category: 'technical' },
      { id: 's3', name: 'Ledarskap', level: 4, category: 'soft' },
    ],
    languages: [{ id: 'l1', language: 'Svenska', level: 'Modersmål' }, { id: 'l2', language: 'Engelska', level: 'Flytande' }],
    certificates: [], links: [], references: [],
    colorScheme: 'indigo', font: 'inter', profileImage: null,
  }
}

const b64 = (o) => Buffer.from(JSON.stringify(o), 'utf8').toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
// Mjuka bindestreck, avstavning och radbrytningar bort — vi letar efter koder.
const platta = (s) => s.replace(/­/g, '').replace(/-\s*\n\s*/g, '').replace(/\s+/g, ' ').toLowerCase()

function sidtexter(pdf) {
  const info = execFileSync('pdfinfo', [pdf]).toString()
  const sidor = parseInt(/Pages:\s+(\d+)/.exec(info)[1], 10)
  const texter = []
  for (let p = 1; p <= sidor; p++) {
    texter.push(platta(execFileSync('pdftotext', ['-f', String(p), '-l', String(p), '-enc', 'UTF-8', pdf, '-']).toString('utf8')))
  }
  return texter
}

;(async () => {
  fs.mkdirSync(UT, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } })
  let fel = 0
  let kontroller = 0
  console.log(`CV-PDF sidbrytningar mot ${BAS}\n`)

  for (const mall of MALLAR) {
    for (const antal of [6, 10]) {
      const data = cv(antal)
      await page.goto(`${BAS}/#/print/cv?data=${b64(data)}&template=${mall}&manual=1`, { waitUntil: 'networkidle' })
      await page.waitForSelector('.cv-preview')
      await page.waitForTimeout(500)
      // Sektionsrubrikerna som de faktiskt heter i mallen (Erfarenhet,
      // Arbetslivserfarenhet, "01 Erfarenhet" …), och vilka poster de äger.
      const sektioner = await page.evaluate(() => {
        const ut = []
        for (const s of document.querySelectorAll('.cv-preview section')) {
          const poster = [...s.querySelectorAll('.cv-entry')]
          if (poster.length < 2) continue
          const h = s.querySelector('h2, h3')
          if (!h) continue
          const koder = poster.map((p) => (/\b([JU]\d\d)\b/.exec(p.textContent) || [])[1]).filter(Boolean)
          if (!koder.length) continue
          ut.push({ rubrik: h.textContent.replace(/^\s*[\dIVX]+[.\s]*/, '').trim(), koder })
        }
        return ut
      })
      const fil = path.join(UT, `${mall}-${antal}jobb.pdf`)
      if (process.env.EXTRA_CSS) await page.addStyleTag({ content: fs.readFileSync(process.env.EXTRA_CSS, 'utf8') })
      await page.emulateMedia({ media: 'print' })
      await page.pdf({ path: fil, format: 'A4', printBackground: true, preferCSSPageSize: true })
      await page.emulateMedia({ media: 'screen' })
      const sidor = sidtexter(fil)
      const sidaFor = (t) => sidor.findIndex((s) => s.includes(t.toLowerCase())) + 1
      const brister = []

      for (const sek of sektioner) {
        const rubrik = platta(sek.rubrik).replace(/ /g, '')
        const postsidor = new Set()
        for (const kod of sek.koder) {
          const titel = kod.startsWith('J') ? `lagerchef ${kod}` : `examen ${kod}`
          const start = sidaFor(titel)
          const slut = sidaFor(`avslutat ${kod}.`)
          kontroller++
          if (!start || !slut) { brister.push(`${kod}: hittas inte i PDF:en (start ${start}, slut ${slut})`); continue }
          if (start !== slut) brister.push(`${kod} delad: titel s.${start}, slut s.${slut}`)
          for (let p = start; p <= slut; p++) postsidor.add(p)
        }
        for (const p of postsidor) {
          kontroller++
          if (!sidor[p - 1].replace(/ /g, '').includes(rubrik)) brister.push(`s.${p}: "${sek.rubrik}" saknas fast sektionen fortsätter där`)
        }
        // Ensam rubrik: rubriken står sist på en sida och posterna börjar först på nästa.
        sidor.forEach((text, i) => {
          kontroller++
          if (text.replace(/ /g, '').includes(rubrik) && !postsidor.has(i + 1)) brister.push(`s.${i + 1}: "${sek.rubrik}" står ensam utan post under sig`)
        })
      }

      if (process.env.PNG) {
        try { execFileSync('pdftoppm', ['-png', '-r', '60', fil, fil.replace(/\.pdf$/, '')]) } catch { /* valfritt */ }
      }
      const status = brister.length ? 'FEL ' : 'OK  '
      if (brister.length) fel += brister.length
      console.log(`${status}${mall.padEnd(10)} ${String(antal).padStart(2)} jobb  ${sidor.length} sidor`)
      for (const b of brister) console.log(`       ${b}`)
    }
  }
  await browser.close()
  console.log(`\n${kontroller} kontroller, ${fel} brister. PDF:er i ${UT}`)
  process.exit(fel ? 1 : 0)
})().catch((e) => { console.error(e); process.exit(2) })
