// Rollspel "Karin" 2026-09-27: kör en lista med steg mot prod med sparad session.
// argv: <storageState.json> <utkatalog> <stegfil.js>  (stegfilen exporterar async (p, spara, logg) => {})
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const [state, ut, stegfil, bredd, mork] = process.argv.slice(2);
  const b = await chromium.launch();
  const w = +(bredd || 1366);
  const ctx = await b.newContext({ storageState: state, viewport: { width: w, height: w < 500 ? 844 : 900 }, colorScheme: mork === '1' ? 'dark' : 'light', acceptDownloads: true, isMobile: w < 500, hasTouch: w < 500 });
  const p = await ctx.newPage();
  const fel = [];
  p.on('console', (m) => { if (m.type() === 'error') fel.push('konsol: ' + m.text().slice(0, 300)); });
  p.on('response', (r) => { if (r.status() >= 400) fel.push(`${r.status()} ${r.request().method()} ${r.url().slice(0, 160)}`); });
  p.on('dialog', (d) => { fel.push('dialog: ' + d.message()); d.dismiss().catch(() => {}); });
  const spara = async (namn, hela = true) => {
    const f = path.join(ut, namn);
    fs.writeFileSync(f + '.txt', await p.locator('main').innerText().catch(() => ''));
    await p.screenshot({ path: f + '.png', fullPage: hela });
  };
  const logg = (...a) => console.log(...a);
  const steg = require(path.resolve(stegfil));
  try { await steg(p, spara, logg, ctx); } catch (e) { console.log('STEGFEL', e.message.slice(0, 400)); await spara('ZZ-fel-' + path.basename(stegfil, '.js')); }
  console.log('FEL/NÄTVERK:\n' + fel.join('\n'));
  await ctx.storageState({ path: state });
  await b.close();
})();
