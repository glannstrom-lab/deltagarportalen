// Röktest AIX25 (2026-10-27): Lätt svenska i AI-svaren, mätt med LIX mot skarpa svar.
// Kör:  node e2e/latt-ai-prod-rok.cjs        (först EFTER att AIX25 är deployad)
// Kräver TEST_USER_* (konto med AI PÅ) i .env.test.local, samt client/.env.
// Anropar chatbot på www.jobin.se med och utan sprak:'sv-latt' och kräver att
// de lätta svaren ligger under LIX_TAK_LATT och under de vanliga svarens snitt.
// Modellsvar varierar: ett enskilt svar över taket är en varning om snittet håller.
const fs = require('fs'); const path = require('path')
const ROOT = path.join(__dirname, '..')
for (const f of [path.join(ROOT, '.env.test.local'), path.join(ROOT, 'client', '.env')]) {
  if (!fs.existsSync(f)) continue
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
}
const { lix, LIX_TAK_LATT } = require('../client/api/_prompts/_lix.js')
const SB = process.env.VITE_SUPABASE_URL, ANON = process.env.VITE_SUPABASE_ANON_KEY
if (!process.env.TEST_USER_EMAIL || !SB) { console.log('Hoppar över: TEST_USER_* eller VITE_SUPABASE_URL saknas.'); process.exit(0) }
const login = async (email, pw) => {
  const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pw }) })
  const j = await r.json(); if (!j.access_token) throw new Error('inloggning misslyckades: ' + JSON.stringify(j).slice(0, 150)); return j.access_token
}
const FRAGOR = [
  'Hur hittar jag ett jobb när jag har varit arbetslös länge?',
  'Vad ska jag skriva i mitt CV om jag saknar erfarenhet?',
  'Jag orkar inte söka jobb just nu. Vad kan jag göra?',
]
const anropa = async (tok, meddelande, sprak) => {
  const r = await fetch('https://www.jobin.se/api/ai', { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ function: 'chatbot', data: { meddelande, ...(sprak ? { sprak } : {}) } }) })
  const j = await r.json().catch(() => ({}))
  const text = typeof j.svar === 'string' ? j.svar : typeof j.result === 'string' ? j.result : typeof j.data === 'string' ? j.data : JSON.stringify(j)
  return { status: r.status, text: text.trim() }
}
const snitt = a => a.reduce((x, y) => x + y, 0) / a.length
;(async () => {
  let fel = 0; const ok = (v, msg) => { console.log(`${v ? 'OK ' : 'FEL'} ${msg}`); if (!v) fel++ }
  const tok = await login(process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD)
  const lattLix = [], vanligLix = []
  for (const f of FRAGOR) {
    const l = await anropa(tok, f, 'sv-latt'), v = await anropa(tok, f, null)
    ok(l.status === 200 && l.text.length > 20, `latt ${l.status}: "${f}"`)
    ok(v.status === 200 && v.text.length > 20, `vanlig ${v.status}: "${f}"`)
    const a = lix(l.text), b = lix(v.text)
    console.log(`  latt LIX ${a.lix.toFixed(1)} (${a.ord} ord, ${a.meningar} mening.) | vanlig LIX ${b.lix.toFixed(1)}\n  ${l.text.replace(/\n+/g, ' ').slice(0, 300)}`)
    lattLix.push(a.lix); vanligLix.push(b.lix)
    if (a.lix >= LIX_TAK_LATT) console.log(`VARNING enskilt svar över taket ${LIX_TAK_LATT}`)
  }
  ok(snitt(lattLix) < LIX_TAK_LATT, `snitt-LIX lätt ${snitt(lattLix).toFixed(1)} < ${LIX_TAK_LATT}`)
  ok(snitt(lattLix) < snitt(vanligLix), `lätt (${snitt(lattLix).toFixed(1)}) är lättare än vanlig (${snitt(vanligLix).toFixed(1)})`)
  console.log(fel ? `\n${fel} fel` : '\nalla kontroller gröna'); process.exit(fel ? 1 : 0)
})().catch(e => { console.error(e); process.exit(1) })
