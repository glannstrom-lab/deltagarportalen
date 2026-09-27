// Rollspel "Karin" 2026-09-27: rundtur i konsulentvyn med sparad session. Sparar text + skärmdump per vy.
// argv: <storageState.json> <utkatalog> <bredd> <prefix> [vägar,kommaseparerade] [mörkt=1]
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [state, ut, bredd, prefix, vagarArg, mork] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ storageState: state, viewport: { width: +bredd, height: +bredd < 500 ? 844 : 900 }, colorScheme: mork === '1' ? 'dark' : 'light', acceptDownloads: true });
  const p = await ctx.newPage();
  const fel = [];
  p.on('console', (m) => { if (m.type() === 'error') fel.push(m.text().slice(0, 300)); });
  p.on('response', (r) => { if (r.status() >= 400) fel.push(`${r.status()} ${r.url().slice(0, 200)}`); });
  const vagar = vagarArg ? vagarArg.split(',') : ['/consultant', '/consultant/participants', '/consultant/platser', '/consultant/analytics', '/consultant/communication', '/consultant/resources', '/consultant/settings'];
  let i = 0;
  for (const vag of vagar) {
    i++;
    const t0 = Date.now();
    await p.goto(`https://www.jobin.se/#${vag}`);
    await p.waitForTimeout(2000);
    await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
    await p.waitForFunction(() => !/Laddar\.\.\.|Hämtar/.test(document.querySelector('main')?.innerText || ''), null, { timeout: 45000 }).catch(() => {});
    const ms = Date.now() - t0;
    await p.waitForTimeout(2500);
    const txt = await p.locator('main').innerText().catch(() => '');
    const namn = `${prefix}${String(i).padStart(2, '0')}${vag.replace(/\//g, '_')}`;
    fs.writeFileSync(`${ut}/${namn}.txt`, `laddtid ${ms} ms\n` + txt);
    await p.screenshot({ path: `${ut}/${namn}.png`, fullPage: true });
    console.log(namn, txt.length, ms, 'ms');
  }
  console.log('FEL:\n' + fel.join('\n'));
  await ctx.storageState({ path: state });
  await b.close();
})();
