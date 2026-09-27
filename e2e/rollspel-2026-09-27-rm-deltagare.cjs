// Rollspel R&M 2026-09-27: varje deltagares detaljsida, alla flikar. argv: <state> <ut> <namn,namn>
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [state, ut, namnLista] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ storageState: state, viewport: { width: 1366, height: 900 } });
  const p = await ctx.newPage();
  const fel = [];
  p.on('console', (m) => { if (m.type() === 'error') fel.push(m.text().slice(0, 300)); });
  p.on('response', (r) => { if (r.status() >= 400) fel.push(`${r.status()} ${r.url().slice(0, 200)}`); });
  const ids = {};
  for (const namn of namnLista.split(',')) {
    await p.goto('https://www.jobin.se/#/consultant/participants');
    await p.getByText(namn, { exact: true }).first().click();
    await p.waitForTimeout(4000);
    ids[namn] = p.url();
    const kort = namn.split(' ')[0].toLowerCase();
    for (const flik of ['Översikt', 'Aktivitet', 'Mål', 'Dagbok', 'Tidslinje']) {
      await p.getByRole('tab', { name: flik }).click().catch((e) => console.log('ingen flik', flik));
      await p.waitForTimeout(1500);
      await p.waitForFunction(() => !/Laddar|Hämtar/.test(document.querySelector('main')?.innerText || ''), null, { timeout: 30000 }).catch(() => {});
      await p.waitForTimeout(1000);
      const txt = await p.locator('main').innerText().catch(() => '');
      fs.writeFileSync(`${ut}/${kort}-${flik}.txt`, txt);
      await p.screenshot({ path: `${ut}/${kort}-${flik}.png`, fullPage: true });
    }
  }
  console.log(JSON.stringify(ids, null, 1));
  console.log('FEL', JSON.stringify(fel, null, 1));
  await ctx.storageState({ path: state });
  await b.close();
})();
