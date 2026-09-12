// Persona-genomgång: DELTAGAREN (Dana, 34, försörjningsstöd + aktivitetskrav) i PROD.
// Kör:  NODE_PATH=node_modules node e2e/persona-deltagare-2026-09-12.cjs
// Loggar in som TEST_USER_* (km-deltagare, kopplad till km-konsulent i Testkommun), går igenom
// alla sidor deltagaren når: mobil 390 ljust + mörkt (med axe color-contrast), desktop 1440 ljust.
// Sparar skärmdumpar + ARIA-snapshots + mätningar i e2e/screenshots/persona-deltagare/.
// Muterar bara: incheckning på dagens pass (om knapp finns), en dagboksrad som raderas, EN AI-generering.
const { chromium } = require('playwright')
const { AxeBuilder } = require('@axe-core/playwright')
const fs = require('fs'); const path = require('path')
const ROOT = path.join(__dirname, '..'); const OUT = path.join(__dirname, 'screenshots', 'persona-deltagare')
fs.mkdirSync(path.join(OUT, 'snap'), { recursive: true })
const env = {}
for (const f of [path.join(ROOT, '.env.test.local'), path.join(ROOT, 'client', '.env')]) {
  if (!fs.existsSync(f)) continue
  for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
}
const BASE = 'https://www.jobin.se'
const logg = []; const L = (typ, sida, text, extra) => { const r = { typ, sida, text, ...(extra || {}) }; logg.push(r); console.log(`${typ} | ${sida} | ${text}`) }

const SIDOR = [
  ['oversikt', '/#/oversikt'], ['min-vecka', '/#/min-vecka'], ['my-consultant', '/#/my-consultant'],
  ['min-vardag', '/#/min-vardag'], ['jobb', '/#/jobb'], ['karriar', '/#/karriar'], ['resurser', '/#/resurser'],
  ['cv', '/#/cv'], ['cover-letter', '/#/cover-letter'], ['job-search', '/#/job-search'], ['applications', '/#/applications'],
  ['interview', '/#/interview-simulator'], ['salary', '/#/salary'], ['career', '/#/career'], ['interest-guide', '/#/interest-guide'],
  ['skills-gap', '/#/skills-gap-analysis'], ['knowledge-base', '/#/knowledge-base'], ['resources', '/#/resources'],
  ['externa-resurser', '/#/externa-resurser'], ['ai-team', '/#/ai-team'], ['natverk', '/#/n%C3%A4tverk'], ['diary', '/#/diary'],
  ['wellness', '/#/wellness'], ['calendar', '/#/calendar'], ['exercises', '/#/exercises'], ['profile', '/#/profile'],
  ['settings', '/#/settings'], ['help', '/#/help'], ['linkedin', '/#/linkedin-optimizer'], ['education', '/#/education'],
  ['spontan', '/#/spontanans%C3%B6kan'], ['personal-brand', '/#/personal-brand'], ['international', '/#/international'],
  ['privacy', '/#/privacy'], ['tillganglighet', '/#/tillganglighet'], ['om-oss', '/om-oss/'],
]
const AXE_SIDOR = new Set(['oversikt', 'min-vecka', 'my-consultant', 'cv', 'job-search', 'diary', 'wellness', 'profile', 'settings', 'cover-letter', 'ai-team', 'knowledge-base'])

