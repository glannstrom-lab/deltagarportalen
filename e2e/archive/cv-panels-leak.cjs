const { chromium } = require('@playwright/test')
const fs = require('fs'), path = require('path')
;(()=>{const e=path.join(__dirname,'..','.env.test.local');if(!fs.existsSync(e))return
  for(const l of fs.readFileSync(e,'utf8').split(/\r?\n/)){const m=/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(l);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}})()
const out=path.join(__dirname,'screenshots','cv-panels');fs.mkdirSync(out,{recursive:true})
async function leaks(p){return p.evaluate(()=>{const re=/^[a-z][\w-]*(\.[a-zA-Z0-9_-]+){1,}$/;const tld=/\.(se|com|org|net|io|webp|png|svg)$/i;const hits=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;const seen=new Set();while((n=w.nextNode())){const t=(n.textContent||'').trim();if(!t||t.includes(' ')||t.includes('/')||t.includes('@')||t.length>70)continue;if(!re.test(t)||tld.test(t)||/^\d/.test(t))continue;const el=n.parentElement;if(!el)continue;const r=el.getBoundingClientRect();if(r.width===0||r.height===0)continue;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')continue;if(!seen.has(t)){seen.add(t);hits.push(t)}}return hits})}
async function main(){
  const b=await chromium.launch();const c=await b.newContext({viewport:{width:1280,height:900}})
  await c.addInitScript(()=>{try{localStorage.setItem('jobin_cookie_consent','true')}catch{}})
  const p=await c.newPage()
  await p.goto(`http://localhost:3000/#/login?bust=${Date.now()}`,{waitUntil:'networkidle'});await p.waitForTimeout(700)
  await p.locator('input#email').fill(process.env.TEST_USER_EMAIL);await p.locator('input#password').fill(process.env.TEST_USER_PASSWORD)
  await p.getByRole('button',{name:/^logga in$/i}).click();await p.waitForTimeout(2500)
  await p.goto(`http://localhost:3000/#/cv?bust=${Date.now()}`,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500)
  console.log('cv landing: '+((await leaks(p)).join(', ')||'rent'))
  // klicka igenom hero-flikar
  for(const tab of ['Dina CV','Anpassa','Anpassa mot jobb']){
    const btn=p.locator('button:has-text("'+tab+'"), a:has-text("'+tab+'")').first()
    if(await btn.count()){await btn.click().catch(()=>{});await p.waitForTimeout(1200);const lk=await leaks(p);console.log('cv/'+tab+': '+(lk.length?lk.join(', '):'rent'));await p.screenshot({path:path.join(out,'cv-'+tab.replace(/ /g,'_')+'.png')})}
  }
  // Öppna CV-byggaren (Skapa CV) och leta efter AI/anpassa-knappar
  await p.goto(`http://localhost:3000/#/cv?bust=${Date.now()}`,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1200)
  const skapa=p.locator('button:has-text("Skapa CV"), a:has-text("Skapa CV")').first()
  if(await skapa.count()){await skapa.click().catch(()=>{});await p.waitForTimeout(1500)
    // stäng ev onboarding
    const skip=p.locator('button:has-text("Hoppa över")').first();if(await skip.count())await skip.click().catch(()=>{});await p.waitForTimeout(800)
    console.log('cv builder: '+((await leaks(p)).join(', ')||'rent'))
    await p.screenshot({path:path.join(out,'cv-builder.png'),fullPage:true})
    // leta efter "Anpassa mot jobb" / AI-knappar i byggaren
    for(const lab of ['Anpassa mot jobb','AI','Anpassa']){const btn=p.locator('button:has-text("'+lab+'")').first();if(await btn.count()){await btn.click().catch(()=>{});await p.waitForTimeout(1000);const lk=await leaks(p);console.log('builder/'+lab+': '+(lk.length?lk.join(', '):'rent'));await p.screenshot({path:path.join(out,'builder-'+lab.replace(/ /g,'_')+'.png')});break}}
  }
  await b.close();console.log('\n',out)
}
main().catch(e=>{console.error(e);process.exit(1)})
