// Prodröktest: länken ur återställningsmejlet → nytt lösenord → inloggning → byt i Inställningar.
// argv: <länk> <e-post> <nytt lösenord> <lösenord nr 2>
const { chromium } = require('playwright')
const [lank, epost, nytt, nytt2] = process.argv.slice(2)
async function login(b, pw) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } })
  await p.goto('https://www.jobin.se/#/login'); await p.waitForTimeout(4000)
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click().catch(() => {})
  await p.locator('#email').fill(epost); await p.locator('#password').fill(pw)
  await p.getByRole('button', { name: /^Logga in/ }).click(); await p.waitForTimeout(6000)
  return p
}
;(async () => {
  const b = await chromium.launch()
  const p = await (await b.newContext()).newPage({ viewport: { width: 390, height: 844 } })
  await p.goto(lank); await p.waitForTimeout(6000)
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click().catch(() => {})
  console.log('sida:', (await p.locator('main').innerText()).slice(0, 120).replace(/\n/g, ' | '))
  await p.getByLabel('Nytt lösenord', { exact: true }).fill(nytt)
  await p.getByLabel(/Skriv det nya lösenordet igen/).fill(nytt)
  await p.getByRole('button', { name: /Spara lösenordet/ }).click(); await p.waitForTimeout(4000)
  console.log('efter spara:', (await p.locator('main').innerText()).slice(0, 160).replace(/\n/g, ' | '))
  // länken en gång till, i ny kontext
  const p2 = await (await b.newContext()).newPage(); await p2.goto(lank); await p2.waitForTimeout(6000)
  console.log('återanvänd länk:', (await p2.locator('main').innerText()).slice(0, 160).replace(/\n/g, ' | '))
  // inloggning med nytt lösenord
  const p3 = await login(await b.newContext(), nytt)
  console.log('inloggad efter återställning:', !/login/.test(p3.url()), p3.url())
  // byt i Inställningar
  await p3.goto('https://www.jobin.se/#/settings'); await p3.waitForTimeout(4000)
  const sak = p3.getByRole('button', { name: /Säkerhet|Konto och säkerhet|Security/ }).first()
  await sak.click().catch(() => {}); await p3.waitForTimeout(1500)
  await p3.getByLabel(/Nuvarande lösenord/).fill(nytt)
  await p3.getByLabel('Nytt lösenord', { exact: true }).fill(nytt2)
  await p3.getByLabel(/Skriv det nya lösenordet igen/).fill(nytt2)
  await p3.getByRole('button', { name: /Uppdatera lösenord/ }).click(); await p3.waitForTimeout(4000)
  console.log('byt i inställningar:', await p3.getByText(/Lösenordet är bytt|stämmer inte|kunde inte/).first().innerText().catch(() => 'ingen rad'))
  const p4 = await login(await b.newContext(), nytt2)
  console.log('inloggad med lösenord 2:', !/login/.test(p4.url()))
  await b.close()
})()
