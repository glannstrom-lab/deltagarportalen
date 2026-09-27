// Rollspel R&M 2026-09-27: journal, underlag, plan-PDF, rapportexporter. argv: <state> <ut>
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
  ctx.on('page', (np) => console.log('NY FLIK', np.url()));
  const dlg = () => p.locator('[role="dialog"]').last();
  const spara = async (n, loc) => { fs.writeFileSync(`${ut}/${n}.txt`, await (loc || p.locator('main')).innerText().catch(() => '')); await p.screenshot({ path: `${ut}/${n}.png`, fullPage: !loc }); };
  const ladda = async (namn, fn) => {
    const dl = p.waitForEvent('download', { timeout: 20000 }).catch(() => null);
    await fn();
    const d = await dl;
    if (d) { const f = `${ut}/${namn}-${d.suggestedFilename()}`; await d.saveAs(f); console.log('NEDLADDAT', f); } else console.log('INGEN NEDLADDNING', namn);
  };
  const jonas = 'https://www.jobin.se/#/consultant/participants/44444444-4444-4444-8444-000000000003';
  await p.goto(jonas); await p.waitForTimeout(5000);
  await p.getByRole('tab', { name: 'Journal' }).click(); await p.waitForTimeout(2500);
  await spara('jour-1-flik');
  await p.getByRole('button', { name: /Ny anteckning/ }).first().click().catch((e) => console.log('ny', e.message.slice(0, 80)));
  await p.waitForTimeout(1000);
  await spara('jour-2-form');
  const ta = p.locator('main textarea').first();
  await ta.fill('Ringde Jonas. Bokade fysiskt möte onsdag 30/9 kl 10 på kontoret. Han missade gruppträffen i fredags — ska prata om hinder. (Rollspel)').catch((e) => console.log('ta', e.message.slice(0, 80)));
  const kn = await p.locator('main').getByRole('button').allInnerTexts();
  console.log('knappar', kn.filter((k) => k.trim()).join(' | ').slice(0, 800));
  await p.getByRole('button', { name: /^Spara( anteckning)?$/ }).last().click({ timeout: 5000 }).catch((e) => console.log('spara', e.message.slice(0, 80)));
  await p.waitForTimeout(2500);
  await spara('jour-3-efter');
  // Aktivitet → Lämna underlag + plan-PDF
  await p.getByRole('tab', { name: 'Aktivitet' }).click(); await p.waitForTimeout(3000);
  await p.getByRole('button', { name: /Lämna underlag/ }).click().catch((e) => console.log('underlag', e.message.slice(0, 80)));
  await p.waitForTimeout(1500);
  await spara('akt-1-underlag', dlg());
  await p.keyboard.press('Escape'); await p.waitForTimeout(800);
  await ladda('akt-2-plan', () => p.getByRole('button', { name: /Plan som PDF/ }).click());
  // Mål: skapa nytt
  await p.getByRole('tab', { name: 'Mål' }).click(); await p.waitForTimeout(2000);
  await p.getByRole('button', { name: /Nytt mål/ }).click().catch(() => {});
  await p.waitForTimeout(1500);
  await spara('mal-1-dialog', dlg());
  await p.keyboard.press('Escape'); await p.waitForTimeout(800);
  // Rapporter-exporter
  await p.goto('https://www.jobin.se/#/consultant/analytics'); await p.waitForTimeout(9000);
  await ladda('rap-excel', () => p.getByRole('button', { name: /^Excel$/ }).click());
  await ladda('rap-pdf', () => p.getByRole('button', { name: /PDF-rapport/ }).click());
  await p.waitForTimeout(2000);
  await spara('rap-efter-pdf');
  // Rapportutkast (AI) — öppna bara
  await p.goto(jonas); await p.waitForTimeout(5000);
  const allKnappar = await p.locator('main').getByRole('button').allInnerTexts();
  console.log('detaljknappar', allKnappar.filter((k) => k.trim()).join(' | ').slice(0, 600));
  // Översikt: exportera rapport
  await p.goto('https://www.jobin.se/#/consultant'); await p.waitForTimeout(6000);
  await ladda('ov-export', () => p.getByRole('button', { name: /Exportera rapport/ }).click());
  await p.waitForTimeout(1500);
  await spara('ov-export-efter');
  console.log('FEL', JSON.stringify(fel, null, 1));
  await b.close();
})();
