// Prod-röktest för organisationens AI-brytare (PUB-avvikelse 5, 2026-09-12).
//
// Kör:  NODE_PATH=node_modules node e2e/org-ai-brytare-prod-rok.cjs
// Kräver TEST_USER_EMAIL/PASSWORD (deltagaren) i miljön eller .env.test.local,
// VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY i client/.env, och supabase CLI
// länkad mot prod (brytaren sätts med `db query --linked`).
//
// Steg: 1) sätt organisationens ai_enabled=false → /api/ai ska svara 403 med
// reason org_disabled; 2) sätt tillbaka true → /api/ai ska INTE svara org_disabled.
// Rättat 2026-09-12: skickade `fn:` i stället för `{ function, data }` — steg 2 gav
// 400 "Invalid function: undefined" och bevisade bara att org-grinden släppte igenom.
// (200, eller 403 opted_out om testkontot själv stängt av AI — det räknas som OK,
// det är en annan grind). Brytaren återställs alltid, även vid fel.
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process')
const ROOT = path.join(__dirname, '..')
;(function laddaEnv() {
  for (const f of [path.join(ROOT, '.env.test.local'), path.join(ROOT, 'client', '.env')]) {
    if (!fs.existsSync(f)) continue
    for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
  }
})()
const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://www.jobin.se'
const SB = process.env.VITE_SUPABASE_URL, ANON = process.env.VITE_SUPABASE_ANON_KEY
const EMAIL = process.env.TEST_USER_EMAIL, PW = process.env.TEST_USER_PASSWORD
const ORG = process.env.TEST_ORG_ID || '11111111-1111-4111-8111-111111111111'
if (!SB || !ANON || !EMAIL || !PW) { console.error('Saknar VITE_SUPABASE_URL/ANON_KEY eller TEST_USER_EMAIL/PASSWORD'); process.exit(2) }

function sql(q) { execSync(`npx supabase db query --linked "${q.replace(/"/g, '\\"')}"`, { cwd: ROOT, stdio: 'pipe' }) }
async function token() {
  const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PW }) })
  const j = await r.json(); if (!j.access_token) throw new Error('inloggning misslyckades: ' + JSON.stringify(j).slice(0, 200)); return j.access_token
}
async function anropaAi(tok) {
  const r = await fetch(`${BASE}/api/ai`, { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ function: 'personligt-brev', data: { jobTitle: 'Kock', company: 'Testbolag', tone: 'professionell', cvSummary: 'Kock med fem års erfarenhet.', jobDescription: 'Kock till lunchrestaurang.' } }) })
  let body = null; try { body = await r.json() } catch { /* icke-JSON */ }
  return { status: r.status, body }
}
;(async () => {
  const tok = await token(); let exit = 0
  try {
    sql(`update organizations set ai_enabled=false where id='${ORG}'`)
    const av = await anropaAi(tok)
    const avOk = av.status === 403 && av.body && av.body.reason === 'org_disabled'
    console.log(avOk ? 'OK ' : 'FEL', 'brytare AV → status', av.status, 'reason', av.body && av.body.reason, '|', (av.body && av.body.error || '').slice(0, 90))
    if (!avOk) exit = 1
  } finally {
    sql(`update organizations set ai_enabled=true where id='${ORG}'`)
  }
  const pa = await anropaAi(tok)
  const paOk = !(pa.body && pa.body.reason === 'org_disabled')
  console.log(paOk ? 'OK ' : 'FEL', 'brytare PÅ → status', pa.status, 'reason', pa.body && pa.body.reason)
  if (!paOk) exit = 1
  process.exit(exit)
})().catch((e) => { console.error('FEL', e.message); try { sql(`update organizations set ai_enabled=true where id='${ORG}'`) } catch { /* återställning misslyckades — kontrollera manuellt */ } process.exit(1) })
