// Röktest: ett RIKTIGT inbjudningsmejl via send-invite-email + Resend (DE1, 2026-09-12).
// Kör:  NODE_PATH=node_modules node e2e/mejl-inbjudan-prod-rok.cjs <mottagare, t.ex. din+tagg@gmail.com>
// Loggar in som TEST_LEGACY_CONSULTANT (claude-playwright-consultant; sätt TEST_LEGACY_CONSULTANT_EMAIL/PASSWORD i miljön för ett annat konto, t.ex. DEMO_*), lägger en rad i
// invitations och anropar funktionen. Läs sedan "Visa original" i Gmail: SPF/DKIM/DMARC = PASS.
// OBS: generateLink({type:'invite'}) skapar en pending-användare i auth.users + profiles för
// adressen. RADERA testraderna efteråt (invitations, profiles, auth.users på adressen) —
// annars gallras inbjudan efter 90 dagar men kontot blir kvar.
const fs=require('fs'); const env={ ...process.env } // miljövariabler vinner över filerna (så DEMO_* kan skickas in)
for (const f of ['.env.test.local','client/.env']) for (const l of fs.readFileSync(f,'utf8').split(/\r?\n/)) { const m=l.match(/^([A-Z_]+)=(.*)$/); if(m&&!env[m[1]]) env[m[1]]=m[2].replace(/^["']|["']$/g,'') }
const SB=env.VITE_SUPABASE_URL, ANON=env.VITE_SUPABASE_ANON_KEY
const TO=process.argv[2]
;(async()=>{
  const r=await fetch(`${SB}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:ANON,'Content-Type':'application/json'},body:JSON.stringify({email:env.TEST_LEGACY_CONSULTANT_EMAIL,password:env.TEST_LEGACY_CONSULTANT_PASSWORD})})
  const j=await r.json(); if(!j.access_token) throw new Error('login: '+JSON.stringify(j).slice(0,150)); const tok=j.access_token, uid=j.user.id
  const H={apikey:ANON,Authorization:`Bearer ${tok}`,'Content-Type':'application/json'}
  const ins=await fetch(`${SB}/rest/v1/invitations`,{method:'POST',headers:{...H,Prefer:'return=representation'},body:JSON.stringify({email:TO,role:'USER',invited_by:uid,consultant_id:uid,metadata:{first_name:'Mikael',last_name:'Test',message:'DE1-röktest: verifiering av DKIM/DMARC för jobin.se via Resend.'}})})
  const row=(await ins.json()); if(!ins.ok) throw new Error('insert: '+JSON.stringify(row).slice(0,200)); const inv=row[0]; console.log('inbjudan', inv.id)
  const fn=await fetch(`${SB}/functions/v1/send-invite-email`,{method:'POST',headers:{...H,Origin:'https://www.jobin.se'},body:JSON.stringify({invitationId:inv.id})})
  console.log('funktion HTTP', fn.status, (await fn.text()).slice(0,300))
  const back=await fetch(`${SB}/rest/v1/invitations?id=eq.${inv.id}&select=email_sent,email_sent_at,email_error`,{headers:H}); console.log('rad efteråt', await back.text())
})().catch(e=>{console.error(e.message);process.exit(1)})
