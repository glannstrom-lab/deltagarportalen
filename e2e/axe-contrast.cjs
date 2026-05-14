/**
 * Kör axe-core på huvudsidorna och listar color-contrast-violations
 * med målbeskrivning så vi kan fixa exakt element.
 */
const { chromium } = require('@playwright/test')
const { AxeBuilder } = require('@axe-core/playwright')
const fs = require('fs')
const path = require('path')

const PAGES = [
  { url: 'http://localhost:3000/', name: 'landing', auth: false },
  { url: 'http://localhost:3000/#/login', name: 'login', auth: false },
  { url: 'http://localhost:3000/#/oversikt', name: 'oversikt', auth: true },
  { url: 'http://localhost:3000/#/profile', name: 'profile', auth: true },
  { url: 'http://localhost:3000/#/cv', name: 'cv', auth: true },
  { url: 'http://localhost:3000/#/job-search', name: 'jobsearch', auth: true },
  { url: 'http://localhost:3000/#/karriar', name: 'karriar', auth: true },
  { url: 'http://localhost:3000/#/min-vardag', name: 'min-vardag', auth: true },
  { url: 'http://localhost:3000/#/wellness', name: 'wellness', auth: true },
]

async function main() {
  const authStatePath = path.join(__dirname, '.auth', 'state.json')
  const browser = await chromium.launch()
  const allFailures = []

  for (const p of PAGES) {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      storageState: p.auth ? authStatePath : undefined,
    })
    const page = await ctx.newPage()
    try {
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 20000 })
      await page.waitForTimeout(2000)
      // Stäng onboarding-modal om finns
      try { await page.getByRole('button', { name: /Hoppa över|Skip|Stäng/i }).first().click({ timeout: 1500 }) } catch {}
      await page.keyboard.press('Escape').catch(() => {})
      await page.waitForTimeout(400)

      const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze()
      const cc = results.violations.find(v => v.id === 'color-contrast')
      if (cc) {
        console.log(`\n[${p.name}] ${cc.nodes.length} color-contrast violations`)
        cc.nodes.slice(0, 5).forEach((n, i) => {
          console.log(`  ${i + 1}. target=${n.target.join(' ')}`)
          console.log(`     html: ${(n.html || '').slice(0, 150)}`)
          // axe ger oss förväntade/faktiska contrast values
          const summary = (n.failureSummary || '').replace(/\n/g, ' ').slice(0, 200)
          console.log(`     fail: ${summary}`)
          allFailures.push({
            page: p.name,
            target: n.target.join(' '),
            html: (n.html || '').slice(0, 200),
            summary: (n.failureSummary || '').slice(0, 300),
          })
        })
      } else {
        console.log(`[${p.name}] ✓ no color-contrast violations`)
      }
    } catch (err) {
      console.log(`[${p.name}] ERROR: ${err.message.slice(0, 100)}`)
    }
    await ctx.close()
  }

  fs.writeFileSync(
    path.join(__dirname, 'screenshots', 'axe-contrast-failures.json'),
    JSON.stringify(allFailures, null, 2),
  )
  console.log(`\n\nTotal failures: ${allFailures.length}`)
  await browser.close()
}

main().catch(err => { console.error(err); process.exit(1) })
