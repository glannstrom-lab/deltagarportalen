// Rollspel "Karin" 2026-09-27: loggar in demo@jobin.se via engångslänk och sparar sessionen.
// argv: <token_hash> <storageState.json>
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`https://www.jobin.se/#/visa-som?t=${process.argv[2]}&e=demo%40jobin.se&till=%2Fconsultant`);
  await p.waitForTimeout(8000);
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click().catch(() => {});
  await p.waitForTimeout(1000);
  console.log('url', p.url());
  console.log((await p.locator('body').innerText()).slice(0, 400));
  await ctx.storageState({ path: process.argv[3] });
  await b.close();
})();
