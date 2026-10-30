// Röktest roadmap-pass 2026-10-30: AIX24 (myndighetsbrev), AIX29 (gor-mindre),
// AIX27 (ratta-stavning), AIX4 (intervju-berattelse) mot skarp drift.
// Kör:  node e2e/roadmap-2026-10-30-ai-prod-rok.cjs   (EFTER deploy)
// Kräver TEST_USER_* (konto med AI PÅ) i .env.test.local, samt client/.env.
// Mäter status, svarstid (gräns 60 s) och att serverns citat-/sifferkontroller
// inte släpper igenom något som inte står i inmatningen.
const fs = require('fs'); const path = require('path')
const ROOT = path.join(__dirname, '..')
for (const f of [path.join(ROOT, '.env.test.local'), path.join(ROOT, 'client', '.env')]) {
  if (!fs.existsSync(f)) continue
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
}
const SB = process.env.VITE_SUPABASE_URL, ANON = process.env.VITE_SUPABASE_ANON_KEY
if (!process.env.TEST_USER_EMAIL || !SB) { console.log('Hoppar över: TEST_USER_* eller VITE_SUPABASE_URL saknas.'); process.exit(0) }
const login = async (email, pw) => {
  const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pw }) })
  const j = await r.json(); if (!j.access_token) throw new Error('inloggning misslyckades: ' + JSON.stringify(j).slice(0, 150)); return j.access_token
}
const anropa = async (tok, fn, data) => {
  const t0 = Date.now()
  const r = await fetch('https://www.jobin.se/api/ai', { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ function: fn, data }) })
  const j = await r.json().catch(() => ({}))
  return { status: r.status, ms: Date.now() - t0, j }
}
const siffror = (s) => (String(s).match(/\d+/g) || [])

const BREV = `Arbetsförmedlingen
Kallelse till möte

Du är kallad till ett möte med din handläggare den 12 november 2026 klockan 10:00.
Mötet sker på Arbetsförmedlingens kontor, Storgatan 4 i Karlstad.
Ta med giltig legitimation och din aktivitetsrapport.
Om du inte kan komma ska du meddela oss senast den 10 november 2026 via Mina sidor eller på telefon 0771-416 416.
Om du uteblir utan giltigt skäl kan det påverka din ersättning.`

;(async () => {
  let fel = 0; const ok = (v, msg) => { console.log(`${v ? 'OK ' : 'FEL'} ${msg}`); if (!v) fel++ }
  const tok = await login(process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD)

  // AIX24
  const b = await anropa(tok, 'myndighetsbrev', { brev: BREV })
  ok(b.status === 200, `myndighetsbrev ${b.status} på ${b.ms} ms`)
  ok(b.ms < 60000, 'myndighetsbrev under 60 s')
  const bText = JSON.stringify(b.j)
  const kalla = siffror(BREV).join(' ')
  const okanda = siffror(bText.replace(/"(ms|status)":\d+/g, '')).filter((x) => !kalla.includes(x))
  ok(okanda.length === 0, `myndighetsbrev: inga siffror utanför brevet (${okanda.join(',') || 'inga'})`)
  console.log('  ' + bText.slice(0, 600))

  // Läkarintyg ska avvisas
  const li = await anropa(tok, 'myndighetsbrev', { brev: 'Läkarintyg. Diagnos: F32.1 medelsvår depressiv episod. Patienten bedöms ha nedsatt arbetsförmåga till 50 % under perioden.' })
  ok(li.status !== 200 || /"avvisad":"halsa"/.test(JSON.stringify(li.j)), `läkarintyg avvisas/flaggas (status ${li.status})`)
  console.log('  ' + JSON.stringify(li.j).slice(0, 200))

  // AIX29
  const g = await anropa(tok, 'gor-mindre', { uppgift: 'Jag måste ringa AF och boka om mitt möte' })
  ok(g.status === 200, `gor-mindre ${g.status} på ${g.ms} ms`)
  console.log('  ' + JSON.stringify(g.j).slice(0, 400))

  // AIX27
  const text = 'Jag har jobat som lagerarbetare i fem år och är van vid truckkörning. Jag tycker om att arbeta i team och är noggran.'
  const s = await anropa(tok, 'ratta-stavning', { text })
  ok(s.status === 200, `ratta-stavning ${s.status} på ${s.ms} ms`)
  console.log('  ' + JSON.stringify(s.j).slice(0, 400))

  // AIX4 — inget resultat sagt: modellen får inte hitta på ett
  const h = await anropa(tok, 'intervju-berattelse', { handelse: 'På mitt förra jobb i butiken var det kaos inför jul. Jag tog ansvar för att ordna schemat.', svar: [] })
  ok(h.status === 200, `intervju-berattelse ${h.status} på ${h.ms} ms`)
  console.log('  ' + JSON.stringify(h.j).slice(0, 500))

  // Pass 2: myndighetsnumret ska stå kvar i svaret (PII-fixen), och AIX2
  const b2 = await anropa(tok, 'myndighetsbrev', { brev: BREV })
  ok(/0771-416 416|0771416416/.test(JSON.stringify(b2.j)) && !/BORTTAGET-BANKKONTO/.test(JSON.stringify(b2.j)), 'myndighetsnumret står kvar (ingen BORTTAGET-BANKKONTO)')
  const v = await anropa(tok, 'vad-har-jag-med-mig', { svar: [{ fraga: 'Hjälper du andra?', text: 'Jag handlar och lagar mat åt min granne varje vecka och har hjälpt honom med pappersarbete.' }, { fraga: 'Ideellt?', text: 'Jag har tränat ett fotbollslag för barn i två säsonger.' }] })
  ok(v.status === 200, `vad-har-jag-med-mig ${v.status} på ${v.ms} ms`)
  console.log('  ' + JSON.stringify(v.j).slice(0, 600))

  console.log(fel ? `\n${fel} fel` : '\nalla kontroller gröna'); process.exit(fel ? 1 : 0)
})().catch((e) => { console.error(e); process.exit(1) })
