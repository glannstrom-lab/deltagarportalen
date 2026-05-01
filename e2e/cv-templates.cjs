/**
 * Renderar alla 6 CV-mallar med exempeldata och fotograferar:
 *  - on-screen preview (visas i högerkolumnen i CVBuilder)
 *  - vector PDF blob (sparas som <slug>.pdf till e2e/screenshots/)
 *
 * Usage: node e2e/cv-templates.cjs
 */

const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

const TEMPLATES = [
  { id: 'sidebar', name: 'Sidokolumn (Modern)' },
  { id: 'centered', name: 'Centrerad' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'creative', name: 'Kreativ' },
  { id: 'executive', name: 'Executive' },
  { id: 'nordic', name: 'Nordisk' },
]

const SAMPLE = {
  firstName: 'Anna', lastName: 'Lindqvist', title: 'Senior Projektledare',
  email: 'anna.lindqvist@example.se', phone: '070-123 45 67', location: 'Stockholm',
  summary: 'Erfaren projektledare med 12 års bakgrund inom digital transformation och teamutveckling. Driver komplexa initiativ från strategi till leverans, alltid med människan i centrum. Specialiserad på agila metoder och cross-functional samarbete.',
  skills: [
    { id: '1', name: 'Projektledning', level: 5, category: 'technical' },
    { id: '2', name: 'Agila metoder (Scrum, Kanban)', level: 5, category: 'technical' },
    { id: '3', name: 'Stakeholder management', level: 4, category: 'soft' },
    { id: '4', name: 'Budget & resursplanering', level: 4, category: 'technical' },
    { id: '5', name: 'Kommunikation', level: 5, category: 'soft' },
    { id: '6', name: 'Förändringsledning', level: 4, category: 'soft' },
  ],
  workExperience: [
    {
      id: '1', company: 'Tech Nordic AB', title: 'Senior Projektledare', location: 'Stockholm',
      startDate: '2021-01', endDate: '', current: true,
      description: 'Leder digital transformation av kundresan för 200+ medarbetare. Levererade plattformsmigration på 18 månader, 30% under budget. Coachar 5 junior-PM:s.'
    },
    {
      id: '2', company: 'Innovation Labs', title: 'Projektledare', location: 'Göteborg',
      startDate: '2017-03', endDate: '2020-12', current: false,
      description: 'Drev 8 parallella IT-projekt med totalt 25 MSEK budget. Införde agila arbetssätt vilket minskade time-to-market med 40%.'
    },
  ],
  education: [
    {
      id: '1', school: 'Handelshögskolan i Stockholm', degree: 'Civilekonom',
      field: 'Strategy & Operations', location: 'Stockholm',
      startDate: '2010-08', endDate: '2014-05', description: ''
    },
  ],
  languages: [
    { id: '1', language: 'Svenska', level: 'native' },
    { id: '2', language: 'Engelska', level: 'fluent' },
    { id: '3', language: 'Tyska', level: 'good' },
  ],
  certificates: [
    { id: '1', name: 'PMP - Project Management Professional', issuer: 'PMI', date: '2019-06' },
    { id: '2', name: 'Scrum Master Certified', issuer: 'Scrum Alliance', date: '2018-03' },
  ],
  links: [],
}

function loadEnv() {
  const envPath = path.join(ROOT, '.env.test.local')
  if (!fs.existsSync(envPath)) throw new Error(`Missing ${envPath}`)
  const env = {}
  for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

async function dismissCookie(page) {
  try {
    const btn = page.getByRole('button', { name: /endast nödvändiga|acceptera/i }).first()
    if (await btn.isVisible({ timeout: 1500 })) {
      await btn.click()
      await page.waitForTimeout(300)
    }
  } catch {}
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  await dismissCookie(page)
  await page.locator('input#email').fill(email)
  await page.locator('input#password').fill(password)
  await page.getByRole('button', { name: /^logga in$/i }).click()
  await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 20000 })
  await page.waitForTimeout(1500)
}

