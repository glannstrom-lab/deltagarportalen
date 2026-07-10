const { chromium } = require('@playwright/test')
const fs = require('fs'), path = require('path')
;(()=>{const e=path.join(__dirname,'..','.env.test.local');if(!fs.existsSync(e))return
  for(const l of fs.readFileSync(e,'utf8').split(/\r?\n/)){const m=/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(l);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}})()
const out=path.join(__dirname,'screenshots','deep-state');fs.mkdirSync(out,{recursive:true})
async function keyLeaks(p){return p.evaluate(()=>{const re=/^[a-z][\w-]*(\.[a-zA-Z0-9_-]+){1,}$/;const tld=/\.(se|com|org|net|io|webp|png)$/i;const hits=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;const seen=new Set();while((n=w.nextNode())){const t=(n.textContent||'').trim();if(!t||t.includes(' ')||t.includes('/')||t.includes('@')||t.length>60)continue;if(!re.test(t)||tld.test(t)||/^\d/.test(t))continue;const el=n.parentElement;if(!el)continue;const r=el.getBoundingClientRect();if(r.width===0||r.height===0)continue;if(!seen.has(t)){seen.add(t);hits.push(t)}}return hits})}
async function main(){
  const b=await chromium.launch()
  const c=await b.newContext({viewport:{width:1280,height:900}})
  await c.addInitScript(()=>{try{localStorage.setItem('jobin_cookie_consent','true')}catch{}})
  const p=await c.newPage()
  await p.goto(`http://localhost:3000/#/login?bust=${Date.now()}`,{waitUntil:'networkidle'});await p.waitForTimeout(700)
  await p.locator('input#email').fill(process.env.TEST_USER_EMAIL);await p.locator('input#password').fill(process.env.TEST_USER_PASSWORD)
  await p.getByRole('button',{name:/^logga in$/i}).click();await p.waitForTimeout(2500)
  await p.goto(`http://localhost:3000/#/calendar?bust=${Date.now()}`,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500)
  await p.locator('button:has-text("Ny händelse")').first().click().catch(()=>{});await p.waitForTimeout(700)
  // Välj Intervju-typ för att trigga Förberedelse/Resa-flikar
  await p.locator('button:has-text("Intervju")').first().click().catch(()=>{});await p.waitForTimeout(500)
  console.log('efter Intervju-val, leaks:',JSON.stringify(await keyLeaks(p)))
  await p.screenshot({path:path.join(out,'calendar-modal-interview.png')})
  // Uppgifter-flik
  await p.locator('button:has-text("Uppgifter")').first().click().catch(()=>{});await p.waitForTimeout(500)
  await p.screenshot({path:path.join(out,'calendar-modal-tasks.png')})
  console.log('tasks-flik leaks:',JSON.stringify(await keyLeaks(p)))
  // Förberedelse-flik (om finns)
  const prep=p.locator('button:has-text("Förberedelse")')
  if(await prep.count()){await prep.last().click().catch(()=>{});await p.waitForTimeout(600);await p.screenshot({path:path.join(out,'calendar-modal-prep.png')});console.log('prep-flik leaks:',JSON.stringify(await keyLeaks(p)))}
  // Resa-flik
  const travel=p.locator('button:has-text("Resa")')
  if(await travel.count()){await travel.last().click().catch(()=>{});await p.waitForTimeout(600);await p.screenshot({path:path.join(out,'calendar-modal-travel.png')});console.log('travel-flik leaks:',JSON.stringify(await keyLeaks(p)))}
  await b.close();console.log('done')
}
main().catch(e=>{console.error(e);process.exit(1)})
