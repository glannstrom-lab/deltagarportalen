// Röktest PX1: Perplexity AV för organisationskonton (beslut 2026-09-12).
// Kör:  NODE_PATH=node_modules node e2e/px1-perplexity-org-prod-rok.cjs
// Anropar ai-career-assistant (salary-compass) som TVÅ konton och läser ai_usage_logs.model:
//   TEST_USER_*        (km-deltagare, kopplad till org "Testkommun") → openai/gpt-oss-120b
//   TEST_LEGACY_USER_* (claude-playwright-test, ingen org)          → perplexity/sonar
// OBS: claude-playwright-test har AI AV med flit (inga modellanrop från CI). Slå på ai_enabled
// för kontot i profiles under körningen och stäng av efteråt — annars 403 opted_out och en
// gammal loggrad läses. Skriptet gör det inte självt.
// Skillnaden mellan raderna är beviset. Kräver supabase CLI länkad (loggen läses med db query).
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process')
const ROOT = path.join(__dirname, '..'); const env = {}
for (const f of [path.join(ROOT, '.env.test.local'), path.join(ROOT, 'client', '.env')]) {
  if (!fs.existsSync(f)) continue
  for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
}
const SB = env.VITE_SUPABASE_URL, ANON = env.VITE_SUPABASE_ANON_KEY
async function kor(email, pw, vantad) {
  const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pw }) })
  const j = await r.json(); if (!j.access_token) throw new Error('login ' + email + ': ' + JSON.stringify(j).slice(0, 120))
  const a = await fetch(`${SB}/functions/v1/ai-career-assistant`, { method: 'POST', headers: { Authorization: `Bearer ${j.access_token}`, apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'salary-compass', params: { occupation: 'Kock', region: 'Stockholm', experienceYears: 5, skills: ['à la carte'] } }) })
  const t = await a.text()
  const sql = `select model from ai_usage_logs where user_id='${j.user.id}' order by created_at desc limit 1;`
  const ut = execSync(`npx supabase db query --linked "${sql}" --output json`, { cwd: ROOT, stdio: 'pipe' }).toString()
  const m = (ut.match(/"model"\s*:\s*"([^"]+)"/) || [])[1] || '(ingen logg)'
  const ok = a.status === 200 && m === vantad
  console.log(`[${email}] HTTP ${a.status}, logg model=${m}, väntat ${vantad} → ${ok ? 'OK' : 'FEL'} — ${t.slice(0, 90).replace(/\s+/g, ' ')}`)
  return ok
}
;(async () => {
  const a = await kor(env.TEST_USER_EMAIL, env.TEST_USER_PASSWORD, 'openai/gpt-oss-120b')
  const b = await kor(env.TEST_LEGACY_USER_EMAIL, env.TEST_LEGACY_USER_PASSWORD, 'perplexity/sonar')
  process.exit(a && b ? 0 : 1)
})().catch(e => { console.error(e.message); process.exit(1) })
