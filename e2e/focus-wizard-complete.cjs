/**
 * Driver fokus-wizardar HELA vägen till done-steget och verifierar att
 * slutsteget renderar översatt text (inte råa i18n-nycklar).
 * Klickar "Nästa"/"Fortsätt" upprepat och fyller textfält längs vägen.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs'), path = require('path')
;(()=>{const e=path.join(__dirname,'..','.env.test.local');if(!fs.existsSync(e))return
  for(const l of fs.readFileSync(e,'utf8').split(/\r?\n/)){const m=/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(l);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}})()
const out=path.join(__dirname,'screenshots','focus-wizard');fs.mkdirSync(out,{recursive:true})
async function leaks(p){return p.evaluate(()=>{const re=/^[a-z][\w-]*(\.[a-zA-Z0-9_-]+){1,}$/;const tld=/\.(se|com|org|net|io|webp|png|svg)$/i;const hits=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;const seen=new Set();while((n=w.nextNode())){const t=(n.textContent||'').trim();if(!t||t.includes(' ')||t.includes('/')||t.includes('@')||t.length>70)continue;if(!re.test(t)||tld.test(t)||/^\d/.test(t))continue;const el=n.parentElement;if(!el)continue;const r=el.getBoundingClientRect();if(r.width===0||r.height===0)continue;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')continue;if(!seen.has(t)){seen.add(t);hits.push(t)}}return hits})}
async function driveWizard(p, route, label){
  await p.goto(`http://localhost:3000/#${route}?bust=${Date.now()}`,{waitUntil:'domcontentloaded'})
  await p.waitForLoadState('networkidle',{timeout:8000}).catch(()=>{});await p.waitForTimeout(1200)
  let allLeaks=new Set()
  for(let step=0;step<8;step++){
    (await leaks(p)).forEach(x=>allLeaks.add(x))
    // fyll synliga textfält så "Nästa" aktiveras
    const inputs=await p.locator('main input[type="text"]:visible, main textarea:visible').all().catch(()=>[])
    for(const inp of inputs){ const v=await inp.inputValue().catch(()=>'x'); if(!v)await inp.fill('Test').catch(()=>{}) }
    await p.waitForTimeout(150)
    // hitta nästa/fortsätt/klart-knapp
    const next=p.locator('button:has-text("Nästa"), button:has-text("Fortsätt"), button:has-text("Klar"), button:has-text("Spara")').first()
    if(!(await next.count())||!(await next.isEnabled().catch(()=>false))) break
    await next.click().catch(()=>{}); await p.waitForTimeout(700)
  }
  ;(await leaks(p)).forEach(x=>allLeaks.add(x))
  await p.screenshot({path:path.join(out,label+'-done.png')})
  console.log(label+': '+(allLeaks.size?[...allLeaks].join(', '):'rent genom alla steg'))
}
async function main(){
  const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})
  await c.addInitScript(()=>{try{localStorage.setItem('jobin_cookie_consent','true');localStorage.setItem('VITE_HUB_NAV_ENABLED','true');localStorage.setItem('deltagarportal-settings',JSON.stringify({state:{focusMode:true},version:0}))}catch{}})
  const p=await c.newPage()
  await p.goto(`http://localhost:3000/#/login?bust=${Date.now()}`,{waitUntil:'networkidle'});await p.waitForTimeout(700)
  await p.locator('input#email').fill(process.env.TEST_USER_EMAIL);await p.locator('input#password').fill(process.env.TEST_USER_PASSWORD)
  await p.getByRole('button',{name:/^logga in$/i}).click();await p.waitForTimeout(2500)
  // Aktivera fokusläge via UI (Supabase-sync nollställer localStorage vid login)
  await p.goto(`http://localhost:3000/#/settings?bust=${Date.now()}`,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500)
  await p.locator('button:has-text("Tillgänglighet")').first().click().catch(()=>{});await p.waitForTimeout(1500)
  // Fokusläge = första switchen i tillgänglighets-panelen
  let toggled='?'
  const sw=p.getByRole('switch').first()
  if(await sw.count()){ const before=await sw.getAttribute('aria-checked').catch(()=>null); if(before!=='true'){await sw.click().catch(()=>{});toggled='klickade på (var '+before+')'}else toggled='redan på' }
  else toggled='ingen switch hittad'
  await p.waitForTimeout(800)
  const fm=await p.evaluate(()=>{try{return JSON.parse(localStorage.getItem('deltagarportal-settings')||'{}')?.state?.focusMode}catch{return '?'}})
  console.log('Fokusläge-toggle:',toggled,'| store.focusMode=',fm,'\n')
  for(const [route,label] of [['/education','education'],['/profile','profile'],['/interview-simulator','interview'],['/spontanansökan','spontaneous'],['/skills-gap-analysis','skillsGap'],['/wellness','wellness'],['/diary','diary'],['/career','career']]){
    await driveWizard(p,route,label)
  }
  await b.close();console.log('\n',out)
}
main().catch(e=>{console.error(e);process.exit(1)})
