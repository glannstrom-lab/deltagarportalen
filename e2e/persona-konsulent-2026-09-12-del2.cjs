// Persona-genomgång del 2: uppgifter på deltagarens detaljsida + dialoger. Se del 1 för ram.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path')
const ROOT = path.join(__dirname, '..'); const OUT = path.join(__dirname, 'screenshots', 'persona-konsulent')
const env = {}
for (const f of [path.join(ROOT, '.env.test.local'), path.join(ROOT, 'client', '.env')]) {
  if (!fs.existsSync(f)) continue
  for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
}
const BASE = 'https://www.jobin.se'; const DELTAGARE = `/#/consultant/participants/b1dc7374-7219-4f97-bb45-2d21f22ccf4d`
const logg = []; const natfel = []
const L = (s) => { console.log(s); logg.push(s) }
async function snap(page, namn) { await page.waitForTimeout(1000); await page.screenshot({ path: path.join(OUT, namn + '.png'), fullPage: true }); const a = await page.locator('body').ariaSnapshot().catch(() => ''); fs.writeFileSync(path.join(OUT, namn + '.aria.yaml'), a); L(`  [dump] ${namn}`); return a }
async function stangDialog(page) { const d = page.getByRole('dialog').first(); if (await d.isVisible().catch(() => false)) { const x = d.getByRole('button', { name: /^stäng|^avbryt|^cancel/i }).first(); if (await x.isVisible().catch(() => false)) await x.click(); else await page.keyboard.press('Escape') } await page.waitForTimeout(500) }
async function oppna(page, knapp, namn) { try { const k = page.getByRole('button', { name: knapp }).first(); await k.click({ timeout: 4000 }); await page.waitForTimeout(900); await snap(page, namn); const d = page.getByRole('dialog').first(); L(`  ${namn}: dialog=${await d.isVisible().catch(() => false)}`); await stangDialog(page) } catch (e) { L(`  ${namn}: FEL ${e.message.slice(0, 100)}`) } }
;(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sv-SE', acceptDownloads: true }); const page = await ctx.newPage()
  page.on('response', r => { const s = r.status(); if (s >= 400 && !/favicon|analytics|sentry/.test(r.url())) natfel.push(`${s} ${r.request().method()} ${r.url().replace(/^https:\/\/[^/]+/, '').slice(0, 160)}`) })
  await page.goto(BASE + '/#/login'); await page.waitForTimeout(800)
  const cookies = page.getByRole('button', { name: /endast nödvändiga/i }); if (await cookies.isVisible({ timeout: 1500 }).catch(() => false)) await cookies.click()
  await page.locator('input#email').fill(env.TEST_CONSULTANT_EMAIL); await page.locator('input#password').fill(env.TEST_CONSULTANT_PASSWORD)
  await page.getByRole('button', { name: /^logga in$/i }).click(); await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 20000 }); await page.waitForTimeout(2500)

  await page.goto(BASE + DELTAGARE); await page.waitForTimeout(3000); if (!page.url().includes('/consultant/')) { await page.goto(BASE + DELTAGARE); await page.waitForTimeout(3000) }
  // Sektioner
  for (const s of ['Aktivitet', 'Mål', 'Dagbok', 'Tidslinje', 'Översikt']) {
    try { await page.getByRole('button', { name: new RegExp(`^${s}$`) }).first().click(); await snap(page, `20-sektion-${s}`) } catch (e) { L(`  sektion ${s}: FEL ${e.message.slice(0, 80)}`) }
  }
  // Aktivitet: PDF + närvaro + IVO
  try {
    await page.getByRole('button', { name: /^Aktivitet$/ }).first().click(); await page.waitForTimeout(1200)
    const pdf = page.getByRole('button', { name: /pdf/i }).first()
    if (await pdf.isVisible().catch(() => false)) { const dl = page.waitForEvent('download', { timeout: 20000 }).catch(() => null); await pdf.click(); const d = await dl; L(d ? `  plan-PDF: ${d.suggestedFilename()}` : '  plan-PDF: ingen nedladdning'); } else L('  plan-PDF: ingen PDF-knapp i Aktivitet')
    await snap(page, '21-aktivitet-efter-pdf')
    const narvaro = page.getByRole('button', { name: /närvarande|frånvarande|registrera närvaro|markera/i }).first()
    L(`  närvaroknapp synlig: ${await narvaro.isVisible().catch(() => false)} (${(await narvaro.innerText().catch(() => '')).slice(0, 40)})`)
  } catch (e) { L('  aktivitet: FEL ' + e.message.slice(0, 100)) }
  // Mål: skapa + ta bort
  try {
    await page.getByRole('button', { name: /^Mål$/ }).first().click(); await page.waitForTimeout(1000)
    const ny = page.getByRole('button', { name: /nytt mål|lägg till mål|skapa mål|\+ mål/i }).first()
    L(`  nytt mål-knapp synlig: ${await ny.isVisible().catch(() => false)}`)
    if (await ny.isVisible().catch(() => false)) {
      await ny.click(); await page.waitForTimeout(900); await snap(page, '22-mal-dialog')
      const d = page.getByRole('dialog').first(); const tb = d.getByRole('textbox'); const n = await tb.count(); L(`  måldialog textboxar: ${n}`)
      if (n) { await tb.first().fill('PERSONA-TEST Söka tre jobb i veckan'); if (n > 1) await tb.nth(1).fill('Skapat av persona-test, tas bort.') }
      const spara = d.getByRole('button', { name: /^spara|^skapa|^lägg till/i }).first(); await spara.click().catch(() => {}); await page.waitForTimeout(1500); await snap(page, '22-mal-sparat')
      // ta bort
      const rad = page.getByText(/PERSONA-TEST Söka tre jobb/).first(); L(`  målet syns i listan: ${await rad.isVisible().catch(() => false)}`)
      const meny = page.getByRole('button', { name: /alternativ|meny|mer|…|\.\.\./i }).first(); if (await meny.isVisible().catch(() => false)) { await meny.click(); await page.waitForTimeout(500); await snap(page, '22-mal-meny') }
      const bort = page.getByRole('button', { name: /^ta bort|radera/i }).first(); if (await bort.isVisible().catch(() => false)) { await bort.click(); await page.waitForTimeout(500); const ja = page.getByRole('dialog').getByRole('button', { name: /^ta bort$|^radera$|^ja/i }).first(); if (await ja.isVisible().catch(() => false)) await ja.click(); await page.waitForTimeout(1200); L(`  målet kvar efter borttagning: ${await page.getByText(/PERSONA-TEST Söka tre jobb/).first().isVisible().catch(() => false)}`) } else L('  ingen ta bort-knapp för målet hittad')
    }
  } catch (e) { L('  mål: FEL ' + e.message.slice(0, 100)) }
  // Snabbanteckning
  try {
    await page.getByRole('button', { name: /^Översikt$/ }).first().click(); await page.waitForTimeout(800)
    const ta = page.getByRole('textbox', { name: /skriv en anteckning/i }).first(); await ta.fill('PERSONA-TEST Karin: samtal om praktikplats, tas bort.')
    await page.getByRole('button', { name: /^spara anteckning$/i }).click(); await page.waitForTimeout(1500); await snap(page, '23-anteckning-sparad')
    L(`  anteckningen syns: ${await page.getByText(/PERSONA-TEST Karin/).first().isVisible().catch(() => false)}`)
    await page.getByRole('button', { name: /^Dagbok$/ }).first().click(); await page.waitForTimeout(1000); await snap(page, '23-dagbok-med-anteckning')
    const bort = page.getByRole('button', { name: /ta bort|radera/i }).first(); if (await bort.isVisible().catch(() => false)) { await bort.click(); await page.waitForTimeout(500); const ja = page.getByRole('dialog').getByRole('button', { name: /^ta bort$|^radera$|^ja/i }).first(); if (await ja.isVisible().catch(() => false)) await ja.click(); await page.waitForTimeout(1200); L(`  anteckning kvar: ${await page.getByText(/PERSONA-TEST Karin/).first().isVisible().catch(() => false)}`) } else L('  ingen ta bort-knapp för anteckningen')
  } catch (e) { L('  anteckning: FEL ' + e.message.slice(0, 100)) }
  // Dialoger på detaljsidan
  await oppna(page, /^Boka möte$/, '24-boka-mote'); await oppna(page, /^Registrera placering$/, '25-registrera-placering')
  // Översiktens snabbåtgärder
  await page.goto(BASE + '/#/consultant'); await page.waitForTimeout(2500)
  for (const [k, n] of [[/^Bjud in deltagare$/, '26-bjud-in'], [/^Skicka gruppmeddelande$/, '27-gruppmeddelande'], [/^Schemalägg möte$/, '28-schemalagg'], [/^Skapa mål för deltagare$/, '29-skapa-mal-alla']]) await oppna(page, k, n)
  try { const dl = page.waitForEvent('download', { timeout: 15000 }).catch(() => null); await page.getByRole('button', { name: /^Exportera rapport$/ }).click(); const d = await dl; L(d ? `  Exportera rapport: ${d.suggestedFilename()}` : '  Exportera rapport: ingen nedladdning'); await snap(page, '30-exportera-rapport'); await stangDialog(page) } catch (e) { L('  exportera: ' + e.message.slice(0, 80)) }
  // Deltagarlistan: listvy + bjud in
  await page.goto(BASE + '/#/consultant/participants'); await page.waitForTimeout(2500)
  await page.getByRole('button', { name: /^Listvy$/ }).click().catch(() => {}); await snap(page, '31-deltagare-listvy'); await oppna(page, /^Bjud in$/, '32-bjud-in-lista')
  // Rapporter: PDF + Excel
  await page.goto(BASE + '/#/consultant/analytics'); await page.waitForTimeout(3000)
  for (const [k, n] of [[/^PDF-rapport$/, 'PDF-rapport'], [/^Excel$/, 'Excel']]) { try { const dl = page.waitForEvent('download', { timeout: 20000 }).catch(() => null); await page.getByRole('button', { name: k }).click(); const d = await dl; L(d ? `  ${n}: ${d.suggestedFilename()}` : `  ${n}: ingen nedladdning`); await stangDialog(page) } catch (e) { L(`  ${n}: ${e.message.slice(0, 80)}`) } }
  await page.getByRole('button', { name: /^Risker/ }).click().catch(() => {}); await snap(page, '33-rapporter-risker')
  // Kommunikation: nytt meddelande (bara öppna), Möten-fliken
  await page.goto(BASE + '/#/consultant/communication'); await page.waitForTimeout(2500)
  await oppna(page, /^Nytt meddelande$/, '34-nytt-meddelande'); await page.getByRole('button', { name: /^Möten$/ }).click().catch(() => {}); await snap(page, '35-moten')
  // Resurser: flikar
  await page.goto(BASE + '/#/consultant/resources'); await page.waitForTimeout(2500)
  for (const f of ['Schemamallar', 'Aktivitetskatalog', 'Jobbsamlingar', 'Best Practices']) { await page.getByRole('button', { name: new RegExp(`^${f}$`) }).click().catch(() => {}); await snap(page, `36-resurser-${f.replace(/\s/g, '-')}`) }
  // Inställningar: organisation nederdel (caseload, överlämning, AI-brytare)
  await page.goto(BASE + '/#/consultant/settings'); await page.waitForTimeout(2500)
  await page.getByText(/^Caseload$/).first().scrollIntoViewIfNeeded().catch(() => {}); await snap(page, '37-installningar-org')
  const overl = page.getByRole('button', { name: /överlämna/i }).first(); L(`  överlämna-knapp synlig: ${await overl.isVisible().catch(() => false)}`)
  if (await overl.isVisible().catch(() => false)) { await overl.click(); await page.waitForTimeout(800); await snap(page, '38-overlamning-dialog'); await stangDialog(page) }
  const ai = page.getByText(/AI-funktioner|AI för organisationen|AI-brytare/i).first(); L(`  AI-brytartext synlig: ${await ai.isVisible().catch(() => false)} "${(await ai.innerText().catch(() => '')).slice(0, 80)}"`)
  await b.close()
  fs.writeFileSync(path.join(OUT, '_logg-del2.txt'), logg.join('\n') + '\n\nNÄTVERKSFEL:\n' + natfel.join('\n'))
  console.log('NÄTVERKSFEL:', natfel.length)
})().catch(e => { console.error('AVBRUTET', e); fs.writeFileSync(path.join(OUT, '_logg-del2.txt'), logg.join('\n') + '\nAVBRUTET: ' + e.stack); process.exit(1) })
