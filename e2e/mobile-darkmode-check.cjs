const { chromium } = require('@playwright/test')
const fs = require('fs'), path = require('path')
;(()=>{const e=path.join(__dirname,'..','.env.test.local');if(!fs.existsSync(e))return
  for(const l of fs.readFileSync(e,'utf8').split(/\r?\n/)){const m=/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(l);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}})()
const PAGES=[
  {p:'/oversikt',l:'dark-oversikt'},{p:'/cv',l:'dark-cv'},{p:'/job-search',l:'dark-job-search'},
  {p:'/wellness',l:'dark-wellness'},{p:'/ai-team',l:'dark-ai-team'},{p:'/knowledge-base',l:'dark-knowledge-base'},
  {p:'/settings',l:'dark-settings'},{p:'/diary',l:'dark-diary'},
  {p:'/applications',l:'dark-applications'},{p:'/salary',l:'dark-salary'},
  {p:'/interview-simulator',l:'dark-interview'},{p:'/profile',l:'dark-profile'},
  {p:'/career',l:'dark-career'},{p:'/cover-letter',l:'dark-cover-letter'},
]
async function main(){
  const out=path.join(__dirname,'screenshots','mobile-darkmode');fs.mkdirSync(out,{recursive:true})
  const b=await chromium.launch()
  const c=await b.newContext({viewport:{width:360,height:740},deviceScaleFactor:2,isMobile:true,hasTouch:true})
  await c.addInitScript(()=>{try{localStorage.setItem('jobin_cookie_consent','true');localStorage.setItem('VITE_HUB_NAV_ENABLED','true');localStorage.setItem('theme','dark')}catch{}})
  const p=await c.newPage()
  await p.goto(`http://localhost:3000/#/login?bust=${Date.now()}`,{waitUntil:'networkidle'});await p.waitForTimeout(700)
  await p.locator('input#email').fill(process.env.TEST_USER_EMAIL);await p.locator('input#password').fill(process.env.TEST_USER_PASSWORD)
  await p.getByRole('button',{name:/^logga in$/i}).click();await p.waitForTimeout(2500)
  for(const x of PAGES){
    await p.goto(`http://localhost:3000/#${x.p}?bust=${Date.now()}`,{waitUntil:'domcontentloaded'})
    await p.waitForLoadState('networkidle',{timeout:8000}).catch(()=>{});await p.waitForTimeout(1100)
    const m=await p.evaluate(()=>{const d=document.documentElement;return{dark:d.classList.contains('dark'),hs:d.scrollWidth-d.clientWidth}})
    console.log(`${x.l.padEnd(24)} dark=${m.dark} hs=${m.hs}`)
    await p.screenshot({path:path.join(out,`${x.l}.png`),fullPage:false})
  }
  await b.close();console.log('\n',out)
}
main().catch(e=>{console.error(e);process.exit(1)})