async function login(page) {
  await page.goto(BASE + '/#/login'); await page.waitForTimeout(1500)
  const cookies = page.getByRole('button', { name: /endast nödvändiga/i }); if (await cookies.isVisible().catch(() => false)) await cookies.click()
  await page.locator('input#email').fill(env.TEST_USER_EMAIL); await page.locator('input#password').fill(env.TEST_USER_PASSWORD)
  await page.getByRole('button', { name: /^logga in$/i }).click()
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 20000 }); await page.waitForTimeout(2000)
  const d = page.getByRole('dialog').first(); if (await d.isVisible().catch(() => false)) L('OBS', 'login', 'dialog direkt efter inloggning: ' + (await d.getAttribute('aria-label') || (await d.textContent() || '').slice(0, 80)))
}
async function stangGuider(page) {
  for (const namn of [/stäng guiden/i, /hoppa över/i, /^stäng$/i]) {
    const b = page.getByRole('dialog').getByRole('button', { name: namn }).first()
    if (await b.isVisible({ timeout: 300 }).catch(() => false)) { await b.click().catch(() => {}); await page.waitForTimeout(300) }
  }
}
async function matSida(page, namn, lage) {
  const t = await page.evaluate(() => {
    const body = document.body.innerText || ''
    const enOrd = (body.match(/\b(Loading|Submit|Save|Cancel|Settings|Dashboard|Welcome|Error|Delete|Edit|Search|Next|Previous|Close|Open|Overview|Profile|Notifications)\b/g) || [])
    const nollor = Array.from(document.querySelectorAll('main *')).filter(el => el.childElementCount === 0 && /^0$/.test((el.textContent || '').trim())).length
    const rawKeys = (body.match(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z.]+\b/g) || []).filter(k => !/\.(se|com|org|nu|io)\b/.test(k) && !/^www\./.test(k)).slice(0, 5)
    const h1 = document.querySelector('h1')?.textContent?.trim() || '(ingen h1)'
    return { scrollX: document.documentElement.scrollWidth > window.innerWidth + 2, scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth, enOrd: [...new Set(enOrd)], nollor, rawKeys, h1, laddar: /Laddar/.test(body) }
  })
  if (t.scrollX) L('SKAV', namn, `${lage}: sidan scrollar i sidled (${t.scrollW} > ${t.innerW})`)
  if (t.enOrd.length) L('SKAV', namn, `${lage}: engelska ord i UI: ${t.enOrd.join(', ')}`)
  if (t.nollor) L('VIKTIGT', namn, `${lage}: ${t.nollor} ensam(ma) "0" i main — invit saknas?`)
  if (t.rawKeys.length) L('KRITISKT', namn, `${lage}: råa i18n-nycklar synliga: ${t.rawKeys.join(', ')}`)
  return t
}
async function snap(page, namn, lage) {
  const s = await page.locator('body').ariaSnapshot().catch(() => '')
  fs.writeFileSync(path.join(OUT, 'snap', `${namn}-${lage}.yaml`), s)
}

