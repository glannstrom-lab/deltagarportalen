// Läser av vad demokontona ser i konsulentvyn (2026-09-27) — underlag för demomanuset.
// argv: <fil med rader "epost token_hash"> <utkatalog>
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const rader = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').map((r) => r.trim().split(' '));
  const ut = process.argv[3];
  const b = await chromium.launch();
  for (const [epost, th, vagar] of rader) {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(`https://www.jobin.se/#/visa-som?t=${th}&e=${encodeURIComponent(epost)}&till=%2F`);
    await p.waitForTimeout(6000);
    await p.getByRole('button', { name: /Endast nödvändiga/ }).click().catch(() => {});
    for (const vag of vagar ? vagar.split(',') : ['/consultant', '/consultant/participants', '/consultant/analytics', '/consultant/settings']) {
      await p.goto(`https://www.jobin.se/#${vag}`);
      await p.waitForFunction(() => !/Laddar\.\.\./.test(document.querySelector('main')?.innerText || ''), null, { timeout: 45000 }).catch(() => {});
      await p.waitForTimeout(2500);
      const txt = await p.locator('main').innerText().catch(() => '');
      const namn = `${epost.split('@')[0]}${vag.replace(/\//g, '_')}`;
      fs.writeFileSync(`${ut}/${namn}.txt`, txt);
      await p.screenshot({ path: `${ut}/${namn}.png`, fullPage: true });
      console.log(namn, txt.length);
    }
    await ctx.close();
  }
  await b.close();
})();
