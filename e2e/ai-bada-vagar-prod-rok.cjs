// Röktest: riktiga AI-anrop mot prod via BÅDA backenderna (A1, 2026-09-12).
// 1) /api/ai (Vercel) med personligt-brev  2) ai-career-assistant (Supabase edge) med salary-compass
// Kör:  NODE_PATH=node_modules node e2e/ai-bada-vagar-prod-rok.cjs
// Kräver TEST_USER_EMAIL/PASSWORD i .env.test.local (ett konto med AI PÅ — km-deltagare) och client/.env.
// Används efter nyckelrotation, deploy av ai.js eller ändring i _shared/aiGate.ts.
const fs = require('fs'); const path = require('path')
const ROOT = path.join(__dirname, '..')
for (const f of [path.join(ROOT, '.env.test.local'), path.join(ROOT, 'client', '.env')]) {
  if (!fs.existsSync(f)) continue
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
}
const SB = process.env.VITE_SUPABASE_URL, ANON = process.env.VITE_SUPABASE_ANON_KEY
const EMAIL = process.env.TEST_USER_EMAIL, PW = process.env.TEST_USER_PASSWORD
;(async () => {
  const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PW }) })
  const j = await r.json(); if (!j.access_token) { console.error('inloggning misslyckades', JSON.stringify(j).slice(0, 200)); process.exit(2) }
  const tok = j.access_token
  let exit = 0
  // Väg 1: Vercel
  const a = await fetch('https://www.jobin.se/api/ai', { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ function: 'personligt-brev', data: { jobTitle: 'Kock', company: 'Testbolag', tone: 'professionell', cvSummary: 'Kock med fem års erfarenhet.', jobDescription: 'Kock till lunchrestaurang.' } }) })
  const at = await a.text()
  const aok = a.status === 200 && at.length > 200
  console.log(`[Vercel /api/ai] HTTP ${a.status}, ${at.length} tecken ${aok ? 'OK' : 'FEL'} — ${at.slice(0, 160).replace(/\s+/g, ' ')}`)
  if (!aok) exit = 1
  // Väg 2: Supabase edge
  const b = await fetch(`${SB}/functions/v1/ai-career-assistant`, { method: 'POST', headers: { Authorization: `Bearer ${tok}`, apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'salary-compass', params: { occupation: 'Kock', region: 'Stockholm', experienceYears: 5, skills: ['à la carte'] } }) })
  const bt = await b.text()
  const bok = b.status === 200 && /"success"\s*:\s*true/.test(bt)
  console.log(`[Supabase edge ai-career-assistant] HTTP ${b.status}, ${bt.length} tecken ${bok ? 'OK' : 'FEL'} — ${bt.slice(0, 160).replace(/\s+/g, ' ')}`)
  if (!bok) exit = 1
  process.exit(exit)
})().catch(e => { console.error(e); process.exit(1) })
