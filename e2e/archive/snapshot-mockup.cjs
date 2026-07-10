const { chromium } = require('playwright')
const path = require('path')

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const fileUrl = 'file:///' + path.resolve('e2e/kb-design-mockup.html').replace(/\\/g, '/')

  // Desktop
  const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 1600 } })
  const p1 = await ctx1.newPage()
  await p1.goto(fileUrl, { waitUntil: 'load' })
  await p1.waitForTimeout(300)
  await p1.screenshot({ path: 'kb-mockup-desktop.png', fullPage: true })

  // Mobile
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 1800 } })
  const p2 = await ctx2.newPage()
  await p2.goto(fileUrl, { waitUntil: 'load' })
  await p2.waitForTimeout(300)
  await p2.screenshot({ path: 'kb-mockup-mobile.png', fullPage: true })

  console.log('Klart: kb-mockup-desktop.png, kb-mockup-mobile.png')
  await browser.close()
})()
