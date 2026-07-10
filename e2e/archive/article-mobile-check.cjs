const { chromium } = require('@playwright/test')
const fs = require('fs'), path = require('path')
;(()=>{const e=path.join(__dirname,'..','.env.test.local');if(!fs.existsSync(e))return
  for(const l of fs.readFileSync(e,'utf8').split(/\r?\n/)){const m=/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(l);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}})()
const ARTICLES=['nystartsjobb-guide','loneforhandling-guide']
async function main(){
  const out=path.join(__dirname,'screenshots','mobile-full-audit');fs.mkdirSync(out,{recursive:true})
  const b=await chromium.launch()
  const c=await b.newContext({viewport:{width:360,height:740},deviceScaleFactor:2,isMobile:true,hasTouch:true})
  await c.addInitScript(()=>{try{localStorage.setItem('jobin_cookie_consent','true')}catch{}})
  const p=await c.newPage()
  const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,140))});p.on('pageerror',e=>errs.push('PE:'+String(e.message).slice(0,140)))
  await p.goto(`http://localhost:3000/#/login?bust=${Date.now()}`,{waitUntil:'networkidle'});await p.waitForTimeout(700)
  await p.locator('input#email').fill(process.env.TEST_USER_EMAIL);await p.locator('input#password').fill(process.env.TEST_USER_PASSWORD)
  await p.getByRole('button',{name:/^logga in$/i}).click();await p.waitForTimeout(2500)
  for(const id of ARTICLES){
    await p.goto(`http://localhost:3000/#/knowledge-base/article/${id}?bust=${Date.now()}`,{waitUntil:'domcontentloaded'})
    await p.waitForLoadState('networkidle',{timeout:8000}).catch(()=>{});await p.waitForTimeout(3000)
    const m=await p.evaluate((vw)=>{const d=document.documentElement;const h1=document.querySelector('main h1,h1');return{hs:d.scrollWidth-d.clientWidth,h1:h1?h1.textContent.slice(0,50):null,eb:(document.body.textContent||'').includes('Något gick fel')&&(document.body.textContent||'').includes('Ladda om')}},360)
    console.log(`article/${id}: hs=${m.hs} eb=${m.eb} h1="${m.h1}" errs=${errs.splice(0).length}`)
    await p.screenshot({path:path.join(out,`article-${id}-fold.png`),fullPage:false})
  }
  await b.close()
}
main().catch(e=>{console.error(e);process.exit(1)})
