/**
 * Visuell bugg-scanner @ desktop (1280) + mobil (390).
 * Detekterar per sida: konsol-fel, trasiga bilder (naturalWidth=0),
 * i18n-nyckelläckor (synlig text som ser ut som en oöversatt nyckel),
 * horisontell overflow. Screenshots för manuell granskning.
 *
 * Kör: node e2e/visual-bug-scan.cjs [desktop|mobile]
 */
const { chromium } = require('@playwright/test')
const fs = require('fs'), path = require('path')
;(()=>{const e=path.join(__dirname,'..','.env.test.local');if(!fs.existsSync(e))return
  for(const l of fs.readFileSync(e,'utf8').split(/\r?\n/)){const m=/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(l);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}})()

const PAGES = [
  '/oversikt','/oversikt/historik','/jobb','/karriar','/resurser','/min-vardag',
  '/job-search','/applications','/spontanansökan','/cv','/cover-letter','/interview-simulator',
  '/salary','/linkedin-optimizer','/international','/career','/interest-guide','/skills-gap-analysis',
  '/personal-brand','/education','/knowledge-base','/resources','/print-resources','/externa-resurser',
  '/ai-team','/nätverk','/help','/wellness','/diary','/calendar','/exercises','/my-consultant',
  '/profile','/settings','/steg-till-arbete',
]

const MODE = process.argv[2] || 'desktop'
const VW = MODE === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 900 }

async function scan(page) {
  return page.evaluate((vw) => {
    const out = { broken: [], i18n: [], overflowers: [], hs: document.documentElement.scrollWidth - document.documentElement.clientWidth }
    // Broken images
    for (const img of document.querySelectorAll('img')) {
      if (img.complete && img.naturalWidth === 0 && img.currentSrc) {
        out.broken.push((img.currentSrc || img.src).slice(-60))
      }
    }
    // i18n key leaks — visible text that is entirely a dotted key
    const KEYRE = /^[a-zA-Z][\w-]*(\.[a-zA-Z0-9_-]+){1,}$/
    const TLD = /\.(se|com|org|net|io|eu|js|ts|tsx|json|png|jpe?g|webp|svg|pdf|css|html)$/i
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const seen = new Set()
    let n
    while ((n = walker.nextNode())) {
      const t = (n.textContent || '').trim()
      if (!t || t.length > 60 || t.includes(' ') || t.includes('@') || t.includes('/')) continue
      if (!KEYRE.test(t)) continue
      if (TLD.test(t)) continue
      if (/^\d/.test(t)) continue
      // visible?
      const el = n.parentElement
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none') continue
      if (seen.has(t)) continue
      seen.add(t)
      out.i18n.push(t)
    }
    // Elements overflowing viewport right edge (unclipped)
    for (const el of document.querySelectorAll('main *, [role="dialog"] *, header *')) {
      if (out.overflowers.length > 5) break
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.right > vw + 2 && r.left < vw) {
        let p = el.parentElement, clipped = false
        while (p && p !== document.documentElement) { const c = getComputedStyle(p); if (/auto|hidden|scroll/.test(c.overflowX) || /auto|hidden|scroll/.test(c.overflow)) { clipped = true; break } p = p.parentElement }
        if (!clipped) out.overflowers.push({ tag: el.tagName, cls: (el.className||'').toString().slice(0,50), right: Math.round(r.right) })
      }
    }
    return out
  }, VW.width)
}

async function main() {
  const out = path.join(__dirname, 'screenshots', `visual-bug-${MODE}`)
  fs.mkdirSync(out, { recursive: true })
  const b = await chromium.launch()
  const c = await b.newContext({ viewport: VW, deviceScaleFactor: 1, isMobile: MODE === 'mobile', hasTouch: MODE === 'mobile' })
  await c.addInitScript(()=>{try{localStorage.setItem('jobin_cookie_consent','true')}catch{}})
  const p = await c.newPage()
  const errs = []
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0,160)) })
  p.on('pageerror', e => errs.push('PE: ' + String(e.message).slice(0,160)))

  await p.goto(`http://localhost:3000/#/login?bust=${Date.now()}`,{waitUntil:'networkidle'});await p.waitForTimeout(700)
  await p.locator('input#email').fill(process.env.TEST_USER_EMAIL)
  await p.locator('input#password').fill(process.env.TEST_USER_PASSWORD)
  await p.getByRole('button',{name:/^logga in$/i}).click();await p.waitForTimeout(2500)

  const findings = []
  for (const route of PAGES) {
    try {
      await p.goto(`http://localhost:3000/#${route}?bust=${Date.now()}`,{waitUntil:'domcontentloaded'})
      await p.waitForLoadState('networkidle',{timeout:8000}).catch(()=>{});await p.waitForTimeout(900)
      const s = await scan(p)
      const e = errs.splice(0).filter(x => !/Failed to load resource.*40[0-9]|status of 40/i.test(x)).slice(0,3)
      findings.push({ route, ...s, errors: e })
      const lbl = route.replace(/[\/ä ö]/g, m => ({'/':'_','ä':'a','ö':'o',' ':'_'}[m]||'_'))
      await p.screenshot({ path: path.join(out, `${lbl}.png`), fullPage: false })
    } catch (e) { findings.push({ route, error: String(e.message||e) }); errs.splice(0) }
  }
  await b.close()

  console.log(`\n=== ${MODE.toUpperCase()} (${VW.width}px) — PROBLEM ===`)
  let clean = true
  for (const f of findings) {
    const issues = []
    if (f.error) issues.push('LOAD:'+f.error)
    if (f.hs > 0) issues.push('HS'+f.hs)
    if (f.broken && f.broken.length) issues.push('IMG:'+f.broken.join('|'))
    if (f.i18n && f.i18n.length) issues.push('I18N:'+f.i18n.join(','))
    if (f.overflowers && f.overflowers.length) issues.push('OV:'+f.overflowers.map(o=>o.tag+'('+o.right+')').join(','))
    if (f.errors && f.errors.length) issues.push('ERR:'+f.errors.join(' | '))
    if (issues.length) { clean = false; console.log(f.route.padEnd(24)+' '+issues.join('  ')) }
  }
  if (clean) console.log('✓ Inga problem på '+findings.length+' sidor')
  fs.writeFileSync(path.join(out,'_findings.json'), JSON.stringify(findings,null,2))
  console.log('\nScreenshots:', out)
}
main().catch(e=>{console.error(e);process.exit(1)})
