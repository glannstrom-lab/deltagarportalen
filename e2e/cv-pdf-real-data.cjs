/**
 * Simulerar prod-flödet: skickar CV-data som base64 i URL (samma som
 * cv-pdf.js gör efter att ha hämtat CV från Supabase). Använder Mikaels
 * data + en profilbild så vi kan reproducera buggar som bara syns när
 * användaren har en bild.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

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
    { id: '2', school: 'Tingvallaskolan', degree: 'Samhällsvetenskapligt program', field: '', location: 'Karlstad', startDate: '1994-08', endDate: '1996-06', description: '' },
  ],
  languages: [
    { id: '1', language: 'Svenska', level: 'native' },
    { id: '2', language: 'Engelska', level: 'fluent' },
  ],
  certificates: [], links: [],
  template: 'sidebar', colorScheme: 'indigo', font: 'inter',
  profileImage: 'https://api.dicebear.com/7.x/personas/png?seed=Mikael&size=300',
}

function encodeBase64Url(json) {
  return Buffer.from(json, 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function main() {
  const outDir = path.join(__dirname, '..', 'audit-2026-05-22', 'cv-real')
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1280, height: 1600 } })
  await context.addInitScript(() => localStorage.setItem('jobin_cookie_consent', 'true'))

  const page = await context.newPage()
  page.on('pageerror', e => console.log(`[pageerror] ${e.message}`))

  const dataParam = encodeBase64Url(JSON.stringify(CV))
  const url = `${BASE_URL}/#/print/cv?data=${dataParam}&template=sidebar&manual=1`
  console.log('URL length:', url.length)

  await page.goto(url, { waitUntil: 'networkidle' })
  try {
    await page.locator('.cv-print-root').waitFor({ state: 'attached', timeout: 15000 })
  } catch (e) {
    console.log('FAIL:', e.message.slice(0, 200))
    await browser.close()
    return
  }
  await page.waitForTimeout(2000)  // extra wait for image load

  const dims = await page.evaluate(() => {
    const r = document.querySelector('.cv-print-root')
    const p = document.querySelector('.cv-preview')
    const aside = document.querySelector('.cv-preview > aside')
    const main = document.querySelector('.cv-preview > main')
    return {
      root: r ? `${r.getBoundingClientRect().width}x${r.getBoundingClientRect().height}` : null,
      preview: p ? `${p.getBoundingClientRect().width}x${p.getBoundingClientRect().height}` : null,
      aside: aside ? `${aside.getBoundingClientRect().width}x${aside.getBoundingClientRect().height}` : null,
      main: main ? `${main.getBoundingClientRect().width}x${main.getBoundingClientRect().height}` : null,
      rootMinHeight: r?.style.minHeight,
      dataPages: r?.getAttribute('data-pages'),
      dataNatural: r?.getAttribute('data-natural'),
      rootBg: r ? getComputedStyle(r).backgroundImage.slice(0, 200) : null,
    }
  })
  console.log('Dims:', JSON.stringify(dims, null, 2))

  const pdfOut = path.join(outDir, 'sidebar-real.pdf')
  await page.pdf({ path: pdfOut, printBackground: true, preferCSSPageSize: true })
  console.log('PDF:', pdfOut, fs.statSync(pdfOut).size, 'bytes')

  await browser.close()
}
main().catch(e => { console.error(e); process.exit(1) })
