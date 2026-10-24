// Röktest AIX10 (2026-10-24): personligt-brev i tre längder mot prod + AI-av-kontot.
// Kör:  node e2e/aix10-brevlangd-prod-rok.cjs
// Kräver TEST_USER_* (AI PÅ) och TEST_LEGACY_USER_* (AI AV) i .env.test.local, samt client/.env.
// Kontrollerar: mejl ≤ 3 meningar/≤ 80 ord, chatt ≤ 2 meningar/≤ 45 ord, ingen hälsning/signatur
// i de korta, inget påhittat arbetsgivarnamn ur luften, brevet oförändrat långt, och 403 för AI av.
const fs = require('fs'); const path = require('path')
const ROOT = path.join(__dirname, '..')
for (const f of [path.join(ROOT, '.env.test.local'), path.join(ROOT, 'client', '.env')]) {
  if (!fs.existsSync(f)) continue
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
}
const SB = process.env.VITE_SUPABASE_URL, ANON = process.env.VITE_SUPABASE_ANON_KEY
const login = async (email, pw) => {
  const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pw }) })
  const j = await r.json(); if (!j.access_token) throw new Error('inloggning misslyckades: ' + JSON.stringify(j).slice(0, 150)); return j.access_token
}
const DATA = {
  jobTitle: 'Lagerarbetare', companyName: 'Testlager AB', tone: 'professionell',
  jobDescription: 'Vi söker en lagerarbetare till vårt lager i Jönköping. Truckkort är meriterande. Du plockar och packar order.',
  cvData: { title: 'Lagerarbetare', summary: 'Tre års erfarenhet av orderplock.', workExperience: [{ title: 'Orderplockare', company: 'Postnord' }], skills: [{ name: 'Truckkort A+B' }] },
}
const anropa = async (tok, langd) => {
  const r = await fetch('https://www.jobin.se/api/ai', { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ function: 'personligt-brev', data: { ...DATA, ...(langd ? { langd } : {}) } }) })
  const t = await r.text(); let text = t
  try { const j = JSON.parse(t); text = j.brev || j.result || j.content || j.data?.content || j.data || t; if (typeof text !== 'string') text = JSON.stringify(text) } catch {}
  return { status: r.status, text: text.trim() }
}
const meningar = s => s.split(/(?<=[.!?])\s+/).filter(x => x.trim().length > 2).length
const ord = s => s.split(/\s+/).filter(Boolean).length
const halsning = /^(hej|hejsan|bästa|kära|till )/i, signatur = /(med vänlig hälsning|mvh|vänliga hälsningar|\[ditt namn\]|\[namn\])/i
;(async () => {
  let fel = 0; const ok = (v, msg) => { console.log(`${v ? 'OK ' : 'FEL'} ${msg}`); if (!v) fel++ }
  const tok = await login(process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD)
  for (const [langd, maxM, maxO] of [['mejl', 3, 80], ['chatt', 2, 45]]) {
    const { status, text } = await anropa(tok, langd)
    console.log(`\n[${langd}] HTTP ${status}, ${meningar(text)} meningar, ${ord(text)} ord:\n${text}\n`)
    ok(status === 200 && text.length > 20, `${langd}: svar med innehåll`)
    ok(meningar(text) <= maxM, `${langd}: högst ${maxM} meningar`)
    ok(ord(text) <= maxO, `${langd}: högst ${maxO} ord`)
    ok(!halsning.test(text) && !signatur.test(text), `${langd}: ingen hälsning eller signatur`)
  }
  const b = await anropa(tok, null)
  console.log(`\n[brev] HTTP ${b.status}, ${ord(b.text)} ord`)
  ok(b.status === 200 && ord(b.text) >= 180, 'brev: fullt brev som förut (≥ 180 ord)')
  const okand = await anropa(tok, '../hack')
  ok(okand.status === 200 && ord(okand.text) >= 180, 'okänd längd faller tillbaka på fullt brev')
  const tokAv = await login(process.env.TEST_LEGACY_USER_EMAIL, process.env.TEST_LEGACY_USER_PASSWORD)
  const av = await anropa(tokAv, 'mejl')
  ok(av.status === 403, `AI av: HTTP ${av.status} (väntat 403)`)
  console.log(fel ? `\n${fel} fel` : '\nalla kontroller gröna'); process.exit(fel ? 1 : 0)
})().catch(e => { console.error(e); process.exit(1) })
