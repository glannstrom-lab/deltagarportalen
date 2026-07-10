const { chromium } = require('@playwright/test')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

const CV = {
  firstName: 'Mikael', lastName: 'Glännström', title: 'Senior Arbetskonsulent',
  email: 'glannstrom@gmail.com', phone: '0738290860', location: 'Lindesberg',
  summary: 'Senior arbetskonsulent med 20 års erfarenhet.',
  skills: Array.from({length: 9}, (_, i) => ({ id: String(i), name: `Skill${i}`, level: 4, category: 'technical' })),
  workExperience: Array.from({length: 8}, (_, i) => ({
    id: String(i), company: `Företag ${i+1} AB`, title: `Titel ${i+1} med längre namn`, location: 'Stockholm',
    startDate: `${2010+i}-01`, endDate: `${2011+i}-12`, current: false,
    description: 'Beskrivning av denna roll. Detta är en lite längre text som täcker två till tre rader så vi får realistisk höjd per jobb-entry. Ansvar inkluderade strategiskt arbete, ledning och utveckling.',
  })),
  certificates: [
    { id: '1', name: 'Cert A', issuer: 'X', date: '2020-01' },
    { id: '2', name: 'Cert B', issuer: 'Y', date: '2021-01' },
  ],
  links: [{ id: '1', type: 'website', url: 'https://example.com', label: 'Web' }],
  education: Array.from({length: 4}, (_, i) => ({
    id: String(i), school: `Skola ${i+1}`, degree: `Examen ${i+1}`, field: 'Område', location: 'X',
    startDate: `${1990+i*4}-08`, endDate: `${1993+i*4}-06`, description: '',
  })),
  languages: [
    { id: '1', language: 'Svenska', level: 'native' },
    { id: '2', language: 'Engelska', level: 'fluent' },
    { id: '3', language: 'Tyska', level: 'good' },
    { id: '4', language: 'Norska', level: 'basic' },
  ],
  certificates: [
    { id: '1', name: 'Cert A', issuer: 'X', date: '2020-01' },
    { id: '2', name: 'Cert B', issuer: 'Y', date: '2021-01' },
  ],
  links: [{ id: '1', type: 'website', url: 'https://example.com', label: 'Web' }],
  template: 'sidebar', colorScheme: 'indigo', font: 'inter',
  profileImage: 'https://api.dicebear.com/7.x/personas/png?seed=Mikael&size=300',
}

const dataParam = Buffer.from(JSON.stringify(CV), 'utf8').toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 794, height: 1123 } })
  await context.addInitScript(() => localStorage.setItem('jobin_cookie_consent', 'true'))
  const page = await context.newPage()

  const url = `${BASE_URL}/#/print/cv?data=${dataParam}&template=sidebar&manual=1`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.locator('.cv-print-root').waitFor({ state: 'attached', timeout: 15000 })
  await page.waitForTimeout(2000)

  // Mätning i SCREEN-mode
  const screen = await page.evaluate(() => {
    const r = document.querySelector('.cv-print-root')
    const p = document.querySelector('.cv-preview')
    return {
      mode: 'screen',
      root: r ? { w: r.getBoundingClientRect().width, h: r.getBoundingClientRect().height, mh: r.style.minHeight } : null,
      preview: p ? { w: p.getBoundingClientRect().width, h: p.getBoundingClientRect().height } : null,
      dataPages: r?.getAttribute('data-pages'),
      dataNatural: r?.getAttribute('data-natural'),
      rootBg: r ? getComputedStyle(r).backgroundImage.slice(0, 100) : null,
    }
  })
  console.log('SCREEN:', JSON.stringify(screen, null, 2))

  // Switcha till print-mode
  await page.emulateMedia({ media: 'print' })
  await page.waitForTimeout(500)
  const print = await page.evaluate(() => {
    const r = document.querySelector('.cv-print-root')
    const p = document.querySelector('.cv-preview')
    return {
      mode: 'print',
      root: r ? { w: r.getBoundingClientRect().width, h: r.getBoundingClientRect().height, mh: r.style.minHeight } : null,
      preview: p ? { w: p.getBoundingClientRect().width, h: p.getBoundingClientRect().height } : null,
      dataPages: r?.getAttribute('data-pages'),
      dataNatural: r?.getAttribute('data-natural'),
      rootScrollH: r?.scrollHeight,
    }
  })
  console.log('PRINT:', JSON.stringify(print, null, 2))

  await browser.close()
}
main().catch(e => { console.error(e); process.exit(1) })
