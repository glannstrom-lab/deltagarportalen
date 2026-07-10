/**
 * Genererar PDF för alla mallar med EN LÅNG CV (8 jobb, 4 utb, många
 * certifikat och länkar) så jag kan se hur flersidiga PDF:er ser ut.
 * Output: audit-2026-05-22/cv-long/<template>.pdf
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEMPLATES = [
  'sidebar', 'centered', 'minimal', 'creative', 'executive',
  'nordic', 'budapest', 'rotterdam', 'chicago',
  'atelier', 'manhattan', 'berlin',
]

const CV = {
  firstName: 'Mikael',
  lastName: 'Glännström',
  title: 'Senior Arbetskonsulent & Programutvecklare',
  email: 'glannstrom@gmail.com',
  phone: '0738290860',
  location: 'Lindesberg',
  summary: 'Senior arbetskonsulent med över 20 års erfarenhet av arbetsmarknadsintegration, ledarskap och programutveckling. Har lett team om upp till 25 personer, driver flera nationella initiativ inom KBT och Motivational Interviewing, och har en gedigen akademisk bakgrund inom psykologi.',
  skills: [
    { id: '1', name: 'B-körkort', level: 5, category: 'technical' },
    { id: '2', name: 'MI', level: 5, category: 'technical' },
    { id: '3', name: 'KBT', level: 5, category: 'technical' },
    { id: '4', name: 'Sociala medier', level: 4, category: 'soft' },
    { id: '5', name: 'AI', level: 4, category: 'technical' },
    { id: '6', name: 'Office', level: 5, category: 'technical' },
    { id: '7', name: 'Ledarskap', level: 5, category: 'soft' },
    { id: '8', name: 'Projektledning', level: 5, category: 'soft' },
    { id: '9', name: 'Engelska', level: 4, category: 'language' },
  ],
  workExperience: [
    { id: '1', company: 'Arbetslivsresurs', title: 'Senior Arbetskonsulent', location: 'Lindesberg', startDate: '2025-12', endDate: '', current: true, description: 'Leder team i projektet Steg till arbete. Ansvar för föreläsningar, individuella samtal och arbetsgivarkontakter. Utvecklar metodik för KBT-baserad jobbcoachning.' },
    { id: '2', company: 'Arcus', title: 'Jobbcoach', location: 'Örebro', startDate: '2020-12', endDate: '2025-11', current: false, description: 'Jobbade som jobbcoach i olika projekt som Stöd och matchning, Rusta och matcha, Introduktion till arbete och Steg till arbete. Genomförde över 500 individuella samtal.' },
    { id: '3', company: 'Lindesbergs Kommun', title: 'Boendepedagog', location: 'Lindesberg', startDate: '2017-06', endDate: '2020-08', current: false, description: 'Boendepedagog på ett HVB-hem för ensamkommande ungdomar. Boendestöd inom LSS. Jobbade både med ensamkommande ungdomar samt vuxna med psykologiska utmaningar.' },
    { id: '4', company: 'Custice', title: 'Marknadsansvarig', location: 'Örebro', startDate: '2014-01', endDate: '2017-05', current: false, description: 'Byggde och skötte hemsidan. Anordnade kampanjer och marknadsföringsmaterial. Hade hand om sociala medier och utvecklade strategier kring marknadsföring.' },
    { id: '5', company: 'Telia AB', title: 'Säljare', location: 'Stockholm', startDate: '2011-06', endDate: '2013-12', current: false, description: 'Telefonförsäljning B2B. Topp 5 av 200 säljare två år i rad. Specialiserad på mobilabonnemang för småföretag.' },
    { id: '6', company: 'ICA Maxi', title: 'Butiksbiträde', location: 'Karlstad', startDate: '2009-08', endDate: '2011-05', current: false, description: 'Kassa och kundservice. Vikarierande avdelningschef under semestrar. Ansvarig för frukt- och gröntavdelningen.' },
    { id: '7', company: 'Karlstads Universitet', title: 'Praktikant Psykologi', location: 'Karlstad', startDate: '2008-09', endDate: '2009-06', current: false, description: 'Forskningspraktik inom social psykologi. Bidrog till studier kring grupprocesser och beslutsfattande.' },
    { id: '8', company: 'McDonalds', title: 'Servitör', location: 'Karlstad', startDate: '2005-06', endDate: '2008-08', current: false, description: 'Kassa, matlagning, städning. Lärde mig stress-hantering och kundbemötande.' },
  ],
  education: [
    { id: '1', school: 'Örebro Universitet', degree: 'Magisterexamen', field: 'Psykologi', location: 'Örebro', startDate: '2006-08', endDate: '2011-06', description: 'Inriktning på socialpsykologi och organisationspsykologi.' },
    { id: '2', school: 'Karlstads Universitet', degree: 'Kandidatexamen', field: 'Sociologi', location: 'Karlstad', startDate: '2003-08', endDate: '2006-06', description: '' },
    { id: '3', school: 'Tingvallaskolan', degree: 'Samhällsvetenskapligt program', field: 'Ekonomisk inriktning', location: 'Karlstad', startDate: '1994-08', endDate: '1996-06', description: '' },
    { id: '4', school: 'Folkuniversitetet', degree: 'Diplomkurs KBT', field: 'Klinisk inriktning', location: 'Distans', startDate: '2018-01', endDate: '2018-12', description: '' },
  ],
  languages: [
    { id: '1', language: 'Svenska', level: 'native' },
    { id: '2', language: 'Engelska', level: 'fluent' },
    { id: '3', language: 'Tyska', level: 'good' },
    { id: '4', language: 'Norska', level: 'basic' },
  ],
  certificates: [
    { id: '1', name: 'Diplomerad samtalsterapeut', issuer: 'Svenska Terapiinstitutet', date: '2018-05' },
    { id: '2', name: 'MI-trainer', issuer: 'Motivational Interviewing Network', date: '2020-03' },
    { id: '3', name: 'Ledarskap UGL', issuer: 'Försvarshögskolan', date: '2022-09' },
  ],
  links: [
    { id: '1', type: 'website', url: 'https://www.glannstrom.se', label: 'Hemsida' },
    { id: '2', type: 'linkedin', url: 'https://linkedin.com/in/glannstrom', label: 'LinkedIn' },
  ],
  colorScheme: 'indigo', font: 'inter',
  profileImage: 'https://api.dicebear.com/7.x/personas/png?seed=Mikael&size=300',
}

function encodeBase64Url(json) {
  return Buffer.from(json, 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function main() {
  const outDir = path.join(__dirname, '..', 'audit-2026-05-22', 'cv-long')
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1280, height: 1600 } })
  await context.addInitScript(() => localStorage.setItem('jobin_cookie_consent', 'true'))
  const page = await context.newPage()
  page.on('pageerror', e => console.log(`[pageerror] ${e.message}`))

  for (const tpl of TEMPLATES) {
    const cv = { ...CV, template: tpl }
    const dataParam = encodeBase64Url(JSON.stringify(cv))
    const url = `${BASE_URL}/#/print/cv?data=${dataParam}&template=${tpl}&manual=1`
    await page.goto(url, { waitUntil: 'networkidle' })
    try {
      await page.locator('.cv-print-root').waitFor({ state: 'attached', timeout: 15000 })
    } catch (e) {
      console.log(`${tpl}: FAIL`)
      continue
    }
    await page.waitForTimeout(1500)

    await page.emulateMedia({ media: 'print' })
    await page.waitForTimeout(300)
    const dims = await page.evaluate(() => {
      const r = document.querySelector('.cv-print-root')
      const rect = r?.getBoundingClientRect()
      const body = document.body.getBoundingClientRect()
      const html = document.documentElement.getBoundingClientRect()
      return {
        natural: r?.getAttribute('data-natural'),
        pages: r?.getAttribute('data-pages'),
        actualH: rect?.height?.toFixed(2),
        bodyH: body?.height?.toFixed(2),
        htmlH: html?.height?.toFixed(2),
        bodyScrollH: document.body.scrollHeight,
        htmlScrollH: document.documentElement.scrollHeight,
      }
    })
    await page.emulateMedia({ media: 'screen' })
    console.log(JSON.stringify(dims))

    const pdfOut = path.join(outDir, `${tpl}.pdf`)
    await page.pdf({ path: pdfOut, printBackground: true, preferCSSPageSize: true })
    console.log(`${tpl}: natural=${dims.natural} pages=${dims.pages} actualH=${dims.actualH} scrollH=${dims.actualScrollH} offsetH=${dims.actualOffsetH}`)
  }
  await browser.close()
  console.log(`\nKlart. Output i ${outDir}`)
}

main().catch(e => { console.error(e); process.exit(1) })
