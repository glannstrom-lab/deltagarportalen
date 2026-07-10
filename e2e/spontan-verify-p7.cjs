/**
 * Fokuserad P7-verifiering mot prod: uppföljning ska synas på
 * Spontanansökan-kortet i Jobb-hubben ("Uppföljning <datum>").
 * Skapar företag + uppföljning, kollar hubben, städar upp.
 *
 *   node e2e/spontan-verify-p7.cjs
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE = process.env.BASE_URL || 'https://www.jobin.se'
const STATE = path.join(__dirname, '.auth', 'spontan-prod.json')
const SHOTS = path.join(__dirname, 'screenshots', 'spontan-verify')
const ORG_NR = '5560747551'

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: STATE })
  const page = await context.newPage()

  // 1. Spara företag via org.nr
  await page.goto(`${BASE}/#/spontanansökan`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  await page.getByRole('button', { name: /Org\.nummer/ }).click()
  await page.locator('input[placeholder*="Organisationsnummer"]').fill(ORG_NR)
  await page.getByRole('button', { name: /^Sök$/ }).click()
  const h3 = page.locator('h3').filter({ hasNotText: /Tips/ }).first()
  await h3.waitFor({ state: 'visible', timeout: 30000 })
  const companyName = (await h3.textContent()).trim()
  await page.getByRole('button', { name: /Spara företag/ }).click()
  await page.getByText(/har sparats/).first().waitFor({ state: 'visible', timeout: 15000 })
  console.log('Sparade:', companyName)

  // 2. Status → Kontaktad, uppföljning om 1 vecka
  await page.goto(`${BASE}/#/spontanansökan/mina-foretag`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  await page.getByRole('button', { name: 'Åtgärder för företag' }).first().click()
  await page.getByRole('button', { name: /Markera som: Kontaktad/ }).click()
  await page.getByText(/Status ändrad till/).first().waitFor({ state: 'visible', timeout: 15000 })
  await page.getByRole('button', { name: 'Om 1 vecka' }).click()
  await page.getByText(/^Uppföljning: \d/).first().waitFor({ state: 'visible', timeout: 15000 })
  console.log('Uppföljning satt (+7 dagar)')

  // 3. Jobb-hubben — kortet ska visa "Uppföljning <datum>"
  await page.goto(`${BASE}/#/jobb`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3500)
  await page.screenshot({ path: path.join(SHOTS, '13-hub-uppfoljning.png') })
  const pill = await page.getByText(/^Uppföljning \d+ [a-zåäö]+$/).count()
  console.log(pill > 0
    ? 'PASS  Hubbkortet visar "Uppföljning <datum>" (P7)'
    : 'FAIL  Ingen uppföljningspill på hubbkortet')

  // 4. Cleanup
  await page.goto(`${BASE}/#/spontanansökan/mina-foretag`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  await page.getByRole('button', { name: 'Åtgärder för företag' }).first().click()
  await page.getByRole('button', { name: /^Ta bort$/ }).click()
  await page.getByText('Är du säker på att du vill ta bort detta företag?').waitFor({ state: 'visible', timeout: 5000 })
  await page.getByRole('button', { name: /^Ta bort$/ }).last().click()
  await page.getByText(/har tagits bort/).first().waitFor({ state: 'visible', timeout: 15000 })
  console.log('Cleanup klar — företaget borttaget')

  await browser.close()
  process.exit(pill > 0 ? 0 : 1)
}

main().catch((e) => { console.error(e); process.exit(1) })
