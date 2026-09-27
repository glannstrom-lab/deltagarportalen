// Rollspel "Karin" 2026-09-27: öppnar en deltagare, byter sektion, sparar text, skärmdump och ARIA-snapshot.
// argv: <storageState.json> <utkatalog> <prefix> <deltagarnamn> <sektioner,kommaseparerade>
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [state, ut, prefix, namn, sekt] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ storageState: state, viewport: { width: 1366, height: 900 } });
  const p = await ctx.newPage();
  const fel = [];
  p.on('console', (m) => { if (m.type() === 'error') fel.push(m.text().slice(0, 300)); });
  p.on('response', (r) => { if (r.status() >= 400) fel.push(`${r.status()} ${r.url().slice(0, 200)}`); });
  await p.goto('https://www.jobin.se/#/consultant/participants');
  await p.waitForTimeout(3000);
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
  await p.getByText(namn, { exact: true }).first().click();
  await p.waitForTimeout(4000);
  console.log('url', p.url());
  let i = 0;
  for (const s of sekt.split(',')) {
    i++;
    if (s !== '-') await p.getByRole('tab', { name: new RegExp('^' + s) }).first().click({ timeout: 8000 }).catch((e) => console.log('klick', s, e.message.slice(0, 80)));
    await p.waitForTimeout(3500);
    const f = `${ut}/${prefix}${i}-${s}`;
    fs.writeFileSync(f + '.txt', await p.locator('main').innerText().catch(() => ''));
    fs.writeFileSync(f + '.aria.yaml', await p.locator('main').ariaSnapshot().catch(() => ''));
    await p.screenshot({ path: f + '.png', fullPage: true });
  }
  console.log('FEL:\n' + fel.join('\n'));
  await ctx.storageState({ path: state });
  await b.close();
})();
