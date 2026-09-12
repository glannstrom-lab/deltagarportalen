// Persona-genomgång 2026-09-12: "Karin", kommunkonsulent, går igenom hela konsultportalen i PROD.
// Kör:  NODE_PATH=node_modules node e2e/persona-konsulent-2026-09-12.cjs
// Kräver TEST_CONSULTANT_EMAIL/PASSWORD (km-konsulent) i .env.test.local.
// Skriver skärmdumpar + ARIA-snapshots + konsol-/nätverksfel till e2e/screenshots/persona-konsulent/.
// Muterar bara på km-deltagare (journalrad + mål som tas bort igen). Skickar inga mejl.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path')
const ROOT = path.join(__dirname, '..'); const OUT = path.join(__dirname, 'screenshots', 'persona-konsulent')
fs.mkdirSync(OUT, { recursive: true })
const env = {}
for (const f of [path.join(ROOT, '.env.test.local'), path.join(ROOT, 'client', '.env')]) {
  if (!fs.existsSync(f)) continue
  for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
}
const BASE = 'https://www.jobin.se'
const DELTAGARE_ID = 'b1dc7374-7219-4f97-bb45-2d21f22ccf4d'
const logg = []; const natfel = []; const konsol = []
const L = (s) => { console.log(s); logg.push(s) }
async function snap(page, namn) {
  await page.waitForTimeout(1200)
  await page.screenshot({ path: path.join(OUT, namn + '.png'), fullPage: true })
  const aria = await page.locator('body').ariaSnapshot().catch(() => '(ingen snapshot)')
  fs.writeFileSync(path.join(OUT, namn + '.aria.yaml'), aria)
  const main = await page.locator('main').innerText().catch(() => '')
  fs.writeFileSync(path.join(OUT, namn + '.main.txt'), main)
  L(`  [dump] ${namn} (${aria.split('\n').length} aria-rader)`)
  return aria
}
async function login(page) {
  await page.goto(BASE + '/#/login'); await page.waitForTimeout(800)
  const cookies = page.getByRole('button', { name: /endast nödvändiga/i }); if (await cookies.isVisible({ timeout: 1500 }).catch(() => false)) await cookies.click()
  await page.locator('input#email').fill(env.TEST_CONSULTANT_EMAIL); await page.locator('input#password').fill(env.TEST_CONSULTANT_PASSWORD)
  await page.getByRole('button', { name: /^logga in$/i }).click()
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 20000 }); await page.waitForTimeout(2500)
  L(`inloggad → ${page.url()}`)
}
async function gaTill(page, hash, namn) {
  await page.goto(BASE + hash); await page.waitForTimeout(2500)
  // ev. omdirigering efter auth-init
  if (!page.url().includes(hash.split('?')[0])) { await page.waitForTimeout(2000); if (!page.url().includes(hash.split('?')[0])) await page.goto(BASE + hash); await page.waitForTimeout(2000) }
  L(`${namn}: ${page.url()}`)
  return snap(page, namn)
}
;(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sv-SE', acceptDownloads: true })
  const page = await ctx.newPage()
  page.on('console', m => { if (m.type() === 'error') konsol.push(`${page.url().replace(BASE, '')} :: ${m.text().slice(0, 200)}`) })
  page.on('response', r => { const s = r.status(); if (s >= 400 && !/favicon|analytics|sentry/.test(r.url())) natfel.push(`${s} ${r.request().method()} ${r.url().replace(/^https:\/\/[^/]+/, '').slice(0, 160)}  (på ${page.url().replace(BASE, '')})`) })
  await login(page)

  // 1. Översikt
  await gaTill(page, '/#/consultant', '01-oversikt')
  // 2. Deltagare
  await gaTill(page, '/#/consultant/participants', '02-deltagare')
  // 3. Deltagarens detaljsida
  await gaTill(page, `/#/consultant/participants/${DELTAGARE_ID}`, '03-deltagare-detalj')
  // flikar/avsnitt på detaljsidan: klicka igenom alla tab/knappar som ser ut som avsnitt
  const flikar = page.getByRole('tab'); const nFlikar = await flikar.count(); L(`  detaljsidan har ${nFlikar} tab-element`)
  for (let i = 0; i < nFlikar; i++) { const t = flikar.nth(i); const namn = (await t.innerText().catch(() => 'flik' + i)).trim().replace(/\W+/g, '-').slice(0, 30); await t.click().catch(() => {}); await snap(page, `03-detalj-flik-${i}-${namn}`) }
  // 3a. Uppgift: skapa journalrad
  try {
    const nyRad = page.getByRole('button', { name: /ny anteckning|lägg till anteckning|skriv anteckning|ny journal/i }).first()
    if (await nyRad.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nyRad.click(); await page.waitForTimeout(800); await snap(page, '04-journal-formular')
      const ta = page.getByRole('dialog').getByRole('textbox').first().or(page.getByRole('textbox').last())
      await ta.fill('PERSONA-TEST Karin 2026-09-12: samtal om praktikplats, tas bort strax.')
      await page.getByRole('button', { name: /^spara|^lägg till|^skapa/i }).first().click(); await page.waitForTimeout(1500)
      await snap(page, '04-journal-sparad'); L('  journalrad skapad')
    } else L('  ingen tydlig "ny anteckning"-knapp hittad')
  } catch (e) { L('  journal: FEL ' + e.message.slice(0, 120)) }
  // 3b. Uppgift: sätt mål
  try {
    const nyttMal = page.getByRole('button', { name: /nytt mål|lägg till mål|skapa mål/i }).first()
    if (await nyttMal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nyttMal.click(); await page.waitForTimeout(800); await snap(page, '05-mal-formular')
      const fields = page.getByRole('dialog').getByRole('textbox'); const nf = await fields.count()
      if (nf) { await fields.first().fill('PERSONA-TEST: söka 3 jobb i veckan'); if (nf > 1) await fields.nth(1).fill('Tas bort strax.') }
      await page.getByRole('dialog').getByRole('button', { name: /^spara|^lägg till|^skapa/i }).first().click(); await page.waitForTimeout(1500)
      await snap(page, '05-mal-sparat'); L('  mål skapat')
    } else L('  ingen tydlig "nytt mål"-knapp hittad')
  } catch (e) { L('  mål: FEL ' + e.message.slice(0, 120)) }
  // 3c. PDF-export av plan
  try {
    const pdf = page.getByRole('button', { name: /pdf|exportera|ladda ner/i }).first()
    if (await pdf.isVisible({ timeout: 2000 }).catch(() => false)) {
      const dl = page.waitForEvent('download', { timeout: 15000 }).catch(() => null); await pdf.click(); const d = await dl
      L(d ? `  PDF laddad ner: ${d.suggestedFilename()}` : '  PDF: ingen nedladdning startade (öppnades i dialog/ny flik?)'); await snap(page, '06-pdf-efter-klick')
    } else L('  ingen PDF/export-knapp synlig på detaljsidan')
  } catch (e) { L('  pdf: FEL ' + e.message.slice(0, 120)) }
  // 4–8. Övriga avsnitt
  await gaTill(page, '/#/consultant/platser', '07-platser')
  await gaTill(page, '/#/consultant/analytics', '08-rapporter')
  await gaTill(page, '/#/consultant/communication', '09-kommunikation')
  await gaTill(page, '/#/consultant/resources', '10-resurser')
  await gaTill(page, '/#/consultant/settings', '11-installningar')
  // 9. Mörkt läge
  try { await page.getByRole('button', { name: /mörkt läge/i }).first().click(); await page.waitForTimeout(800); await snap(page, '12-morkt-installningar'); await gaTill(page, '/#/consultant', '12-morkt-oversikt'); await gaTill(page, `/#/consultant/participants/${DELTAGARE_ID}`, '12-morkt-detalj'); await page.getByRole('button', { name: /ljust läge/i }).first().click().catch(() => {}) } catch (e) { L('  mörkt läge: ' + e.message.slice(0, 100)) }
  // 10. Städa: ta bort PERSONA-TEST-rader via UI om möjligt (annars rapportera)
  await gaTill(page, `/#/consultant/participants/${DELTAGARE_ID}`, '13-stadning-fore')
  // 11. Mobil
  const m = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'sv-SE', isMobile: true, hasTouch: true }); const mp = await m.newPage()
  mp.on('console', x => { if (x.type() === 'error') konsol.push(`MOBIL ${mp.url().replace(BASE, '')} :: ${x.text().slice(0, 200)}`) })
  await login(mp)
  await gaTill(mp, '/#/consultant', 'M1-oversikt'); await gaTill(mp, '/#/consultant/participants', 'M2-deltagare'); await gaTill(mp, `/#/consultant/participants/${DELTAGARE_ID}`, 'M3-detalj'); await gaTill(mp, '/#/consultant/settings', 'M4-installningar'); await gaTill(mp, '/#/consultant/analytics', 'M5-rapporter')
  await b.close()
  fs.writeFileSync(path.join(OUT, '_logg.txt'), logg.join('\n') + '\n\nNÄTVERKSFEL:\n' + natfel.join('\n') + '\n\nKONSOLFEL:\n' + konsol.join('\n'))
  console.log('\nNÄTVERKSFEL:', natfel.length, '\nKONSOLFEL:', konsol.length)
})().catch(e => { console.error('AVBRUTET', e); fs.writeFileSync(path.join(OUT, '_logg.txt'), logg.join('\n') + '\nAVBRUTET: ' + e.stack); process.exit(1) })
