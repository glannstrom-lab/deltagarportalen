/**
 * Djupgranskning av tillstånd som landningsvyer missar:
 *  - Konsulent-portalen på DESKTOP (consultant.json)
 *  - Interaktiva modaler/flöden (kalender "Ny händelse", jobbdetalj, CV-steg)
 * Mäter overflow + konsol-fel, screenshots för manuell granskning.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs'), path = require('path')
;(()=>{const e=path.join(__dirname,'..','.env.test.local');if(!fs.existsSync(e))return
  for(const l of fs.readFileSync(e,'utf8').split(/\r?\n/)){const m=/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(l);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}})()

const DESK = { width: 1280, height: 900 }
const out = path.join(__dirname, 'screenshots', 'deep-state')
fs.mkdirSync(out, { recursive: true })

async function ov(p){ return p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth) }
async function shot(p,name){ await p.screenshot({path:path.join(out,name+'.png'),fullPage:false}); console.log(name.padEnd(34)+' hs='+await ov(p)) }

async function consultantDesktop(browser){
  const auth = path.join(__dirname,'.auth','consultant.json')
  const c = await browser.newContext({ viewport: DESK, storageState: fs.existsSync(auth)?auth:undefined })
  await c.addInitScript(()=>{try{localStorage.setItem('jobin_cookie_consent','true');localStorage.setItem('VITE_HUB_NAV_ENABLED','true')}catch{}})
  const p = await c.newPage()
  const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,140))});p.on('pageerror',e=>errs.push('PE:'+String(e.message).slice(0,140)))
  const routes=[['/consultant','cons-d-overview'],['/consultant/participants','cons-d-participants'],['/consultant/analytics','cons-d-analytics'],['/consultant/communication','cons-d-communication'],['/consultant/resources','cons-d-resources'],['/consultant/settings','cons-d-settings'],['/konsulent/steg-till-arbete','cons-d-sta']]
  for(const [route,label] of routes){
    await p.goto(`http://localhost:3000/#${route}?bust=${Date.now()}`,{waitUntil:'domcontentloaded'})
    await p.waitForLoadState('networkidle',{timeout:8000}).catch(()=>{});await p.waitForTimeout(1100)
    const e=errs.splice(0).filter(x=>!/40[0-9]|status of 40/.test(x)).slice(0,2)
    await shot(p,label); if(e.length)console.log('   ERR:',e.join(' | '))
  }
  await c.close()
}

async function participantFlows(browser){
  const c = await browser.newContext({ viewport: DESK })
  await c.addInitScript(()=>{try{localStorage.setItem('jobin_cookie_consent','true');localStorage.setItem('VITE_HUB_NAV_ENABLED','true')}catch{}})
  const p = await c.newPage()
  const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,140))});p.on('pageerror',e=>errs.push('PE:'+String(e.message).slice(0,140)))
  await p.goto(`http://localhost:3000/#/login?bust=${Date.now()}`,{waitUntil:'networkidle'});await p.waitForTimeout(700)
  await p.locator('input#email').fill(process.env.TEST_USER_EMAIL);await p.locator('input#password').fill(process.env.TEST_USER_PASSWORD)
  await p.getByRole('button',{name:/^logga in$/i}).click();await p.waitForTimeout(2500)

  // Kalender "Ny händelse"-modal
  await p.goto(`http://localhost:3000/#/calendar?bust=${Date.now()}`,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500)
  const ny=p.locator('button:has-text("Ny händelse")').first()
  if(await ny.count()){ await ny.click().catch(()=>{}); await p.waitForTimeout(800); await shot(p,'flow-calendar-modal') } else console.log('kalender-modal: knapp ej hittad')

  // Jobbdetalj — sök sedan klicka första jobbet
  await p.goto(`http://localhost:3000/#/job-search?bust=${Date.now()}`,{waitUntil:'domcontentloaded'});await p.waitForTimeout(2500)
  const firstJob=p.locator('main [role="button"]').first()
  if(await firstJob.count()){ await firstJob.click().catch(()=>{}); await p.waitForTimeout(1200); await shot(p,'flow-job-detail') } else console.log('jobbdetalj: inget jobb hittat')

  // Interview simulator — fyll roll + starta
  await p.goto(`http://localhost:3000/#/interview-simulator?bust=${Date.now()}`,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500)
  const roleInput=p.locator('input[type="text"]').first()
  if(await roleInput.count()){ await roleInput.fill('Lagerarbetare').catch(()=>{}); await p.waitForTimeout(300); await shot(p,'flow-interview-filled') }

  // CV builder — gå in i Skapa CV
  await p.goto(`http://localhost:3000/#/cv?bust=${Date.now()}`,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500)
  const skapa=p.locator('button:has-text("Skapa CV"), a:has-text("Skapa CV")').first()
  if(await skapa.count()){ await skapa.click().catch(()=>{}); await p.waitForTimeout(1500); await shot(p,'flow-cv-builder') }

  // Settings — Tillgänglighet-flik (a11y settings ofta buggiga)
  await p.goto(`http://localhost:3000/#/settings?bust=${Date.now()}`,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1200)
  const a11y=p.locator('button:has-text("Tillgänglighet")').first()
  if(await a11y.count()){ await a11y.click().catch(()=>{}); await p.waitForTimeout(700); await shot(p,'flow-settings-a11y') }

  const e=errs.splice(0).filter(x=>!/40[0-9]|status of 40/.test(x)).slice(0,4)
  if(e.length)console.log('FLOW CONSOLE ERRORS:',e.join(' | '))
  await c.close()
}

async function main(){
  const b=await chromium.launch()
  console.log('--- KONSULENT DESKTOP ---'); await consultantDesktop(b)
  console.log('--- DELTAGAR-FLÖDEN DESKTOP ---'); await participantFlows(b)
  await b.close(); console.log('\n',out)
}
main().catch(e=>{console.error(e);process.exit(1)})
