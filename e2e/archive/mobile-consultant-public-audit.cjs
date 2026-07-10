/**
 * Mobil-audit av publika sidor (ingen auth) + konsulent-vyer (consultant.json).
 * Fold + full screenshots @ 360px. Mäter horizontal scroll, overflow, EB, fel.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs'), path = require('path')

const PUBLIC = [
  { path: '/login', label: 'pub-login' },
  { path: '/register', label: 'pub-register' },
  { path: '/privacy', label: 'pub-privacy' },
  { path: '/terms', label: 'pub-terms' },
  { path: '/ai-policy', label: 'pub-ai-policy' },
  { path: '/tillganglighet', label: 'pub-tillganglighet' },
]
const CONSULTANT = [
  { path: '/consultant', label: 'cons-overview' },
  { path: '/consultant/participants', label: 'cons-participants' },
  { path: '/consultant/analytics', label: 'cons-analytics' },
  { path: '/consultant/communication', label: 'cons-communication' },
  { path: '/consultant/resources', label: 'cons-resources' },
  { path: '/consultant/settings', label: 'cons-settings' },
  { path: '/konsulent/steg-till-arbete', label: 'cons-sta' },
  { path: '/admin', label: 'admin' },
]
const VIEWPORT = { w: 360, h: 740 }

async function measure(page) {
  return page.evaluate((vw) => {
    const d = document.documentElement
    const horizScroll = d.scrollWidth - d.clientWidth
    const overflowing = []
    for (const el of document.querySelectorAll('main *, body > div *')) {
      if (overflowing.length > 5) break
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.right > vw + 1 && r.left < vw + 50) {
        let pp = el.parentElement, clipped = false
        while (pp && pp !== d) { const cs = getComputedStyle(pp); if (/auto|hidden|scroll/.test(cs.overflowX) || /auto|hidden|scroll/.test(cs.overflow)) { clipped = true; break } pp = pp.parentElement }
        if (!clipped) overflowing.push({ tag: el.tagName, cls: (el.className||'').toString().slice(0,50) })
      }
    }
    const h1 = document.querySelector('main h1, h1')
    const errBoundary = (document.body.textContent?.includes('Något gick fel') && document.body.textContent?.includes('Ladda om')) || false
    const onLogin = !!document.querySelector('input#email')
    return { horizScroll, h1: h1 ? h1.textContent.slice(0,50) : null, errBoundary, onLogin, overflowing }
  }, VIEWPORT.w)
}

async function run(pages, storageState, prefix, out) {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: VIEWPORT.w, height: VIEWPORT.h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, storageState })
  await ctx.addInitScript(() => { try { localStorage.setItem('jobin_cookie_consent','true');  } catch {} })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', m => { if (m.type()==='error') errs.push(m.text().slice(0,160)) })
  page.on('pageerror', e => errs.push('pageerror: '+String(e.message).slice(0,160)))
  const findings = []
  for (const p of pages) {
    try {
      await page.goto(`http://localhost:3000/#${p.path}?bust=${Date.now()}`, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(()=>{})
      await page.waitForTimeout(1200)
      const m = await measure(page)
      findings.push({ path: p.path, ...m, errors: errs.splice(0).slice(0,3) })
      await page.screenshot({ path: path.join(out, `${p.label}-fold.png`), fullPage: false })
      await page.screenshot({ path: path.join(out, `${p.label}-full.png`), fullPage: true })
    } catch (e) { findings.push({ path: p.path, error: String(e.message||e) }); errs.splice(0) }
  }
  await ctx.close(); await browser.close()
  return findings
}

async function main() {
  const out = path.join(__dirname, 'screenshots', 'mobile-consultant-public')
  fs.mkdirSync(out, { recursive: true })
  const consAuth = path.join(__dirname, '.auth', 'consultant.json')

  console.log('--- PUBLIC (no auth) ---')
  const pub = await run(PUBLIC, undefined, 'pub', out)
  console.log('--- CONSULTANT/ADMIN (consultant.json) ---')
  const cons = await run(CONSULTANT, fs.existsSync(consAuth) ? consAuth : undefined, 'cons', out)

  const all = [...pub, ...cons]
  console.log('\n=== SUMMARY ===')
  for (const f of all) {
    if (f.error) { console.log('ERR  '+f.path+': '+f.error); continue }
    const fl=[]; if(f.errBoundary)fl.push('EB'); if(f.onLogin)fl.push('LOGIN'); if(f.horizScroll>0)fl.push('HS'+f.horizScroll); if(f.overflowing&&f.overflowing.length)fl.push('OV'+f.overflowing.length); if(f.errors&&f.errors.length)fl.push('console'+f.errors.length)
    console.log((fl.join(',')||'ok').padEnd(16)+' '+f.path.padEnd(34)+' h1="'+f.h1+'"')
  }
  console.log('\n=== DETAILS ===')
  for (const f of all) if (!f.error && (f.errBoundary||f.horizScroll>0||(f.overflowing&&f.overflowing.length)||(f.errors&&f.errors.length))) console.log(JSON.stringify({path:f.path,hs:f.horizScroll,ov:f.overflowing,eb:f.errBoundary,errors:f.errors}))
  fs.writeFileSync(path.join(out,'_findings.json'), JSON.stringify(all,null,2))
  console.log('\nScreenshots:', out)
}
main().catch(e=>{console.error(e);process.exit(1)})
