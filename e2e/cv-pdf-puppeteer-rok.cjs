/**
 * Röktest för CV-PDF-vägen mot en riktig Chromium.
 *
 * Kör exakt de puppeteer-anrop `client/api/cv-pdf.js` gör — `launch`,
 * `newPage`, `setViewport`, `goto(networkidle0)`, `waitForSelector('.cv-preview')`,
 * `page.pdf({ format, printBackground, preferCSSPageSize })`, `close` — mot
 * `client/dist` serverad statiskt.
 *
 *   node e2e/cv-pdf-puppeteer-rok.cjs
 *
 * Varför den finns: uppgraderingen `puppeteer-core` 24 → 25 (2026-08-22,
 * ROADMAP DR6) var enda vägen bort från GHSA-jmr9-qjv8-65gv, och den är en
 * brytande major på renderaren bakom CV-exporten. Att läsa ändringsloggen
 * räcker inte — det här kör vägen. `@sparticuz/chromium` går inte att köra
 * lokalt (Lambda-binär), så testet använder samma dev-gren som funktionen
 * själv: systemets Chrome via `CHROME_PATH` eller automatisk detektion.
 *
 * Testet säger alltså att API-ytan och renderingen håller. Det säger INTE att
 * Vercels runtime kör rätt Node-version — se `engines.node` i
 * `client/package.json`.
 */
// Uttryckligen client/node_modules: repo-roten har en EGEN puppeteer-core
// (transitiv via `lighthouse` i devDependencies), och det är inte den Vercel
// kör. Utan den här sökvägen testade skriptet fel version — uppmätt: root
// hade 24.43.0 kvar medan client redan låg på 25.8.0.
const path0 = require('path')
const puppeteer = require(path0.join(__dirname, '..', 'client', 'node_modules', 'puppeteer-core'))
const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DIST = path.join(ROOT, 'client', 'dist')

const CV = {
  firstName: 'Sara',
  lastName: 'Testsson',
  title: 'Projektledare',
  email: 'sara@example.com',
  phone: '070-000 00 00',
  location: 'Stockholm',
  summary: 'En kort sammanfattning för röktestet.',
  workExperience: [
    { title: 'Projektledare', company: 'Testbolaget AB', startDate: '2020', endDate: '2024', description: 'Ledde projekt.' },
  ],
  education: [{ degree: 'Systemvetenskap', school: 'Universitetet', startDate: '2016', endDate: '2019' }],
  skills: [{ id: 's1', name: 'Planering' }, { id: 's2', name: 'Budget' }],
  languages: [{ language: 'Svenska', level: 'Modersmål' }],
  template: 'sidebar',
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
}

function detectChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const kandidater = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ]
  return kandidater.find((p) => fs.existsSync(p))
}

function encodeBase64Url(json) {
  return Buffer.from(json, 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

;(async () => {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('FEL: client/dist saknas — kör `npm run build` i client/ först.')
    process.exit(1)
  }
  const exe = detectChrome()
  if (!exe) {
    console.error('FEL: hittade ingen Chrome. Sätt CHROME_PATH.')
    process.exit(1)
  }

  const server = http.createServer((req, res) => {
    const rent = decodeURIComponent(req.url.split('?')[0])
    let fil = path.join(DIST, rent)
    if (!fil.startsWith(DIST) || !fs.existsSync(fil) || fs.statSync(fil).isDirectory()) {
      const kandidat = path.join(fil, 'index.html')
      fil = fs.existsSync(kandidat) ? kandidat : path.join(DIST, 'index.html')
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fil)] || 'application/octet-stream' })
    fs.createReadStream(fil).pipe(res)
  })
  await new Promise((r) => server.listen(0, r))
  const port = server.address().port

  console.log('puppeteer-core:', require(path0.join(__dirname, '..', 'client', 'node_modules', 'puppeteer-core', 'package.json')).version)
  console.log('node:', process.version)
  console.log('chrome:', exe)

  let browser = null
  let kod = 0
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: exe,
      headless: true,
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 1600 })

    const data = encodeBase64Url(JSON.stringify(CV))
    const url = `http://localhost:${port}/#/print/cv?data=${data}&template=sidebar&manual=1`
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
    await page.waitForSelector('.cv-preview', { timeout: 10000 })
    await new Promise((r) => setTimeout(r, 500))

    const pdfData = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true })
    const buf = Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData)

    const namn = await page.evaluate(() => document.querySelector('.cv-preview')?.textContent?.slice(0, 120) || '')

    console.log('pdf-bytes:', buf.length)
    console.log('pdf-magic:', buf.subarray(0, 5).toString('latin1'))
    console.log('sidor:', (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length)
    console.log('text i .cv-preview:', JSON.stringify(namn))

    const ok =
      buf.subarray(0, 5).toString('latin1') === '%PDF-' &&
      buf.length > 20000 &&
      namn.includes('sara@example.com')
    console.log(ok ? '\nOK — puppeteer-core kunde rendera CV:t till PDF.' : '\nFEL — PDF:en ser inte rimlig ut.')
    if (!ok) kod = 1
  } catch (err) {
    console.error('\nFEL:', err && err.message)
    kod = 1
  } finally {
    if (browser) { try { await browser.close() } catch { /* ignore */ } }
    server.close()
  }
  process.exit(kod)
})()
