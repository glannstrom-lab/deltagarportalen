// Röktest (2026-09-27): vad händer när en inbjuden klickar länken i mejlet?
// argv: <verify-URL ur mejlet> <skärmdump>
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
  await p.goto(process.argv[2]);
  await p.waitForTimeout(10000);
  console.log('URL:', p.url().replace(/access_token=[^&]+/, 'access_token=…').replace(/refresh_token=[^&]+/, 'refresh_token=…').slice(0, 200));
  console.log('Text:', (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 500));
  await p.screenshot({ path: process.argv[3] });
  await b.close();
})();
