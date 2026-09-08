/**
 * Hit-test: täcker något fixerat lager de interaktiva elementen på mobil?
 *
 *   node e2e/mat-bottennav-hittest.cjs                      # /job-search, dev :3000
 *   BASE_URL=http://localhost:3010 node e2e/mat-bottennav-hittest.cjs
 *   BASE_URL=https://www.jobin.se node e2e/mat-bottennav-hittest.cjs /job-search /applications
 *
 * Kräver `.env.test.local` (TEST_USER_EMAIL/TEST_USER_PASSWORD) i projektroten.
 * Loggar in varje körning och skriver INTE till e2e/.auth/ — den cachen delas
 * med andra skript och ska inte bytas ut av en mätning.
 *
 * Bakgrund (MB2, 2026-09-07): första jobbträffens Spara-knapp låg 757–805 px
 * vid 390×844 medan bottennavet börjar vid 779 — `elementFromPoint` mitt på
 * knappen träffade navet. Frågan skriptet svarar på är inte "ligger något
 * under navet" (det gör allt under vikningen, på varje rullande sida) utan
 * tre skarpare:
 *
 *   1. Träffas något interaktivt element som ligger HELT ovanför navets
 *      överkant ändå av ett annat lager? (Då täcker något annat fixerat —
 *      toast, samtyckesruta, FAB — det som ska gå att trycka på.)
 *   2. Går varje interaktivt element i första skärmen att nå med en vanlig
 *      rullning — träffar det sig självt efter `scrollIntoView`? (Ett element
 *      som fastnar under navet även då är den riktiga buggen: sidan saknar
 *      bottenpadding, eller ett lager ligger ovanpå scrollytan.)
 *   3. Är sista interaktiva elementet på sidan fritt efter rullning till
 *      botten? (Samma fråga som `career-bottennav-hittest.cjs`, men ställd
 *      till knappen, inte till "sista textnoden".)
 *
 * Det som bara är vikningen — ett element som skärs av vyportens nederkant
 * vid laddning — rapporteras som INFO med överlappningsgrad, inte som fel.
 * Att flytta vikningen (fälla ihop en rad ovanför) flyttar bara vilket kort
 * som skärs; det botar inget.
 *
 * Lärdomen 2026-08-04: en geometrisk fix behöver en geometrisk regression, och
 * okulär besiktning duger inte — `opacity: 0` och `pointer-events: none` ger
 * både falska positiva och falska negativa. Därför `elementFromPoint`, och
 * därför ALLA fixerade lager i rapporten, inte bara det man just lagade.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BAS = process.env.BASE_URL || 'http://localhost:3000'
const VYPORTAR = [
  [390, 844], // iPhone 14/15
  [375, 667], // iPhone SE/8
]

function laddaEnv() {
  const env = {}
  const fil = path.join(__dirname, '..', '.env.test.local')
  if (!fs.existsSync(fil)) {
    console.error(`Saknar ${fil} (TEST_USER_EMAIL/TEST_USER_PASSWORD)`)
    process.exit(2)
  }
  for (const rad of fs.readFileSync(fil, 'utf-8').split(/\r?\n/)) {
    const m = rad.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

async function loggaIn(page, env) {
  await page.goto(`${BAS}/#/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  try {
    const kakor = page.getByRole('button', { name: /endast nödvändiga|acceptera/i }).first()
    if (await kakor.isVisible({ timeout: 1500 })) await kakor.click()
  } catch {}
  await page.locator('input#email').waitFor({ state: 'visible', timeout: 20000 })
  await page.locator('input#email').fill(env.TEST_USER_EMAIL)
  await page.locator('input#password').fill(env.TEST_USER_PASSWORD)
  await page.getByRole('button', { name: /^logga in$/i }).click()
  await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 25000 })
}

/** Körs i sidan. Returnerar de fixerade lagren och hit-testen. */
const MAT = `
(() => {
  const H = window.innerHeight, W = window.innerWidth
  const R = (el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), h: Math.round(r.height), w: Math.round(r.width) } }
  const namn = (el) => {
    if (!el) return '(inget)'
    const t = (el.getAttribute?.('aria-label') || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 28)
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (t ? '"' + t + '"' : '')
  }

  // 1. Alla fixerade lager med utsträckning — inte bara navet.
  const lager = []
  for (const el of document.querySelectorAll('*')) {
    const s = getComputedStyle(el)
    if (s.position !== 'fixed' || s.display === 'none' || s.visibility === 'hidden') continue
    const r = R(el)
    if (r.w < 8 || r.h < 8) continue
    // Barn till ett redan registrerat fixerat lager är samma lager.
    if (lager.some((l) => l.el.contains(el))) continue
    lager.push({ el, r, namn: namn(el), z: s.zIndex, pe: s.pointerEvents, op: s.opacity })
  }
  const nav = lager.find((l) => l.el.tagName === 'NAV' && l.r.w > 200 && l.r.bottom >= H - 20)
  const navTop = nav ? nav.r.top : H

  const vilketLager = (traff) => {
    if (!traff) return '(inget)'
    const l = lager.find((l) => l.el.contains(traff))
    return l ? 'LAGER ' + l.namn : null
  }

  // 2. Interaktiva element i <main> som syns i första skärmen.
  const main = document.querySelector('main')
  if (!main) return { fel: 'ingen <main>' }
  const interaktiva = [...main.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [tabindex="0"]')]
    .filter((el) => { const r = el.getBoundingClientRect(); return r.width >= 8 && r.height >= 8 && r.top < H && r.bottom > 0 })
  const forstaSkarm = interaktiva.map((el) => {
    const r = R(el)
    const cx = Math.round((r.left + r.right) / 2), cy = Math.round((r.top + r.bottom) / 2)
    const traff = document.elementFromPoint(Math.min(Math.max(cx, 0), W - 1), Math.min(Math.max(cy, 0), H - 1))
    const sjalv = el === traff || el.contains(traff)
    const heltOvanNav = r.bottom <= navTop
    // Flikraden rullar vågrätt: en flik vars mittpunkt ligger utanför vyporten
    // i sidled är klippt, inte täckt. Rapporteras som info, inte som fel.
    const iSidled = cx >= 0 && cx < W
    const underNavPx = Math.max(0, r.bottom - navTop)
    return { el, namn: namn(el), r, sjalv, iSidled, traffadAv: sjalv ? 'sig själv' : (vilketLager(traff) || namn(traff)), heltOvanNav, overlapp: r.h ? Math.round(100 * Math.min(underNavPx, r.h) / r.h) : 0 }
  })

  return {
    H, W, navTop, navHojd: nav ? nav.r.h : null,
    mainPaddingBottom: getComputedStyle(main).paddingBottom,
    lager: lager.map((l) => ({ namn: l.namn, r: l.r, z: l.z, pe: l.pe, op: l.op })),
    forstaSkarm: forstaSkarm.map(({ el, ...rest }) => rest),
    // Index så att steg 2 (scrollIntoView) kan hitta samma element igen.
    __index: forstaSkarm.map((f) => interaktiva.indexOf(f.el)),
  }
})()
`

