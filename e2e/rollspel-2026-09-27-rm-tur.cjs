// Rollspel R&M 2026-09-27: besöker vägar med sparad session, sparar text + skärmdump.
// argv: <statefil> <utkatalog> <prefix> <bredd> <mörk:0|1> <väg1,väg2,...>
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [state, ut, prefix, bredd, mork, vagar] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ storageState: state, viewport: { width: +bredd, height: +bredd < 500 ? 844 : 900 }, colorScheme: mork === '1' ? 'dark' : 'light' });
  const p = await ctx.newPage();
  const fel = [];
  p.on('console', (m) => { if (m.type() === 'error') fel.push(m.text().slice(0, 300)); });
  p.on('response', (r) => { if (r.status() >= 400) fel.push(`${r.status()} ${r.url().slice(0, 200)}`); });
  let i = 0;
  for (const vag of vagar.split(',')) {
    i++;
    const t0 = Date.now();
    await p.goto(`https://www.jobin.se/#${vag}`);
    await p.waitForTimeout(1500);
    await p.waitForFunction(() => !/Laddar|Hämtar/.test(document.querySelector('main')?.innerText || ''), null, { timeout: 45000 }).catch(() => {});
    const ms = Date.now() - t0;
    await p.waitForTimeout(2000);
    const txt = await p.locator('main').innerText().catch(() => '');
    const namn = `${prefix}-${String(i).padStart(2, '0')}${vag.replace(/[\/?=&]/g, '_')}`;
    fs.writeFileSync(`${ut}/${namn}.txt`, txt);
    await p.screenshot({ path: `${ut}/${namn}.png`, fullPage: true });
    console.log(namn, 'ms', ms, 'len', txt.length);
  }
  console.log('FEL', JSON.stringify(fel, null, 1));
  await ctx.storageState({ path: state });
  await b.close();
})();
