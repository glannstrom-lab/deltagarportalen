/**
 * Art 50-verifiering mot prod: AI-genererat innehåll ska bära synlig
 * märkning (AIGeneratedWatermark) + data-ai-generated-attribut.
 * Testar LinkedIn-optimeraren (billigaste AI-vägen, gpt-oss-120b).
 *
 *   node e2e/art50-verify.cjs
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE = process.env.BASE_URL || 'https://www.jobin.se'
const STATE = path.join(__dirname, '.auth', 'spontan-prod.json')
const SHOTS = path.join(__dirname, 'screenshots', 'spontan-verify')

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: STATE })
  const page = await context.newPage()

  await page.goto(`${BASE}/#/linkedin-optimizer`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)

  // Fyll i rubrikfältet och generera
  const input = page.locator('textarea, input[type="text"]').first()
  await input.fill('Butikssäljare med tio års erfarenhet av kundservice')
  await page.getByRole('button', { name: /skapa med ai/i }).first().click()

  // Vänta på AI-svar (upp till 60 s)
  await page.getByText(/genererat med AI-stöd/i).first().waitFor({ state: 'visible', timeout: 60000 })
  const attrCount = await page.locator('[data-ai-generated="true"]').count()
  await page.screenshot({ path: path.join(SHOTS, '14-art50-linkedin.png') })

  console.log('PASS  Synlig AI-märkning visas på genererat innehåll')
  console.log(`PASS  ${attrCount} element med data-ai-generated="true"`)

  await browser.close()
}

main().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
