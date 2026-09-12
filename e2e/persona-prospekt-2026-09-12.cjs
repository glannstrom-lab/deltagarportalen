// Persona: Per, enhetschef på en kommuns arbetsmarknadsenhet, 20 minuter, aldrig sett Jobin.
// Kör:  NODE_PATH=node_modules node e2e/persona-prospekt-2026-09-12.cjs
// Går oinloggad genom de publika sidorna i PROD, sedan demokontot som står på B2B-sidan.
// Skärmdumpar + textdumpar i e2e/screenshots/persona-prospekt/. Muterar inget utanför demot
// (reset_demo_org 01:00 UTC återställer demot). Bjuder inte in någon, skickar inga meddelanden.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path')
const ROOT = path.join(__dirname, '..'); const OUT = path.join(__dirname, 'screenshots', 'persona-prospekt')
fs.mkdirSync(OUT, { recursive: true })
const BASE = 'https://www.jobin.se'
const env = {}; for (const l of fs.readFileSync(path.join(ROOT, '.env.test.local'), 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const logg = []; const ok = (s, d = '') => { logg.push(`OK | ${s} | ${d}`); console.log('OK |', s, '|', d) }; const fel = (s, e) => { logg.push(`FEL | ${s} | ${e && e.message ? e.message.split('\n')[0] : e}`); console.log('FEL |', s, '|', e && e.message ? e.message.split('\n')[0] : e) }
async function dump(page, namn) {
  await page.screenshot({ path: path.join(OUT, namn + '.png'), fullPage: true }).catch(() => {})
  const text = await page.evaluate(() => document.body.innerText).catch(() => '')
  fs.writeFileSync(path.join(OUT, namn + '.txt'), text)
  return text
}
async function cookies(page) { const b = page.getByRole('button', { name: /endast nödvändiga/i }); if (await b.isVisible({ timeout: 1500 }).catch(() => false)) await b.click() }
;(async () => {
  const browser = await chromium.launch()
  // ---------- Desktop, oinloggad ----------
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sv-SE' })
  const page = await ctx.newPage()
  const publika = [
    ['01-startsida', '/'],
    ['02-b2b-kommun', '/for-arbetsmarknadsenheter/'],
    ['03-om-oss', '/om-oss/'],
    ['04-guide-aktivitetskrav', '/guider/aktivitetskrav-forsorjningsstod/'],
    ['05-integritetspolicy', '/#/privacy'],
    ['06-tillganglighet', '/#/tillganglighet'],
    ['07-ai-policy', '/#/ai-policy'],
    ['08-b2b-rm', '/for-rusta-och-matcha/'],
  ]
  for (const [namn, url] of publika) {
    try { await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 45000 }); await page.waitForTimeout(1500); await cookies(page); const t = await dump(page, namn); ok(namn, `${t.length} tecken`) } catch (e) { fel(namn, e) }
  }
  // ---------- Mobil 390 ----------
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'sv-SE' })
  const mp = await mctx.newPage()
  for (const [namn, url] of [['09-startsida-390', '/'], ['10-b2b-kommun-390', '/for-arbetsmarknadsenheter/']]) {
    try { await mp.goto(BASE + url, { waitUntil: 'networkidle', timeout: 45000 }); await mp.waitForTimeout(1500); await cookies(mp); await dump(mp, namn); ok(namn) } catch (e) { fel(namn, e) }
  }
  await mctx.close()
  // ---------- Demokontot (uppgifterna läses ur B2B-sidan, som Per skulle) ----------
  const b2b = fs.readFileSync(path.join(OUT, '02-b2b-kommun.txt'), 'utf8')
  const email = (b2b.match(/([a-z0-9.]+@jobin\.se)/) || [])[1]
  const pw = (b2b.match(/lösenord(?:et)?\s+([A-Za-z0-9-]+)/) || [])[1]
  logg.push(`INFO | demouppgifter lästa ur B2B-sidan | e-post ${email || '(saknas)'}, lösenord ${pw ? 'hittat' : '(saknas)'}`)
  const nedladdningar = []
  page.on('download', async (d) => { const fn = d.suggestedFilename(); const p = path.join(OUT, 'nedladdning-' + fn); await d.saveAs(p).catch(() => {}); nedladdningar.push(`${fn} (${fs.existsSync(p) ? fs.statSync(p).size : '?'} byte)`) })
  try {
    await page.goto(BASE + '/#/login', { waitUntil: 'networkidle' }); await cookies(page)
    await page.locator('input#email').fill(email || env.DEMO_CONSULTANT_EMAIL || '')
    await page.locator('input#password').fill(pw || env.DEMO_CONSULTANT_PASSWORD || '')
    await page.getByRole('button', { name: /^logga in$/i }).click()
    await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 20000 }); await page.waitForTimeout(3000)
    const t = await dump(page, '11-demo-efter-login'); ok('demo: inloggad', page.url())
    // Onboarding/guide-dialoger?
    const dialog = page.getByRole('dialog').first(); if (await dialog.isVisible({ timeout: 1500 }).catch(() => false)) { const namn = await dialog.getAttribute('aria-label').catch(() => null); logg.push(`INFO | dialog direkt efter inloggning | ${namn || (await dialog.innerText().catch(() => '')).slice(0, 80)}`); const hoppa = dialog.getByRole('button', { name: /hoppa över|stäng/i }).first(); if (await hoppa.isVisible().catch(() => false)) await hoppa.click() }
    await page.goto(BASE + '/#/consultant', { waitUntil: 'networkidle' }); await page.waitForTimeout(3000)
    if (!page.url().includes('/consultant')) { const k = page.getByRole('link', { name: /konsultportal/i }).first(); if (await k.isVisible().catch(() => false)) { await k.click(); await page.waitForTimeout(2500) } }
    const ko = await dump(page, '12-demo-konsulentvy'); ok('demo: konsulentvyn', page.url())
    logg.push(`INFO | demobanner synlig | ${/påhittade|demo/i.test((await page.getByRole('status').allInnerTexts().catch(() => [])).join(' ')) ? 'ja' : 'nej'}`)
    for (const [namn, flik] of [['13-demo-deltagare', /^deltagare$/i], ['14-demo-platser', /^platser$/i], ['15-demo-rapporter', /^rapporter$/i], ['16-demo-kommunikation', /^kommunikation$/i], ['17-demo-installningar', /^inställningar$/i]]) {
      try { await page.getByRole('navigation', { name: /konsultportal — avsnitt/i }).getByRole('link', { name: flik }).click(); await page.waitForTimeout(2500); await dump(page, namn); ok(namn) } catch (e) { fel(namn, e) }
    }
    // Rapporter: Exportera rapport
    try {
      await page.getByRole('navigation', { name: /konsultportal — avsnitt/i }).getByRole('link', { name: /^rapporter$/i }).click(); await page.waitForTimeout(2000)
      const exp = page.getByRole('button', { name: /exportera|ladda ner|pdf/i }).first()
      if (await exp.isVisible().catch(() => false)) { await exp.click(); await page.waitForTimeout(4000); await dump(page, '18-demo-export-klick'); ok('demo: exportknapp klickad', await exp.innerText()) } else fel('demo: exportknapp', 'ingen export-/pdf-knapp på Rapporter')
    } catch (e) { fel('demo: export', e) }
    // Deltagare → första deltagaren → plan-PDF
    try {
      await page.getByRole('navigation', { name: /konsultportal — avsnitt/i }).getByRole('link', { name: /^deltagare$/i }).click(); await page.waitForTimeout(2500)
      const forsta = page.getByRole('main').getByRole('link', { name: /exempel|demo|fiktiv|testsson/i }).first()
      if (await forsta.isVisible().catch(() => false)) { await forsta.click(); await page.waitForTimeout(3000); await dump(page, '19-demo-deltagardetalj'); ok('demo: deltagardetalj', page.url())
        const flikar = await page.getByRole('main').getByRole('tab').allInnerTexts().catch(() => []); logg.push(`INFO | flikar på deltagardetalj | ${flikar.join(' · ')}`)
        for (const f of ['Plan', 'Aktivitetsplan', 'Närvaro', 'Journal', 'Mål']) { const tab = page.getByRole('tab', { name: new RegExp('^' + f, 'i') }).first(); if (await tab.isVisible().catch(() => false)) { await tab.click(); await page.waitForTimeout(1500); await dump(page, '20-demo-detalj-' + f.toLowerCase()) } }
        const pdf = page.getByRole('button', { name: /pdf|ladda ner plan|skriv ut/i }).first()
        if (await pdf.isVisible().catch(() => false)) { await pdf.click(); await page.waitForTimeout(5000); ok('demo: plan-PDF-knapp klickad', await pdf.innerText()) } else fel('demo: plan-PDF', 'ingen PDF-knapp synlig på deltagardetaljen')
      } else fel('demo: deltagardetalj', 'ingen deltagarlänk hittad i listan')
    } catch (e) { fel('demo: deltagardetalj', e) }
    // Deltagarens perspektiv via demot: finns det? (Per vill se vad deltagaren ser)
    try { await page.goto(BASE + '/#/oversikt', { waitUntil: 'networkidle' }); await page.waitForTimeout(2500); await dump(page, '21-demo-oversikt-som-konsulent'); ok('demo: /#/oversikt som konsulent', page.url()) } catch (e) { fel('demo: oversikt', e) }
    logg.push(`INFO | nedladdningar | ${nedladdningar.join(', ') || 'inga'}`)
  } catch (e) { fel('demo: inloggning', e) }
  await browser.close()
  fs.writeFileSync(path.join(OUT, 'LOGG.txt'), logg.join('\n'))
  console.log('\n' + logg.join('\n'))
})().catch((e) => { console.error(e); process.exit(1) })