;(async () => {
  const b = await chromium.launch()
  // ---------- MOBIL 390, LJUST ----------
  let ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'sv-SE' })
  let page = await ctx.newPage()
  await login(page)
  for (const [namn, url] of SIDOR) {
    try {
      await page.goto(BASE + url, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500); await stangGuider(page)
      const t = await matSida(page, namn, 'mobil-ljust'); await snap(page, namn, 'mobil-ljust')
      await page.screenshot({ path: path.join(OUT, `m-${namn}.png`), fullPage: true })
      L('OK', namn, `mobil ljust — h1: ${t.h1}${t.laddar ? ' (Laddar-text kvar!)' : ''}`)
    } catch (e) { L('FEL', namn, 'mobil ljust: ' + e.message.split('\n')[0]) }
  }
  // Interaktioner på mobil
  try { await page.goto(BASE + '/#/oversikt'); await page.waitForTimeout(2000); await page.getByRole('button', { name: /notifikationer/i }).first().click(); await page.waitForTimeout(800); await page.screenshot({ path: path.join(OUT, 'm-notiser.png') }); await snap(page, 'notiser', 'mobil'); L('OK', 'notiser', 'panelen öppnad') } catch (e) { L('FEL', 'notiser', e.message.split('\n')[0]) }
  try { await page.goto(BASE + '/#/oversikt'); await page.waitForTimeout(1500); await page.getByRole('button', { name: /^meny$/i }).click(); await page.waitForTimeout(600); await page.screenshot({ path: path.join(OUT, 'm-meny.png'), fullPage: true }); await snap(page, 'meny', 'mobil'); L('OK', 'meny', 'mobilmenyn öppnad') } catch (e) { L('FEL', 'meny', e.message.split('\n')[0]) }
  try { await page.goto(BASE + '/#/oversikt'); await page.waitForTimeout(1500); const kris = page.getByRole('button', { name: /stöd och hjälp/i }).first(); await kris.click(); await page.waitForTimeout(800); await page.screenshot({ path: path.join(OUT, 'm-krisstod.png'), fullPage: true }); await snap(page, 'krisstod', 'mobil'); L('OK', 'krisstöd', 'panelen öppnad') } catch (e) { L('FEL', 'krisstöd', e.message.split('\n')[0]) }
  // Incheckning
  try { await page.goto(BASE + '/#/min-vecka'); await page.waitForTimeout(2500); const jag = page.getByRole('button', { name: /jag är här/i }).first(); if (await jag.isVisible().catch(() => false)) { await jag.click(); await page.waitForTimeout(1500); await page.screenshot({ path: path.join(OUT, 'm-incheckning.png'), fullPage: true }); L('OK', 'min-vecka', 'incheckning gjord') } else L('OBS', 'min-vecka', 'ingen "Jag är här"-knapp i dag (lördag) — vad ser Dana i stället? se m-min-vecka.png') } catch (e) { L('FEL', 'incheckning', e.message.split('\n')[0]) }
  // Dagbok: skriv + radera
  try {
    await page.goto(BASE + '/#/diary'); await page.waitForTimeout(2500); await stangGuider(page)
    const ny = page.getByRole('button', { name: /ny|skriv|lägg till|börja/i }).first(); if (await ny.isVisible().catch(() => false)) await ny.click(); await page.waitForTimeout(800)
    const box = page.getByRole('textbox').first(); await box.fill('Persona-test Dana 2026-09-12 — raderas.'); await page.waitForTimeout(300)
    const spara = page.getByRole('button', { name: /spara|publicera/i }).first(); await spara.click(); await page.waitForTimeout(2000)
    await page.screenshot({ path: path.join(OUT, 'm-diary-sparad.png'), fullPage: true }); await snap(page, 'diary-efter', 'mobil')
    const rad = page.getByText(/Persona-test Dana/).first(); const finns = await rad.isVisible().catch(() => false); L(finns ? 'OK' : 'VIKTIGT', 'diary', finns ? 'rad sparad och syns' : 'raden syns inte efter sparning')
    if (finns) { const ta = page.getByRole('button', { name: /ta bort|radera/i }).first(); if (await ta.isVisible().catch(() => false)) { await ta.click(); await page.waitForTimeout(600); const ok = page.getByRole('dialog').getByRole('button', { name: /ta bort|radera|ja/i }).first(); if (await ok.isVisible().catch(() => false)) await ok.click(); await page.waitForTimeout(1500); const kvar = await page.getByText(/Persona-test Dana/).first().isVisible().catch(() => false); L(kvar ? 'VIKTIGT' : 'OK', 'diary', kvar ? 'raden gick INTE att radera via UI' : 'raden raderad') } else L('VIKTIGT', 'diary', 'ingen synlig ta bort-knapp på raden') }
  } catch (e) { L('FEL', 'diary', e.message.split('\n')[0]) }
  // Lätt svenska + engelska via inställningar
  try { await page.goto(BASE + '/#/settings'); await page.waitForTimeout(2500); await snap(page, 'settings-detalj', 'mobil'); const latt = page.getByText(/lätt svenska/i).first(); L(await latt.isVisible().catch(() => false) ? 'OK' : 'VIKTIGT', 'settings', 'Lätt svenska ' + (await latt.isVisible().catch(() => false) ? 'finns i inställningarna' : 'hittas INTE i inställningarna')) } catch (e) { L('FEL', 'settings', e.message.split('\n')[0]) }
  try { await page.goto(BASE + '/#/oversikt'); await page.waitForTimeout(1500); await page.evaluate(() => localStorage.setItem('i18nextLng', 'en')); await page.reload(); await page.waitForTimeout(2500); await page.screenshot({ path: path.join(OUT, 'm-oversikt-en.png'), fullPage: true }); await snap(page, 'oversikt', 'mobil-en'); const sv = await page.evaluate(() => (document.body.innerText.match(/\b(Översikt|Söka jobb|Karriär|Resurser|Din vardag|Nästa steg|Det som är igång)\b/g) || []).length); L(sv ? 'VIKTIGT' : 'OK', 'oversikt', `engelskt läge: ${sv} svenska UI-ord kvar på Översikt`); await page.goto(BASE + '/#/min-vecka'); await page.waitForTimeout(2500); await snap(page, 'min-vecka', 'mobil-en'); await page.screenshot({ path: path.join(OUT, 'm-min-vecka-en.png'), fullPage: true }); await page.evaluate(() => localStorage.setItem('i18nextLng', 'sv')) } catch (e) { L('FEL', 'engelska', e.message.split('\n')[0]) }
  // Fokusläge
  try { await page.goto(BASE + '/#/cv'); await page.waitForTimeout(2500); await stangGuider(page); const f = page.getByRole('button', { name: /slå på fokusläge|fokusläge/i }).first(); if (await f.isVisible().catch(() => false)) { await f.click(); await page.waitForTimeout(1500); await page.screenshot({ path: path.join(OUT, 'm-cv-fokus.png'), fullPage: true }); await snap(page, 'cv-fokus', 'mobil'); L('OK', 'fokusläge', 'påslaget på CV (mobil)'); const av = page.getByRole('button', { name: /stäng av fokusläge|avsluta/i }).first(); if (await av.isVisible().catch(() => false)) await av.click() } else L('OBS', 'fokusläge', 'ingen fokuslägesknapp synlig på mobil') } catch (e) { L('FEL', 'fokusläge', e.message.split('\n')[0]) }
  await page.evaluate(() => localStorage.setItem('theme', 'light')).catch(() => {})

  // ---------- MOBIL 390, MÖRKT + axe ----------
  await page.evaluate(() => localStorage.setItem('theme', 'dark')).catch(() => {})
  for (const [namn, url] of SIDOR) {
    if (!AXE_SIDOR.has(namn)) continue
    try {
      await page.goto(BASE + url, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500); await stangGuider(page)
      await page.screenshot({ path: path.join(OUT, `m-dark-${namn}.png`), fullPage: true })
      const res = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()
      const noder = res.violations.flatMap(v => v.nodes).slice(0, 6).map(n => ({ html: n.html.slice(0, 120), msg: (n.any[0]?.message || '').slice(0, 120) }))
      const antal = res.violations.reduce((a, v) => a + v.nodes.length, 0)
      L(antal ? 'VIKTIGT' : 'OK', namn, `mörkt läge: ${antal} kontrastfel (axe color-contrast)`, { noder })
    } catch (e) { L('FEL', namn, 'mörkt: ' + e.message.split('\n')[0]) }
  }
  await ctx.close()

  // ---------- DESKTOP 1440, LJUST ----------
  ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sv-SE' }); page = await ctx.newPage(); await login(page)
  for (const [namn, url] of SIDOR) {
    try { await page.goto(BASE + url, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500); await stangGuider(page); await matSida(page, namn, 'desktop'); await snap(page, namn, 'desktop'); await page.screenshot({ path: path.join(OUT, `d-${namn}.png`), fullPage: true }) } catch (e) { L('FEL', namn, 'desktop: ' + e.message.split('\n')[0]) }
  }
  // Rådgivarpanelen (desktop)
  try { await page.goto(BASE + '/#/cover-letter'); await page.waitForTimeout(2500); await stangGuider(page); const rad = page.getByRole('complementary', { name: /råd för den här sidan/i }); L(await rad.isVisible().catch(() => false) ? 'OK' : 'VIKTIGT', 'radgivare', (await rad.isVisible().catch(() => false)) ? 'rådgivarkolumnen syns på brevsidan' : 'rådgivarkolumnen syns INTE på brevsidan'); const fler = rad.getByRole('button', { name: /råd till/i }).first(); if (await fler.isVisible().catch(() => false)) { await fler.click(); await page.waitForTimeout(600); await page.screenshot({ path: path.join(OUT, 'd-radgivare-utfalld.png'), fullPage: true }) } } catch (e) { L('FEL', 'radgivare', e.message.split('\n')[0]) }
  // AI: personligt brev — EN generering
  try {
    await page.goto(BASE + '/#/cover-letter'); await page.waitForTimeout(2500); await stangGuider(page)
    const sj = page.getByRole('button', { name: /jag fyller i själv/i }); await sj.click(); await page.waitForTimeout(800)
    const boxes = page.getByRole('main').getByRole('textbox'); const n = await boxes.count(); L('OBS', 'cover-letter', `"Jag fyller i själv" gav ${n} textfält`)
    const namnen = []; for (let i = 0; i < n; i++) namnen.push(await boxes.nth(i).getAttribute('aria-label') || await boxes.nth(i).getAttribute('placeholder') || await boxes.nth(i).getAttribute('name') || '?')
    L('OBS', 'cover-letter', 'fältens namn: ' + namnen.join(' | '))
    for (let i = 0; i < n; i++) { const nm = namnen[i].toLowerCase(); await boxes.nth(i).fill(/företag|arbetsgivare/.test(nm) ? 'Kommunens lokalvård' : /titel|tjänst|roll|jobb/.test(nm) ? 'Lokalvårdare' : 'Lokalvårdare på deltid, städning av skolor, morgonpass.') }
    await page.screenshot({ path: path.join(OUT, 'd-brev-steg1.png'), fullPage: true })
    await page.getByRole('button', { name: /^nästa$/i }).click(); await page.waitForTimeout(1500); await page.screenshot({ path: path.join(OUT, 'd-brev-steg2.png'), fullPage: true }); await snap(page, 'cover-letter-steg2', 'desktop')
    const gen = page.getByRole('button', { name: /skriv brevet|generera|låt ai|skapa brev/i }).first()
    if (await gen.isVisible().catch(() => false)) { const t0 = Date.now(); await gen.click(); await page.waitForFunction(() => /\S{200,}/.test(document.querySelector('textarea, [contenteditable="true"]')?.textContent || document.querySelector('textarea')?.value || '') || /kunde inte|fel/i.test(document.body.innerText), { timeout: 90000 }).catch(() => {}); const ms = Date.now() - t0; await page.waitForTimeout(1000); await page.screenshot({ path: path.join(OUT, 'd-brev-genererat.png'), fullPage: true }); await snap(page, 'cover-letter-genererat', 'desktop'); const txt = await page.evaluate(() => document.querySelector('textarea')?.value || document.querySelector('[contenteditable="true"]')?.textContent || ''); L(txt.length > 200 ? 'OK' : 'VIKTIGT', 'cover-letter', `AI-brev: ${txt.length} tecken på ${Math.round(ms / 1000)} s`, { utdrag: txt.slice(0, 400) }) } else L('OBS', 'cover-letter', 'ingen genereringsknapp hittad i steg 2 — se d-brev-steg2.png')
  } catch (e) { L('FEL', 'cover-letter-ai', e.message.split('\n')[0]) }
  await ctx.close(); await b.close()
  fs.writeFileSync(path.join(OUT, 'logg.json'), JSON.stringify(logg, null, 2))
  console.log('\nKLART — ' + logg.length + ' rader i logg.json')
})().catch(e => { console.error(e); process.exit(1) })