/** Steg 2: rulla varje element i första skärmen till synligt läge och hit-testa igen. */
const EFTER_RULLNING = `
(() => {
  const H = window.innerHeight, W = window.innerWidth
  const main = document.querySelector('main')
  const interaktiva = [...main.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [tabindex="0"]')]
  const ut = []
  const kandidater = interaktiva.filter((el) => { const r = el.getBoundingClientRect(); return r.width >= 8 && r.height >= 8 })
  const hitta = (el) => {
    const r = el.getBoundingClientRect()
    const traff = document.elementFromPoint(Math.min(Math.max(Math.round(r.left + r.width / 2), 0), W - 1), Math.min(Math.max(Math.round(r.top + r.height / 2), 0), H - 1))
    return { r, traff, sjalv: el === traff || el.contains(traff) }
  }
  const beskriv = (el, r, traff) => ({ namn: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 28) || el.tagName, traff: traff ? traff.tagName + '"' + (traff.textContent || '').trim().slice(0, 20) + '"' : '(inget)', top: Math.round(r.top), bottom: Math.round(r.bottom) })

  // Den container som FAKTISKT rullar: närmaste rullbara förälder till sista
  // kandidaten. En sökning i DOM-ordning hittade den fixerade menylådan
  // (overflow-y: auto, scrollhöjd 1374) före <main> och rullade ingenting.
  const sista = kandidater[kandidater.length - 1]
  let scrollbar = sista ? sista.parentElement : null
  while (scrollbar && !(scrollbar.scrollHeight - scrollbar.clientHeight > 40 && /auto|scroll/.test(getComputedStyle(scrollbar).overflowY))) scrollbar = scrollbar.parentElement
  if (!scrollbar) scrollbar = document.scrollingElement
  const tillToppen = () => { if (scrollbar) scrollbar.scrollTop = 0; window.scrollTo(0, 0) }

  // Regel 2b: så som TANGENTBORDET rullar. Fokus rullar minimalt ("nearest"):
  // elementet läggs mot scrollportens nederkant — alltså under navet, om inte
  // scroll-padding-bottom reserverar plats. Det är den som Tab-användaren
  // möter; scrollIntoView(center) nedan är den som fingret möter.
  const fokusFel = []
  for (const el of kandidater.slice(0, 40)) {
    tillToppen()
    el.focus({ preventScroll: false })
    const { r, traff, sjalv } = hitta(el)
    if (!sjalv) fokusFel.push(beskriv(el, r, traff))
  }
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur()
  tillToppen()

  for (const el of kandidater.slice(0, 40)) {
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' })
    const r = el.getBoundingClientRect()
    const cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2)
    const traff = document.elementFromPoint(Math.min(Math.max(cx, 0), W - 1), Math.min(Math.max(cy, 0), H - 1))
    const sjalv = el === traff || el.contains(traff)
    if (!sjalv) ut.push({ namn: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 28) || el.tagName, traff: traff ? traff.tagName + '"' + (traff.textContent || '').trim().slice(0, 20) + '"' : '(inget)', top: Math.round(r.top), bottom: Math.round(r.bottom) })
  }
  // Steg 3: sista interaktiva elementet efter rullning till botten.
  if (scrollbar) scrollbar.scrollTop = scrollbar.scrollHeight
  window.scrollTo(0, document.documentElement.scrollHeight)
  let sistaRes = null
  if (sista) {
    const r = sista.getBoundingClientRect()
    const traff = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.min(Math.round(r.top + r.height / 2), H - 1))
    sistaRes = { namn: (sista.getAttribute('aria-label') || sista.textContent || '').trim().slice(0, 28), bottom: Math.round(r.bottom), sjalv: sista === traff || sista.contains(traff), traff: traff ? traff.tagName + '"' + (traff.textContent || '').trim().slice(0, 20) + '"' : '(inget)' }
  }
  return { fokusFel, ejNabara: ut, sista: sistaRes, scroller: scrollbar ? scrollbar.tagName.toLowerCase() + (scrollbar.id ? '#' + scrollbar.id : '') : '(ingen)', scrollPaddingBottom: scrollbar ? getComputedStyle(scrollbar).scrollPaddingBottom : null, scrollHojd: scrollbar ? scrollbar.scrollHeight : document.documentElement.scrollHeight }
})()
`