async function ensureLoggedIn(page, context, statePath, env) {
  await page.goto(`${BASE_URL}/#/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1000)
  await dismissCookie(page)
  const isAuth = !(await page.getByRole('heading', { name: /stärk dina deltagare/i }).count())
  if (isAuth) return
  await login(page, env.TEST_USER_EMAIL, env.TEST_USER_PASSWORD)
  await context.storageState({ path: statePath })
}

async function shootPreview(page, slug, screenshotsDir) {
  // Fota en zoomad in-bild på preview-elementet specifikt så vi får CV-arket isolerat
  const preview = page.locator('.cv-preview').first()
  await preview.waitFor({ state: 'visible', timeout: 5000 })
  // Scrolla till toppen av previewen
  await preview.evaluate((el) => el.scrollIntoView({ block: 'start' }))
  await page.waitForTimeout(400)
  const out = path.join(screenshotsDir, `template-${slug}-preview.png`)
  await preview.screenshot({ path: out })
  return out
}

async function main() {
  const env = loadEnv()
  const authDir = path.join(__dirname, '.auth')
  const statePath = path.join(authDir, 'state.json')
  const screenshotsDir = path.join(__dirname, 'screenshots')
  fs.mkdirSync(authDir, { recursive: true })
  fs.mkdirSync(screenshotsDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    storageState: fs.existsSync(statePath) ? statePath : undefined,
  })
  const page = await context.newPage()

  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await ensureLoggedIn(page, context, statePath, env)

  // Förhindra onboarding och seed:a CV-data direkt i Supabase via UI:t hade
  // varit korrekt — men för screenshots räcker det att stoppa in datan i
  // CV-byggarens client state via localStorage 'cv-edit-version' som
  // CVBuilder läser vid mount.
  await page.evaluate(() => {
    localStorage.setItem('cv-onboarding-completed', 'true')
    localStorage.setItem('welcome-seen', 'true')
  })

  await page.goto(`${BASE_URL}/#/cv`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)

  // Avfärda quick-mode om det visas
  const switchBtn = page.getByRole('button', { name: /fullständiga cv-byggaren/i }).first()
  if (await switchBtn.count()) {
    await switchBtn.click()
    await page.waitForTimeout(800)
  }

  // Fyll exempeldata via "Exempeldata"-knappen → confirm-dialog
  const demoBtn = page.getByRole('button', { name: /exempeldata/i }).first()
  if (await demoBtn.count()) {
    await demoBtn.click()
    await page.waitForTimeout(400)
    const confirmBtn = page.getByRole('button', { name: /^Fyll i$|^Fyll$/i }).first()
    if (await confirmBtn.count()) {
      await confirmBtn.click()
      await page.waitForTimeout(800)
    }
  }

  // Lägg till mer realistisk data via window-state — CV-byggaren lyssnar på localStorage
  // Egentligen byter vi mall via klick på template-mall i steg 1.
  // Gå till steg 1 (Design)
  const step1 = page.getByRole('button', { name: /Gå till steg 1/i })
  if (await step1.count()) {
    await step1.click()
    await page.waitForTimeout(500)
  }

  for (const tpl of TEMPLATES) {
    console.log(`\nTemplate: ${tpl.name} (${tpl.id})`)
    // Klicka på mallen — knapparna är text "Sidokolumn", "Centrerad", "Minimal", "Kreativ", "Executive", "Nordisk"
    const tplBtn = page.getByRole('button', { name: new RegExp(`^${tpl.name.split(' ')[0]}$|${tpl.name}`, 'i') }).first()
    // Robustare: hitta knappen via mallnamnet
    const labelMap = {
      sidebar: 'Sidokolumn',
      centered: 'Centrerad',
      minimal: 'Minimal',
      creative: 'Kreativ',
      executive: 'Executive',
      nordic: 'Nordisk',
    }
    const label = labelMap[tpl.id]
    const altBtn = page.locator('button:has(h4)').filter({ hasText: label }).first()
    if (await altBtn.count()) {
      await altBtn.click()
      await page.waitForTimeout(800)
    } else {
      console.log(`  ⚠ Hittade inte mall-knapp för ${label}`)
      continue
    }

    // Vänta på att previewen uppdateras
    await page.waitForTimeout(800)

    // Fota previewen
    try {
      const out = await shootPreview(page, tpl.id, screenshotsDir)
      console.log(`  ✓ Preview: ${path.basename(out)}`)
    } catch (e) {
      console.log(`  ✗ Preview-screenshot misslyckades: ${e.message}`)
    }
  }

  if (errors.length) {
    console.log(`\nConsole errors (${errors.length}):`)
    for (const e of errors.slice(0, 10)) console.log('  ' + e.slice(0, 200))
  } else {
    console.log('\nInga console errors.')
  }

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
