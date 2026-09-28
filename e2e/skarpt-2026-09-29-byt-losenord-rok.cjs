// Prodröktest: Byt lösenord i Inställningar (BP6). argv: <e-post> <nuvarande> <nytt>
const { chromium } = require('playwright')
const [epost, nu, nytt] = process.argv.slice(2)
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } })
  await p.goto('https://www.jobin.se/#/login'); await p.waitForTimeout(4000)
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click().catch(() => {})
  await p.locator('#email').fill(epost); await p.locator('#password').fill(nu)
  await p.getByRole('button', { name: /^Logga in/ }).click(); await p.waitForTimeout(6000)
  // samtyckessteget för ett nytt konto
  const steg = p.getByRole('dialog', { name: /ett steg kvar/i })
  if (await steg.isVisible().catch(() => false)) {
    const r = steg.getByRole('checkbox'); for (let i = 0; i < await r.count(); i++) { if ((await r.nth(i).getAttribute('id')) !== 'samtycke-ai') await r.nth(i).check() }
    await steg.getByRole('button', { name: /godkänn och fortsätt/i }).click(); await p.waitForTimeout(3000)
  }
  await p.goto('https://www.jobin.se/#/settings'); await p.waitForTimeout(4000)
  await p.keyboard.press('Escape').catch(() => {})
  await p.getByRole('button', { name: /^Säkerhet/ }).first().click(); await p.waitForTimeout(1500)
  await p.getByLabel(/Nuvarande lösenord/).fill(nu)
  await p.getByLabel('Nytt lösenord', { exact: true }).fill(nytt)
  await p.getByLabel(/Skriv det nya lösenordet igen/).fill(nytt)
  await p.getByRole('button', { name: /Uppdatera lösenord/ }).click(); await p.waitForTimeout(5000)
  console.log('svar:', await p.getByText(/Lösenordet är bytt|stämmer inte|kunde inte|uppfyller inte/).first().innerText().catch(() => 'ingen rad'))
  await p.screenshot({ path: process.env.UT || 'byt.png' })
  await b.close()
})()
