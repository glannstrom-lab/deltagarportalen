/**
 * Genererar PDF för ALLA 12 mallar med realistisk data (foto, full
 * summary, 4 jobb, 2 utbildningar, 6 skills, 2 språk) så jag kan auditera
 * dem som en helhet. Output: audit-2026-05-22/cv-all/<template>.pdf
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
  title: 'Arbetskonsulent',
  email: 'glannstrom@gmail.com',
  phone: '0738290860',
  location: 'Lindesberg',
  summary: 'Arbetskonsulent med gedigen erfarenhet av arbetsmarknadsintegration och stödinsatser. Jag har lett och genomfört föreläsningar, individuella samtal samt etablerat samarbeten med arbetsgivare i projektet Steg till arbete, och tidigare coachat deltagare i flera Arcus program som Stöd och matchning och Rusta och matcha. Min bakgrund som boendepedagog på ett HVB hem för ensamkommande och som magister i psykologi ger mig stark kompetens inom KBT, Motivational Interviewing och sociala medier, vilket stärker mina insatser för målgruppsanpassat stöd. Jag söker nu en ledande roll där jag kan utveckla och implementera effektiva arbetsintegrationsprogram på nationell nivå.',
  skills: [
    { id: '1', name: 'B-körkort', level: 5, category: 'technical' },
    { id: '2', name: 'MI', level: 5, category: 'technical' },
    { id: '3', name: 'KBT', level: 5, category: 'technical' },
    { id: '4', name: 'Sociala medier', level: 4, category: 'soft' },
    { id: '5', name: 'AI', level: 4, category: 'technical' },
    { id: '6', name: 'Office', level: 5, category: 'technical' },
  ],
  workExperience: [
    { id: '1', company: 'Arbetslivsresurs', title: 'Arbetskonsulent', location: 'Lindesberg', startDate: '2025-12', endDate: '', current: true, description: 'Jobbar som arbetskonsulent i projektet Steg till arbete. Arbetsuppgifter inkluderar föreläsningar, individuella samtal och kontakt med arbetsgivare.' },
    { id: '2', company: 'Arcus', title: 'Jobbcoach', location: 'Lindesberg', startDate: '2020-12', endDate: '2025-11', current: false, description: 'Jobbade som jobbcoach i olika projekt som Stöd och matchning, Rusta och matcha, Introduktion till arbete och Steg till arbete.' },
    { id: '3', company: 'Lindesbergs Kommun', title: 'Boendepedagog', location: 'Lindesberg', startDate: '2017-06', endDate: '2020-08', current: false, description: 'Boendepedagog på ett HVB-hem för ensamkommande. Boendestöd inom LSS. Jobbade både med ensamkommande ungdomar samt vuxna med psykologiska utmaningar.' },
    { id: '4', company: 'Custice', title: 'Marknadsansvarig', location: 'Örebro', startDate: '2014-01', endDate: '2017-05', current: false, description: 'Byggde och skötte hemsidan. Anordnade kampanjer och marknadsföringsmaterial. Hade hand om sociala medier och utvecklade strategier kring marknadsföring.' },
  ],
  education: [
    { id: '1', school: 'Örebro Universitet', degree: 'Magisterexamen', field: 'Psykologi', location: 'Örebro', startDate: '2006-08', endDate: '2011-06', description: '' },
    { id: '2', school: 'Tingvallaskolan', degree: 'Samhällsvetenskapligt program', field: 'Ekonomisk inriktning', location: 'Karlstad', startDate: '1994-08', endDate: '1996-06', description: '' },
  ],
  languages: [
    { id: '1', language: 'Svenska', level: 'native' },
    { id: '2', language: 'Engelska', level: 'fluent' },
  ],
  certificates: [
    { id: '1', name: 'Diplomerad samtalsterapeut', issuer: 'Svenska Terapiinstitutet', date: '2018-05' },
  ],
  links: [
    { id: '1', type: 'website', url: 'https://www.glannstrom.se', label: 'Hemsida' },
  ],
  colorScheme: 'indigo', font: 'inter',
  profileImage: 'https://api.dicebear.com/7.x/personas/png?seed=Mikael&size=300',
}

function encodeBase64Url(json) {
  return Buffer.from(json, 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function main() {
  const outDir = path.join(__dirname, '..', 'audit-2026-05-22', 'cv-all')
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
      console.log(`${tpl}: FAIL ${e.message.slice(0, 100)}`)
      continue
    }
    await page.waitForTimeout(1500)

    const dims = await page.evaluate(() => {
      const r = document.querySelector('.cv-print-root')
      return {
        natural: r?.getAttribute('data-natural'),
        pages: r?.getAttribute('data-pages'),
      }
    })

    const pdfOut = path.join(outDir, `${tpl}.pdf`)
    await page.pdf({ path: pdfOut, printBackground: true, preferCSSPageSize: true })
    console.log(`${tpl}: natural=${dims.natural}px, pages=${dims.pages}, size=${(fs.statSync(pdfOut).size/1024).toFixed(1)}kB`)
  }
  await browser.close()
  console.log(`\nKlart. Output i ${outDir}`)
}

main().catch(e => { console.error(e); process.exit(1) })
