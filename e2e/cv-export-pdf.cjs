/**
 * Loggar in, går till CV-byggaren, byter mellan alla 6 templates,
 * triggar Exportera PDF → Ladda ner och sparar varje PDF till
 * e2e/screenshots/exported-<id>.pdf.
 *
 * Läs sedan PDF:erna med Read-tool för att verifiera designen.
 *
 * Usage: node e2e/cv-export-pdf.cjs
 */

const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEMPLATES = ['sidebar', 'centered', 'minimal', 'creative', 'executive', 'nordic']

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
    if (await btn.isVisible({ timeout: 1500 })) { await btn.click(); await page.waitForTimeout(300) }
  } catch {}
}

async function ensureLoggedIn(page, context, statePath, env) {
  await page.goto(`${BASE_URL}/#/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await dismissCookie(page)
  const isAuth = !(await page.getByRole('heading', { name: /stärk dina deltagare/i }).count())
  if (isAuth) return
  await page.goto(`${BASE_URL}/#/login`)
  await page.waitForTimeout(800)
  await page.locator('input#email').fill(env.TEST_USER_EMAIL)
  await page.locator('input#password').fill(env.TEST_USER_PASSWORD)
  await page.getByRole('button', { name: /^logga in$/i }).click()
  await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 20000 })
  await page.waitForTimeout(1500)
  await context.storageState({ path: statePath })
}

async function main() {
  const env = loadEnv()
  const authDir = path.join(__dirname, '.auth')
  const statePath = path.join(authDir, 'state.json')
  const outDir = path.join(__dirname, 'screenshots')
  fs.mkdirSync(authDir, { recursive: true })
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: fs.existsSync(statePath) ? statePath : undefined,
    acceptDownloads: true,
  })
  await context.addInitScript(() => {
    localStorage.setItem('jobin_cookie_consent', 'true')
    localStorage.setItem('jobin_cookie_preferences', JSON.stringify({ necessary: true, analytics: false }))
    localStorage.setItem('cv-onboarding-completed', 'true')
    localStorage.setItem('welcome-seen', 'true')
  })
  const page = await context.newPage()

  page.on('pageerror', (err) => console.log(`[pageerror] ${err.message}`))
  page.on('console', (m) => { if (m.type() === 'error') console.log(`[console.error] ${m.text().slice(0, 200)}`) })

  await ensureLoggedIn(page, context, statePath, env)
  await page.goto(`${BASE_URL}/#/cv`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  // Hoppa förbi quick-mode
  const quickHeading = page.getByRole('heading', { name: /välkommen till cv-byggaren/i })
  if (await quickHeading.count()) {
    const switchBtn = page.getByRole('button', { name: /fullständiga cv-byggaren/i }).first()
    if (await switchBtn.count()) {
      await switchBtn.click()
      await page.waitForTimeout(800)
    }
  }

  // Fyll exempeldata via "Exempeldata"-knappen
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

  const labelMap = {
    sidebar: 'Sidokolumn',
    centered: 'Centrerad',
    minimal: 'Minimal',
    creative: 'Kreativ',
    executive: 'Executive',
    nordic: 'Nordisk',
  }

  for (const tpl of TEMPLATES) {
    console.log(`\nTemplate: ${tpl}`)

    // Navigera till steg 1 om vi inte redan är där
    const step1Btn = page.getByRole('button', { name: /Gå till steg 1/i }).first()
    if (await step1Btn.count()) {
      await step1Btn.click()
      await page.waitForTimeout(500)
    }

    // Klicka mall
    const tplBtn = page.locator('button:has(h4)').filter({ hasText: labelMap[tpl] }).first()
    if (await tplBtn.count()) {
      await tplBtn.click()
      await page.waitForTimeout(800)
    } else {
      console.log(`  ⚠ Hittade inte mall-knapp för ${labelMap[tpl]}`)
      continue
    }

    // CVBuilder använder showPreview={false} så knappen triggar direkt download.
    const exportBtn = page.getByRole('button', { name: /Exportera PDF/i }).first()
    if (!(await exportBtn.count())) {
      console.log(`  ⚠ Hittade inte Exportera PDF-knapp`)
      continue
    }
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 })
    await exportBtn.click()

    try {
      const download = await downloadPromise
      const out = path.join(outDir, `exported-${tpl}.pdf`)
      await download.saveAs(out)
      const size = fs.statSync(out).size
      console.log(`  ✓ ${path.relative(ROOT, out)} (${(size / 1024).toFixed(1)} kB)`)
    } catch (e) {
      console.log(`  ✗ Download timeout: ${e.message.slice(0, 100)}`)
    }

    // Stäng eventuell dialog
    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(500)
  }

  await browser.close()
}

main().catch((err) => { console.error(err); process.exit(1) })
