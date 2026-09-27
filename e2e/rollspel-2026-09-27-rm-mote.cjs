// Rollspel R&M 2026-09-27: boka fysiskt möte för Jonas Demo. argv: <state> <ut>
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [state, ut] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ storageState: state, viewport: { width: 1366, height: 900 } });
  const p = await ctx.newPage();
  const fel = [];
  p.on('console', (m) => { if (m.type() === 'error') fel.push(m.text().slice(0, 300)); });
  p.on('response', (r) => { if (r.status() >= 400) fel.push(`${r.status()} ${r.url().slice(0, 200)}`); });
  const dlg = () => p.locator('[role="dialog"]').last();
  const snap = async (n) => { fs.writeFileSync(`${ut}/${n}.txt`, await dlg().innerText().catch(() => p.locator('main').innerText())); await p.screenshot({ path: `${ut}/${n}.png` }); };
  await p.goto('https://www.jobin.se/#/consultant/participants/44444444-4444-4444-8444-000000000003');
  await p.waitForTimeout(5000);
  await p.getByRole('button', { name: 'Boka möte' }).click();
  await p.waitForTimeout(1500);
  await snap('mote-1-dialog');
  // välj dag: onsdag 30 sep
  await dlg().getByRole('button', { name: /^30$/ }).first().click().catch((e) => console.log('dag', e.message.slice(0, 100)));
  await p.waitForTimeout(500);
  await dlg().getByRole('button', { name: /^10:00$/ }).first().click().catch((e) => console.log('tid', e.message.slice(0, 100)));
  await snap('mote-2-datum');
  // eventuellt nästa steg
  await dlg().getByRole('button', { name: '45 min', exact: true }).click().catch(() => {});
  await dlg().getByRole('button', { name: 'Fortsätt', exact: true }).click().catch((e) => console.log('fortsatt', e.message.slice(0, 80)));
  await p.waitForTimeout(800);
  await snap('mote-2b-steg2');
  await p.waitForTimeout(800);
  await dlg().getByRole('button', { name: /Fysiskt/ }).click({ timeout: 5000 }).catch((e) => console.log('fysiskt', e.message.slice(0, 100)));
  await p.waitForTimeout(500);
  const inputs = dlg().locator('input[type="text"], input:not([type]), textarea');
  console.log('fält', await inputs.count());
  for (let i = 0; i < await inputs.count(); i++) {
    const el = inputs.nth(i);
    const ph = await el.getAttribute('placeholder');
    console.log(i, ph);
    if (/plats|adress|lokal/i.test(ph || '')) await el.fill('Leverantörens kontor, Demogatan 1');
    else if (/titel|ämne|rubrik/i.test(ph || '')) await el.fill('Fysiskt uppföljningsmöte');
  }
  await snap('mote-3-typ');
  const knappar = await dlg().getByRole('button').allInnerTexts();
  console.log('knappar', knappar.filter((k) => k.trim().length > 2).join(' | '));
  await dlg().getByRole('button', { name: /Boka möte|Boka|Skapa|Spara|Skicka/ }).last().click({ timeout: 5000 }).catch((e) => console.log('boka', e.message.slice(0, 100)));
  await p.waitForTimeout(3000);
  await p.screenshot({ path: `${ut}/mote-4-efter.png`, fullPage: true });
  fs.writeFileSync(`${ut}/mote-4-efter.txt`, await p.locator('body').innerText());
  await p.goto('https://www.jobin.se/#/consultant/participants');
  await p.waitForTimeout(5000);
  await p.screenshot({ path: `${ut}/mote-5-lista.png`, fullPage: true });
  fs.writeFileSync(`${ut}/mote-5-lista.txt`, await p.locator('main').innerText());
  await p.goto('https://www.jobin.se/#/consultant');
  await p.waitForTimeout(6000);
  await p.screenshot({ path: `${ut}/mote-6-oversikt.png`, fullPage: true });
  fs.writeFileSync(`${ut}/mote-6-oversikt.txt`, await p.locator('main').innerText());
  console.log('FEL', JSON.stringify(fel, null, 1));
  await b.close();
})();
