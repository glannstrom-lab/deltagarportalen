const { chromium } = require('@playwright/test')
const fs = require('fs'), path = require('path')
;(() => { const e = path.join(__dirname,'..','.env.test.local'); if(!fs.existsSync(e))return
  for(const l of fs.readFileSync(e,'utf8').split(/\r?\n/)){const m=/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(l); if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}})()

async function main(){
  const b = await chromium.launch()
  const c = await b.newContext({ viewport:{width:360,height:740}, isMobile:true, hasTouch:true })
  await c.addInitScript(()=>{try{localStorage.setItem('jobin_cookie_consent','true');localStorage.setItem('VITE_HUB_NAV_ENABLED','true')}catch{}})
  const p = await c.newPage()
  p.on('console', async (msg)=>{
    if(msg.type()==='error' && msg.text().includes('same key')){
      try { const args = await Promise.all(msg.args().map(a=>a.jsonValue().catch(()=>'?'))); console.log('DUPKEY ARGS:', JSON.stringify(args)) }
      catch(e){ console.log('raw:', msg.text()) }
    }
  })
  await p.goto(`http://localhost:3000/#/login?bust=${Date.now()}`,{waitUntil:'networkidle'})
  await p.waitForTimeout(700)
  await p.locator('input#email').fill(process.env.TEST_USER_EMAIL)
  await p.locator('input#password').fill(process.env.TEST_USER_PASSWORD)
  await p.getByRole('button',{name:/^logga in$/i}).click()
  await p.waitForTimeout(2500)
  await p.goto(`http://localhost:3000/#/job-search?bust=${Date.now()}`,{waitUntil:'domcontentloaded'})
  await p.waitForLoadState('networkidle',{timeout:9000}).catch(()=>{})
  await p.waitForTimeout(2500)
  await b.close()
}
main().catch(e=>{console.error(e);process.exit(1)})
