// Rollspel R&M 2026-09-27: Aminas 3-mån-uppföljning, ny placering för Sara, Platser. argv: <state> <ut>
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [state, ut] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ storageState: state, viewport: { width: 1366, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const fel = [];
  p.on('console', (m) => { if (m.type() === 'error') fel.push(m.text().slice(0, 300)); });
  p.on('response', (r) => { if (r.status() >= 400) fel.push(`${r.status()} ${r.url().slice(0, 200)}`); });
  const dlg = () => p.locator('[role="dialog"]').last();
  const spara = async (n, loc) => { fs.writeFileSync(`${ut}/${n}.txt`, await (loc || p.locator('main')).innerText().catch(() => '')); await p.screenshot({ path: `${ut}/${n}.png`, fullPage: !loc }); };
  // 1. Rapporter → placeringskortet
  await p.goto('https://www.jobin.se/#/consultant/analytics');
  await p.waitForTimeout(8000);
  const kort = p.getByText('Amina Fiktiv · Exempel Städ AB').locator('xpath=ancestor::*[.//input[@type="checkbox"]][1]');
  await kort.scrollIntoViewIfNeeded().catch(() => {});
  await kort.screenshot({ path: `${ut}/plac-1-amina-fore.png` }).catch((e) => console.log('kort', e.message.slice(0, 80)));
  await p.getByLabel('3-månadersuppföljning gjord').first().check().catch((e) => console.log('check', e.message.slice(0, 80)));
  await p.waitForTimeout(2500);
  await kort.screenshot({ path: `${ut}/plac-2-amina-efter.png` }).catch(() => {});
  fs.writeFileSync(`${ut}/plac-2-amina-efter.txt`, await kort.innerText().catch(() => ''));
  // 2. Aminas deltagarsida — syns placeringen/uppföljningen?
  await p.goto('https://www.jobin.se/#/consultant/participants/44444444-4444-4444-8444-000000000004');
  await p.waitForTimeout(5000);
  await spara('plac-3-amina-sida');
  // 3. Sara: registrera placering
  await p.goto('https://www.jobin.se/#/consultant/participants/44444444-4444-4444-8444-000000000002');
  await p.waitForTimeout(5000);
  await p.getByRole('button', { name: 'Registrera placering' }).click();
  await p.waitForTimeout(1500);
  await spara('plac-4-sara-dialog', dlg());
  await dlg().locator('#placement-employer').fill('Demobageriet AB').catch((e) => console.log('emp', e.message.slice(0, 80)));
  await dlg().locator('#placement-title').fill('Bagarbiträde').catch(() => {});
  await dlg().locator('#placement-start').fill('2026-10-19').catch((e) => console.log('start', e.message.slice(0, 80)));
  await dlg().locator('#placement-type').selectOption('trial').catch(() => {});
  await dlg().locator('#placement-notes').fill('Anställning efter praktiken. Rollspel.').catch(() => {});
  await spara('plac-5-sara-ifylld', dlg());
  const k = await dlg().getByRole('button').allInnerTexts();
  console.log('knappar', k.join(' | '));
  await dlg().getByRole('button', { name: /Registrera|Spara/ }).last().click({ timeout: 5000 }).catch((e) => console.log('spara', e.message.slice(0, 80)));
  await p.waitForTimeout(3000);
  await spara('plac-6-sara-efter');
  // 4. Rapporter igen
  await p.goto('https://www.jobin.se/#/consultant/analytics');
  await p.waitForTimeout(8000);
  await spara('plac-7-rapporter');
  // 5. Platser: lägg till plats-dialog
  await p.goto('https://www.jobin.se/#/consultant/platser');
  await p.waitForTimeout(4000);
  await p.getByRole('button', { name: 'Lägg till plats' }).first().click();
  await p.waitForTimeout(1500);
  await spara('plac-8-plats-dialog', dlg());
  await dlg().screenshot({ path: `${ut}/plac-8-plats-dialog-hel.png` }).catch(() => {});
  console.log('FEL', JSON.stringify(fel, null, 1));
  await b.close();
})();
