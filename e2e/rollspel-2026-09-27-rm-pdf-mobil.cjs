// Rollspel R&M 2026-09-27: PDF-rapportdialogen, mobil 390 och mörkt läge. argv: <state> <ut>
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [state, ut] = process.argv.slice(2);
  const b = await chromium.launch();
  let ctx = await b.newContext({ storageState: state, viewport: { width: 1366, height: 900 }, acceptDownloads: true });
  let p = await ctx.newPage();
  const dlg = () => p.locator('[role="dialog"]').last();
  await p.goto('https://www.jobin.se/#/consultant/analytics'); await p.waitForTimeout(9000);
  await p.getByRole('button', { name: /PDF-rapport/ }).click(); await p.waitForTimeout(1500);
  fs.writeFileSync(`${ut}/pdf-1-dialog.txt`, await dlg().innerText().catch(() => 'ingen dialog'));
  await p.screenshot({ path: `${ut}/pdf-1-dialog.png` });
  const dl = p.waitForEvent('download', { timeout: 30000 }).catch(() => null);
  await dlg().getByRole('button', { name: /Generera|Skapa|Ladda ner|Exportera/ }).last().click({ timeout: 5000 }).catch((e) => console.log('gen', e.message.slice(0, 80)));
  const d = await dl; if (d) { await d.saveAs(`${ut}/pdf-2-${d.suggestedFilename()}`); console.log('PDF', d.suggestedFilename()); } else console.log('ingen pdf');
  await p.screenshot({ path: `${ut}/pdf-3-efter.png` });
  await ctx.close();
  // mobil
  ctx = await b.newContext({ storageState: state, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  p = await ctx.newPage();
  for (const [n, v] of [['m-1-oversikt', '/consultant'], ['m-2-deltagare', '/consultant/participants'], ['m-3-rapporter', '/consultant/analytics'], ['m-4-jonas', '/consultant/participants/44444444-4444-4444-8444-000000000003']]) {
    await p.goto(`https://www.jobin.se/#${v}`); await p.waitForTimeout(8000);
    const bredd = await p.evaluate(() => document.documentElement.scrollWidth);
    console.log(n, 'scrollWidth', bredd);
    fs.writeFileSync(`${ut}/${n}.txt`, await p.locator('main').innerText().catch(() => ''));
    await p.screenshot({ path: `${ut}/${n}.png`, fullPage: true });
  }
  await p.getByRole('tab', { name: 'Aktivitet' }).click().catch(() => {}); await p.waitForTimeout(3000);
  await p.screenshot({ path: `${ut}/m-5-jonas-aktivitet.png`, fullPage: true });
  // mobilmenyn
  await p.getByRole('button', { name: /meny|Meny|Öppna/ }).first().click().catch((e) => console.log('meny', e.message.slice(0, 60)));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${ut}/m-6-meny.png` });
  await ctx.close();
  // mörkt
  ctx = await b.newContext({ storageState: state, viewport: { width: 1366, height: 900 }, colorScheme: 'dark' });
  p = await ctx.newPage();
  await p.addInitScript(() => { try { localStorage.setItem('theme', 'dark') } catch {} });
  for (const [n, v] of [['dk-1-rapporter', '/consultant/analytics'], ['dk-2-deltagare', '/consultant/participants'], ['dk-3-sara', '/consultant/participants/44444444-4444-4444-8444-000000000002']]) {
    await p.goto(`https://www.jobin.se/#${v}`); await p.waitForTimeout(8000);
    await p.screenshot({ path: `${ut}/${n}.png`, fullPage: true });
  }
  await p.getByRole('tab', { name: 'Aktivitet' }).click().catch(() => {}); await p.waitForTimeout(3000);
  await p.screenshot({ path: `${ut}/dk-4-sara-aktivitet.png`, fullPage: true });
  await b.close();
})();
