/**
 * Verifierar:
 *  1. Profil → DesiredJobsList: yrken visas numrerade, picker fungerar
 *  2. JobSearch → "Hämta från profil"-knapp + occupation chips
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

async function main() {
  const out = path.join(__dirname, 'screenshots', 'desired-jobs')
  fs.mkdirSync(out, { recursive: true })
  const authStatePath = path.join(__dirname, '.auth', 'state.json')

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    storageState: authStatePath,
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()))
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message))

  // ----- 1. PROFIL -----
  console.log('=== 1. Profile / desired jobs ===')
  await page.goto('http://localhost:3000/#/profile', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  // Stäng eventuell onboarding-dialog
  const skipBtn = page.getByRole('button', { name: /Hoppa över|Skip|Stäng|Close/i }).first()
  if (await skipBtn.count() > 0) {
    try { await skipBtn.click({ timeout: 3000 }) } catch { /* ignore */ }
    await page.waitForTimeout(500)
  }
  // Escape som backup
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(out, '01-profile.png'), fullPage: true })

  // Hitta "Lägg till yrke"-knappen och klicka
  const addJobBtn = page.getByRole('button', { name: /Lägg till yrke/i }).first()
  const addJobCount = await addJobBtn.count()
  console.log('  "Lägg till yrke"-knapp count:', addJobCount)

  if (addJobCount > 0) {
    await addJobBtn.click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(out, '02-picker-open.png'), fullPage: false })

    // Skriv i pickern
    const picker = page.locator('input[role="combobox"][placeholder*="Sök yrke"]').first()
    const pickerCount = await picker.count()
    console.log('  Picker visible:', pickerCount > 0)

    if (pickerCount > 0) {
      await picker.fill('lager')
      // Vänta tills AF returnerar — kolla suggestions med polling
      let suggestions = 0
      for (let i = 0; i < 12; i++) {
        await page.waitForTimeout(500)
        suggestions = await page.locator('[role="option"]').count()
        if (suggestions > 0) break
      }
      console.log('  AF suggestions count:', suggestions)
      await page.screenshot({ path: path.join(out, '03-suggestions.png'), fullPage: false })

      if (suggestions > 0) {
        await page.locator('[role="option"]').first().click()
        await page.waitForTimeout(800)
        await page.screenshot({ path: path.join(out, '04-after-pick.png'), fullPage: false })

        const listItems = await page.locator('ol[aria-label="Önskade yrken i prioriteringsordning"] li').count()
        console.log('  List items after pick:', listItems)
      }
    }
  }

  // Vänta lite så att save går igenom
  await page.waitForTimeout(2000)

  // ----- 2. JOBSEARCH -----
  console.log('\n=== 2. JobSearch ===')
  await page.goto('http://localhost:3000/#/job-search', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: path.join(out, '05-jobsearch-collapsed.png'), fullPage: true })

  // Expandera filter om det inte är öppet
  const isCollapsed = await page.locator('text=Klicka för att söka jobb').count()
  if (isCollapsed > 0) {
    await page.getByRole('button', { name: /Sök|Filter|söka jobb/i }).first().click()
    await page.waitForTimeout(400)
  }

  // Hitta "Hämta från profil"-knappen
  const importBtn = page.getByRole('button', { name: /Hämta från profil/i })
  const importCount = await importBtn.count()
  console.log('  "Hämta från profil"-knapp count:', importCount)
  await page.screenshot({ path: path.join(out, '06-jobsearch-expanded.png'), fullPage: true })

  if (importCount > 0) {
    await importBtn.click()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(out, '07-after-import.png'), fullPage: true })

    const chips = await page.locator('li button[aria-label^="Ta bort yrke"]').count()
    console.log('  Occupation chips after import:', chips)
  }

  console.log('\nConsole errors:', errors.length)
  errors.slice(0, 5).forEach((e) => console.log('  ' + e.slice(0, 250)))

  await browser.close()
  console.log('\nSaved to:', out)
}

main().catch((err) => { console.error(err); process.exit(1) })