;(async () => {
  const env = laddaEnv()
  const argv = process.argv.slice(2)
  const rutter = argv.length ? argv.map((r) => (r.startsWith('/') ? r : '/' + r)) : ['/job-search']
  const browser = await chromium.launch()
  let fel = 0

  for (const [w, h] of VYPORTAR) {
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
    const page = await context.newPage()
    await loggaIn(page, env)

    for (const rutt of rutter) {
      console.log(`\n══ ${w}×${h}  ${rutt}  (${BAS}) ══`)
      await page.goto(`${BAS}/#${rutt}`, { waitUntil: 'domcontentloaded' })
      // Vänta på träffar (jobbsökningen går mot AF via edge) — annars mäter vi laddaren.
      try { await page.locator('main article').first().waitFor({ state: 'visible', timeout: 25000 }) } catch {}
      await page.waitForTimeout(1500)
      try { await page.getByRole('button', { name: /hoppa över|^stäng$/i }).first().click({ timeout: 600 }) } catch {}
      // Konsulentsamtyckesrutan (KonsulentSamtyckeFraga) är ett fixerat lager
      // med z=100 över HELA vyporten och låser rullningen — utan den här raden
      // mäter man rutan, inte navet. "Jag vill tänka på det" = `skjutUpp`,
      // som bara skriver till sessionStorage; inget sparas på kontot.
      try { await page.getByRole('button', { name: /tänka på det/i }).first().click({ timeout: 1500 }); await page.waitForTimeout(400) } catch {}

      // `scroll-behavior: smooth` gör att rutan läses innan rullningen flyttat
      // något — då ser regel 2 och 3 ut som om ingenting går att nå.
      await page.addStyleTag({ content: '* { scroll-behavior: auto !important }' })
      const m = await page.evaluate(MAT)
      if (m.fel) { console.log('  FEL:', m.fel); fel++; continue }

      console.log(`  vyport ${m.W}×${m.H} · nav top=${m.navTop} h=${m.navHojd} · main padding-bottom=${m.mainPaddingBottom}`)
      console.log('  Fixerade lager:')
      for (const l of m.lager) console.log(`    ${l.namn.padEnd(40)} ${String(l.r.top).padStart(5)}–${String(l.r.bottom).padEnd(5)} x ${l.r.left}–${l.r.right}  z=${l.z} pe=${l.pe} op=${l.op}`)

      console.log('  Första skärmens interaktiva element (mittpunkt → elementFromPoint):')
      console.log('    element                                   top–bottom  x            träffad av')
      for (const f of m.forstaSkarm) {
        // Regel 1: helt ovanför navet men träffad av något annat = fel.
        const brott = f.heltOvanNav && f.iSidled && !f.sjalv
        // Info: skärs av vikningen, eller klippt i sidled (vågrätt rullande rad).
        const info = !f.heltOvanNav ? `  [vikning: ${f.overlapp} % under navet]` : (!f.iSidled ? '  [klippt i sidled]' : '')
        if (brott) fel++
        console.log(`    ${(brott ? '✗ ' : '  ') + f.namn.padEnd(40)} ${String(f.r.top).padStart(4)}–${String(f.r.bottom).padEnd(5)} x ${String(f.r.left).padStart(3)}–${String(f.r.right).padEnd(4)} ${f.traffadAv}${info}`)
      }

      const e = await page.evaluate(EFTER_RULLNING)
      console.log(`  Scroller: ${e.scroller} · scroll-padding-bottom=${e.scrollPaddingBottom}`)
      console.log(`  Efter fokus/Tab (regel 2b, block=nearest): ${e.fokusFel.length === 0 ? 'alla nåbara' : e.fokusFel.length + ' EJ nåbara'}`)
      for (const x of e.fokusFel) { fel++; console.log(`    ✗ ${x.namn} ${x.top}–${x.bottom} träffas av ${x.traff}`) }
      console.log(`  Efter scrollIntoView (regel 2, block=center): ${e.ejNabara.length === 0 ? 'alla nåbara' : e.ejNabara.length + ' EJ nåbara'}`)
      for (const x of e.ejNabara) { fel++; console.log(`    ✗ ${x.namn} ${x.top}–${x.bottom} träffas av ${x.traff}`) }
      if (e.sista) {
        if (!e.sista.sjalv) fel++
        console.log(`  Sista elementet efter rullning till botten (regel 3): ${e.sista.sjalv ? 'fritt' : '✗ TÄCKS av ' + e.sista.traff} — "${e.sista.namn}" bottom=${e.sista.bottom}, scrollhöjd=${e.scrollHojd}`)
      }
    }
    await context.close()
  }

  await browser.close()
  console.log(fel === 0 ? '\nOK — inget interaktivt element täcks av ett fixerat lager.' : `\n${fel} fel.`)
  process.exit(fel === 0 ? 0 : 1)
})()
