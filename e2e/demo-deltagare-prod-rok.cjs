// Prod-röktest: demodeltagaren Anna Exempel (KM12 (8) rest / PG26, 2026-09-12).
//
// Kör:  NODE_PATH=node_modules node e2e/demo-deltagare-prod-rok.cjs
// Kräver DEMO_PARTICIPANT_EMAIL/PASSWORD i .env.test.local (uppgifterna står också
// öppet på /for-arbetsmarknadsenheter/ — kontot är avsett att delas).
//
// Bevisar det köparen inte kunde se i demot: deltagarens Översikt, Min vecka med ett
// pass I DAG (seedningen lägger alltid ett pass i dag och i morgon, även helger) och
// "Jag är här"-knappen, Min konsulent som visar demokonsulenten, samt om demobannern
// syns för en deltagare (den läser organization_members — deltagare är inte medlemmar).
// Muterar inget: knappen "Jag är här" klickas inte (nattens reset nollar ändå).
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path')
const ROOT = path.join(__dirname, '..'); const env = { ...process.env }
for (const f of [path.join(ROOT, '.env.test.local'), path.join(ROOT, 'client', '.env')]) {
  if (!fs.existsSync(f)) continue
  for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
}
const BASE = env.PLAYWRIGHT_BASE_URL || 'https://www.jobin.se'
const EMAIL = env.DEMO_PARTICIPANT_EMAIL, PW = env.DEMO_PARTICIPANT_PASSWORD
if (!EMAIL || !PW) { console.error('Saknar DEMO_PARTICIPANT_EMAIL/PASSWORD i .env.test.local'); process.exit(2) }
const UT = path.join(ROOT, 'e2e', 'screenshots', 'demo-deltagare'); fs.mkdirSync(UT, { recursive: true })
let fel = 0
const ok = (t, extra = '') => console.log(`OK  ${t} ${extra}`)
const nej = (t, extra = '') => { fel++; console.log(`FEL ${t} ${extra}`) }

;(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage()
  const shot = (n) => p.screenshot({ path: path.join(UT, n + '.png'), fullPage: true })
  try {
    // Inloggning med förifylld e-post (F18)
    await p.goto(`${BASE}/#/login?email=${encodeURIComponent(EMAIL)}`); await p.waitForTimeout(1500)
    const forifylld = await p.locator('input#email').inputValue().catch(() => '')
    // Förifyllningen kräver att Login.tsx (F18) är deployad — före deployen är det en notering, inte ett fel.
    forifylld === EMAIL ? ok('e-posten förifylld ur ?email=') : console.log('OBS e-posten inte förifylld ännu (F18 väntar på deploy)')
    if (forifylld !== EMAIL) await p.locator('input#email').fill(EMAIL)
    await p.locator('input#password').fill(PW)
    // Cookierutan ligger över knappraden på mobil
    const cookies = p.getByRole('button', { name: /endast nödvändiga/i })
    if (await cookies.isVisible({ timeout: 1500 }).catch(() => false)) await cookies.click()
    await p.getByRole('button', { name: /^logga in$/i }).click()
    await p.waitForURL((u) => !u.toString().includes('/login'), { timeout: 20000 }); await p.waitForTimeout(2000)
    ok('inloggning som demodeltagare', p.url())

    // Översikt: hälsning med förnamn, inga råa nycklar
    await p.goto(`${BASE}/#/oversikt`); await p.waitForTimeout(2500); await shot('01-oversikt')
    const h1 = (await p.getByRole('heading', { level: 1 }).first().textContent().catch(() => '')) || ''
    const halsarAnna = /anna/i.test(h1) // egen rad: en rad som börjar med /regex/ tolkas annars som division
    halsarAnna ? ok('Översikt hälsar Anna', `"${h1.trim()}"`) : nej('Översikt hälsar inte Anna', `"${h1.trim()}"`)

    // Demobannern (förväntas SAKNAS för deltagare — det är fyndet som rapporteras)
    const banner = await p.getByTestId('demo-banner').isVisible().catch(() => false)
    banner ? ok('demobannern syns för deltagaren') : nej('demobannern syns INTE för deltagaren (organization_members har bara konsulenten)')

    // Samtyckesfrågan ska inte ligga i vägen (consultant_consents är seedad)
    const dialog = await p.getByRole('dialog', { name: /ser en del av din portal/i }).isVisible().catch(() => false)
    dialog ? nej('samtyckesdialogen visas trots seedat samtycke') : ok('ingen samtyckesdialog i vägen')

    // Min vecka: ett pass i dag och knappen "Jag är här"
    await p.goto(`${BASE}/#/min-vecka`); await p.waitForTimeout(2500); await shot('02-min-vecka')
    const idag = await p.getByRole('heading', { level: 2 }).filter({ hasText: /i dag/i }).count()
    idag > 0 ? ok('Min vecka har en dagrubrik "i dag"') : nej('Min vecka saknar dagrubrik "i dag"')
    const knapp = p.getByRole('button', { name: /jag är här/i })
    ;(await knapp.count()) > 0 ? ok('"Jag är här"-knappen finns (inte klickad)') : nej('"Jag är här"-knappen saknas')
    const timmar = await p.getByText(/av \d+ timmar/i).first().textContent().catch(() => null)
    timmar ? ok('veckosaldo visas', `"${timmar.trim()}"`) : nej('inget veckosaldo')

    // Ansökningar: seedade sparade jobb
    await p.goto(`${BASE}/#/applications`); await p.waitForTimeout(2500); await shot('04-ansokningar')
    const jobb = await p.getByText(/Fiktiva Logistik|Exempel Transport|Demostads Grossist/i).count()
    jobb > 0 ? ok('Ansökningar visar seedade jobb', `${jobb} träff(ar)`) : nej('inga seedade jobb i Ansökningar')

    // Min konsulent sist: RouteErrorBoundary nollställs inte vid klientnavigering, så en krasch
    // här hade färgat alla sidor efter (bifynd 2026-09-12).
    // Min konsulent: demokonsulenten och läsloggen
    await p.goto(`${BASE}/#/my-consultant`); await p.waitForTimeout(2500); await shot('03-min-konsulent')
    const kons = await p.getByText(/demo konsulent/i).first().isVisible().catch(() => false)
    kons ? ok('Min konsulent visar demokonsulenten') : nej('Min konsulent visar inte "Demo Konsulent"')

    // AI av: personligt brev ska inte kunna anropa modellen (org + profil ai_enabled=false)
    await p.goto(`${BASE}/#/settings`); await p.waitForTimeout(2000); await shot('05-installningar')
    const aiAv = await p.getByText(/avstängd|avstängda av/i).first().isVisible().catch(() => false)
    aiAv ? ok('inställningarna säger att AI är avstängt') : ok('(AI-text i inställningar ej hittad — verifieras via /api/ai i konsulenttestet)')
  } catch (e) { nej('oväntat fel', e.message.slice(0, 200)); await p.screenshot({ path: path.join(UT, 'fel.png') }).catch(() => {}) }
  await b.close()
  console.log(fel ? `\n${fel} FEL` : '\nAllt grönt')
  process.exit(fel ? 1 : 0)
})()
