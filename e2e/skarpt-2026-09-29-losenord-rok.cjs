// Prodröktest: glömt lösenord (PUB-1). Utloggad → /glomt-losenord → skicka. Körs med vanlig playwright (ingen inloggning).
const { chromium } = require('playwright')
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 390, height: 844 } })
  const natverk = []
  p.on('response', (r) => { if (/losenord-aterstall/.test(r.url())) natverk.push(r.status()) })
  await p.goto('https://www.jobin.se/#/login')
  await p.waitForTimeout(4000)
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click().catch(() => {})
  await p.getByRole('link', { name: /Glömt lösenordet/ }).click()
  await p.waitForTimeout(2000)
  await p.getByLabel(/E-post/i).fill(process.argv[2])
  await p.getByRole('button', { name: /Skicka länk/ }).click()
  await p.waitForTimeout(5000)
  console.log('svar', natverk, (await p.locator('main').innerText()).slice(0, 300))
  await b.close()
})()
