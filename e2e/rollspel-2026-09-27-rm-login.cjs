// Rollspel R&M-coach 2026-09-27: loggar in demo-leverantor via visa-som och sparar sessionen.
// argv: <token_hash> <statefil>
const { chromium } = require('playwright');
(async () => {
  const [th, state] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`https://www.jobin.se/#/visa-som?t=${th}&e=demo-leverantor%40jobin.se&till=%2Fconsultant`);
  await p.waitForTimeout(9000);
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click().catch(() => {});
  await p.waitForTimeout(1500);
  console.log('url', p.url());
  await ctx.storageState({ path: state });
  await b.close();
})();
