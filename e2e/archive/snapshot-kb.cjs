// Snapshot kunskapsbas-sidan från prod
const { chromium } = require('playwright')
const fs = require('fs')

;(async () => {
  const env = fs.readFileSync('.env.test.local', 'utf-8')
  const email = env.match(/TEST_USER_EMAIL=(.+)/)?.[1]?.trim()
  const password = env.match(/TEST_USER_PASSWORD=(.+)/)?.[1]?.trim()

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  page.on('console', msg => msg.type() === 'error' && console.error('[err]', msg.text()))

  console.log('1. Login...')
  await page.goto('https://www.jobin.se/#/login', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('input#email', { timeout: 30000 })
  await page.fill('input#email', email)
  await page.fill('input#password', password)
  await page.getByRole('button', { name: /^logga in$/i }).click()
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 20000 })

  console.log('2. Navigerar till kunskapsbasen...')
  await page.goto('https://www.jobin.se/#/knowledge-base', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4000)

  console.log('3. Screenshots...')
  await page.screenshot({ path: 'kb-1-foryou.png', fullPage: true })

  // Topics-fliken
  await page.goto('https://www.jobin.se/#/knowledge-base?tab=topics', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'kb-2-topics.png', fullPage: true })

  // Mobil-vy
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('https://www.jobin.se/#/knowledge-base', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'kb-3-mobile.png', fullPage: true })

  console.log('Klart. Filer: kb-1-foryou.png, kb-2-topics.png, kb-3-mobile.png')
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
