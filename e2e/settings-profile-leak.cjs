const { chromium } = require('@playwright/test')
const fs = require('fs'), path = require('path')
;(()=>{const e=path.join(__dirname,'..','.env.test.local');if(!fs.existsSync(e))return
  for(const l of fs.readFileSync(e,'utf8').split(/\r?\n/)){const m=/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(l);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}})()
const out=path.join(__dirname,'screenshots','settings-leak');fs.mkdirSync(out,{recursive:true})
async function leaks(p){return p.evaluate(()=>{const re=/^[a-z][\w-]*(\.[a-zA-Z0-9_-]+){1,}$/;const tld=/\.(se|com|org|net|io|webp|png|svg)$/i;const hits=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;const seen=new Set();while((n=w.nextNode())){const t=(n.textContent||'').trim();if(!t||t.includes(' ')||t.includes('/')||t.includes('@')||t.length>70)continue;if(!re.test(t)||tld.test(t)||/^\d/.test(t))continue;const el=n.parentElement;if(!el)continue;const r=el.getBoundingClientRect();if(r.width===0||r.height===0)continue;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')continue;if(!seen.has(t)){seen.add(t);hits.push(t)}}return hits})}
async function main(){
  const b=await chromium.launch();const c=await b.newContext({viewport:{width:1280,height:900}})
  await c.addInitScript(()=>{try{localStorage.setItem('jobin_cookie_consent','true');localStorage.setItem('VITE_HUB_NAV_ENABLED','true')}catch{}})
  const p=await c.newPage()
  await p.goto(`http://localhost:3000/#/login?bust=${Date.now()}`,{waitUntil:'networkidle'});await p.waitForTimeout(700)
  await p.locator('input#email').fill(process.env.TEST_USER_EMAIL);await p.locator('input#password').fill(process.env.TEST_USER_PASSWORD)
  await p.getByRole('button',{name:/^logga in$/i}).click();await p.waitForTimeout(2500)
  // Settings sub-tabs
  await p.goto(`http://localhost:3000/#/settings?bust=${Date.now()}`,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500)
  for(const tab of ['Profil','Tillgänglighet','Notifikationer','Utseende','Integritet','Säkerhet']){
    const btn=p.locator('button:has-text("'+tab+'")').first()
    if(await btn.count()){await btn.click().catch(()=>{});await p.waitForTimeout(700);const lk=await leaks(p);console.log('settings/'+tab+': '+(lk.length?lk.join(', '):'rent'));await p.screenshot({path:path.join(out,'settings-'+tab.replace(/[äå]/g,'a').replace(/ö/g,'o')+'.png')})}
  }
  // Profile page
  await p.goto(`http://localhost:3000/#/profile?bust=${Date.now()}`,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500)
  console.log('profile: '+((await leaks(p)).join(', ')||'rent'));await p.screenshot({path:path.join(out,'profile.png'),fullPage:true})
  await b.close();console.log('\n',out)
}
main().catch(e=>{console.error(e);process.exit(1)})
