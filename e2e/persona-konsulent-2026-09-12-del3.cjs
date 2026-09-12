// Persona-genomgång del 3: närvaro, mål via mall, journalrad, möte, placering, rapportutkast, överlämning, städning.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path')
const ROOT = path.join(__dirname, '..'); const OUT = path.join(__dirname, 'screenshots', 'persona-konsulent')
const env = {}
for (const f of [path.join(ROOT, '.env.test.local'), path.join(ROOT, 'client', '.env')]) {
  if (!fs.existsSync(f)) continue
  for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
}
const BASE = 'https://www.jobin.se'; const DELTAGARE = `/#/consultant/participants/b1dc7374-7219-4f97-bb45-2d21f22ccf4d`
const logg = []; const L = (s) => { console.log(s); logg.push(s) }
async function snap(page, namn) { await page.waitForTimeout(1000); await page.screenshot({ path: path.join(OUT, namn + '.png'), fullPage: true }); const a = await page.locator('body').ariaSnapshot().catch(() => ''); fs.writeFileSync(path.join(OUT, namn + '.aria.yaml'), a); return a }
async function stang(page) { for (let i = 0; i < 3; i++) { const d = page.getByRole('dialog').first(); if (!(await d.isVisible().catch(() => false))) break; const x = d.getByRole('button', { name: /^stäng$|^avbryt$/i }).first(); if (await x.isVisible().catch(() => false)) await x.click(); else await page.keyboard.press('Escape'); await page.waitForTimeout(400) } }
async function sektion(page, s) { await page.getByRole('button', { name: new RegExp(`^${s}$`) }).first().click(); await page.waitForTimeout(1200) }
;(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sv-SE', acceptDownloads: true }); const page = await ctx.newPage()
  await page.goto(BASE + '/#/login'); await page.waitForTimeout(800)
  const cookies = page.getByRole('button', { name: /endast nödvändiga/i }); if (await cookies.isVisible({ timeout: 1500 }).catch(() => false)) await cookies.click()
  await page.locator('input#email').fill(env.TEST_CONSULTANT_EMAIL); await page.locator('input#password').fill(env.TEST_CONSULTANT_PASSWORD)
  await page.getByRole('button', { name: /^logga in$/i }).click(); await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 20000 }); await page.waitForTimeout(2500)
  await page.goto(BASE + DELTAGARE); await page.waitForTimeout(3000); if (!page.url().includes('/consultant/')) { await page.goto(BASE + DELTAGARE); await page.waitForTimeout(3000) }

  // A. Närvaro på ett pass (Aktivitet → första "Närvaro"-knappen)
  try {
    await sektion(page, 'Aktivitet'); await page.waitForTimeout(2500); await snap(page, '40-aktivitet-laddad')
    const eget = await page.getByText(/Hämtar …/).first().isVisible().catch(() => false); L(`  "Hämtar …" kvar efter 3,5 s: ${eget}`)
    const narv = page.getByRole('button', { name: /^Närvaro$/ }).first(); await narv.click(); await page.waitForTimeout(900); await snap(page, '41-narvaro-dialog')
    const d = page.getByRole('dialog').first(); L(`  närvaro öppnar dialog: ${await d.isVisible().catch(() => false)}`)
    const alts = await page.getByRole('button').allInnerTexts(); L('  knappar synliga: ' + alts.filter(t => /närvar|frånvar|giltig|ogiltig|sjuk|spara/i.test(t)).slice(0, 8).join(' | '))
    await stang(page)
  } catch (e) { L('  närvaro: FEL ' + e.message.slice(0, 100)) }
  // B. Mål via mall
  try {
    await sektion(page, 'Mål'); await page.getByRole('button', { name: /^Nytt mål$/ }).click(); await page.waitForTimeout(900)
    await page.getByRole('dialog').getByRole('button', { name: /Förbereda för intervju/ }).click(); await page.waitForTimeout(900); await snap(page, '42-mal-mall-vald')
    const d = page.getByRole('dialog').first(); const tb = d.getByRole('textbox'); L(`  textboxar efter mallval: ${await tb.count()}; skapa-knapp disabled: ${await d.getByRole('button', { name: /^Skapa mål$/ }).isDisabled().catch(() => 'saknas')}`)
    const forsta = tb.first(); const v = await forsta.inputValue().catch(() => ''); L(`  första fältet förifyllt: "${v.slice(0, 50)}"`)
    if (!v) await forsta.fill('PERSONA-TEST Förbereda intervju')
    // fyll tomma textboxar minimalt
    const n = await tb.count(); for (let i = 1; i < n; i++) { const x = tb.nth(i); if (!(await x.inputValue().catch(() => 'x'))) await x.fill('persona-test') }
    const skapa = d.getByRole('button', { name: /^Skapa mål$/ }); L(`  skapa-knapp disabled efter ifyllnad: ${await skapa.isDisabled().catch(() => 'saknas')}`)
    if (!(await skapa.isDisabled().catch(() => true))) { await skapa.click(); await page.waitForTimeout(1500); await snap(page, '43-mal-skapat'); L(`  mål i listan: ${await page.getByText(/Förbereda för intervju|PERSONA-TEST/).first().isVisible().catch(() => false)}`) } else { await snap(page, '43-mal-kunde-inte-skapas'); await stang(page) }
  } catch (e) { L('  mål: FEL ' + e.message.slice(0, 100)); await stang(page) }
  // C. Journalrad via Dagbok → Ny anteckning
  try {
    await sektion(page, 'Dagbok'); await page.getByRole('button', { name: /^Ny anteckning$/ }).click(); await page.waitForTimeout(900); await snap(page, '44-ny-anteckning')
    const d = page.getByRole('dialog').first(); const tb = d.getByRole('textbox'); L(`  anteckningsdialog: ${await d.isVisible().catch(() => false)}, textboxar ${await tb.count()}`)
    const knappar = await d.getByRole('button').allInnerTexts().catch(() => []); L('  knappar i dialogen: ' + knappar.join(' | ').slice(0, 200))
    if (await tb.count()) { await tb.last().fill('PERSONA-TEST Karin 2026-09-12: samtal om praktikplats, tas bort.'); const sp = d.getByRole('button', { name: /^spara|^lägg till|^skapa/i }).first(); await sp.click().catch(() => {}); await page.waitForTimeout(1500); await snap(page, '45-anteckning-sparad'); L(`  anteckning syns: ${await page.getByText(/PERSONA-TEST Karin/).first().isVisible().catch(() => false)}`) }
    await stang(page)
  } catch (e) { L('  anteckning: FEL ' + e.message.slice(0, 100)); await stang(page) }
  // D. Rapportutkast (AI) — bara öppna
  try { await page.getByRole('button', { name: /Rapportutkast \(AI\)/ }).click(); await page.waitForTimeout(1200); await snap(page, '46-rapportutkast'); await stang(page) } catch (e) { L('  rapportutkast: ' + e.message.slice(0, 80)) }
  // E. Boka möte + Registrera placering (bara öppna)
  for (const [k, n] of [[/^Boka möte$/, '47-boka-mote'], [/^Registrera placering$/, '48-registrera-placering']]) { try { await page.getByRole('button', { name: k }).first().click(); await page.waitForTimeout(1000); await snap(page, n); await stang(page) } catch (e) { L(`  ${n}: ${e.message.slice(0, 80)}`) } }
  // F. Städa: ta bort PERSONA-TEST-mål och -anteckning
  try {
    await sektion(page, 'Mål'); const rad = page.getByText(/PERSONA-TEST|Förbereda för intervju/).first()
    if (await rad.isVisible().catch(() => false)) { const kort = rad.locator('xpath=ancestor::*[self::article or self::li or contains(@class,"rounded")][1]'); const meny = kort.getByRole('button').last(); await meny.click().catch(() => {}); await page.waitForTimeout(500); await snap(page, '49-mal-meny'); const bort = page.getByRole('button', { name: /ta bort|radera/i }).first(); if (await bort.isVisible().catch(() => false)) { await bort.click(); await page.waitForTimeout(500); const ja = page.getByRole('dialog').getByRole('button', { name: /^ta bort$|^radera$|^ja/i }).first(); if (await ja.isVisible().catch(() => false)) await ja.click(); await page.waitForTimeout(1200) } L(`  mål kvar efter städning: ${await page.getByText(/PERSONA-TEST|Förbereda för intervju/).first().isVisible().catch(() => false)}`) }
    await sektion(page, 'Dagbok'); const ant = page.getByText(/PERSONA-TEST Karin/).first()
    if (await ant.isVisible().catch(() => false)) { const kort = ant.locator('xpath=ancestor::*[self::article or self::li][1]'); const knappar = await kort.getByRole('button').allInnerTexts().catch(() => []); L('  anteckningskortets knappar: ' + knappar.join('|')); const bort = kort.getByRole('button', { name: /ta bort|radera/i }).first(); if (await bort.isVisible().catch(() => false)) { await bort.click(); await page.waitForTimeout(500); const ja = page.getByRole('dialog').getByRole('button', { name: /^ta bort$|^radera$|^ja/i }).first(); if (await ja.isVisible().catch(() => false)) await ja.click(); await page.waitForTimeout(1200) } L(`  anteckning kvar efter städning: ${await page.getByText(/PERSONA-TEST Karin/).first().isVisible().catch(() => false)}`) }
  } catch (e) { L('  städning: FEL ' + e.message.slice(0, 100)) }
  // G. Överlämning (inställningar) + AI-brytare
  await page.goto(BASE + '/#/consultant/settings'); await page.waitForTimeout(2500)
  try { await page.getByRole('button', { name: /^Överlämna deltagare/ }).first().click(); await page.waitForTimeout(1000); await snap(page, '50-overlamning'); const txt = await page.locator('main').innerText(); L('  överlämning visar: ' + (txt.match(/Överlämna[^\n]{0,160}/g) || []).slice(0, 3).join(' / ')); await stang(page) } catch (e) { L('  överlämning: ' + e.message.slice(0, 80)) }
  const txt = await page.locator('main').innerText(); L('  AI i inställningar: ' + ((txt.match(/[^\n]*AI[^\n]*/g) || []).slice(0, 4).join(' / ')).slice(0, 300))
  // H. Kommunikation: Möten-fliken
  await page.goto(BASE + '/#/consultant/communication'); await page.waitForTimeout(2500); await page.getByRole('button', { name: /^Möten$/ }).click(); await page.waitForTimeout(1200); await snap(page, '51-moten-flik')
  await b.close(); fs.writeFileSync(path.join(OUT, '_logg-del3.txt'), logg.join('\n'))
})().catch(e => { console.error('AVBRUTET', e); fs.writeFileSync(path.join(OUT, '_logg-del3.txt'), logg.join('\n') + '\nAVBRUTET: ' + e.stack); process.exit(1) })
