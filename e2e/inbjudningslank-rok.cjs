// Röktest (2026-09-27): en inbjuden klickar länken i mejlet, väljer lösenord och
// ska landa inloggad. argv: <länk ur mejlet> <skärmdump-prefix> [lösenord]
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
  await p.goto(process.argv[2]);
  await p.waitForTimeout(6000);
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click().catch(() => {});
  const text = async () => (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 300);
  console.log('1 URL:', p.url().replace(/th=[^&]+/, 'th=…'));
  console.log('1 Text:', await text());
  await p.screenshot({ path: `${process.argv[3]}-1.png` });
  const pw = process.argv[4];
  if (pw && await p.locator('#invitehandler-f3').isVisible().catch(() => false)) {
    await p.fill('#invitehandler-f1', 'Kim');
    await p.fill('#invitehandler-f2', 'Kollega');
    await p.fill('#invitehandler-f3', pw);
    await p.fill('#invitehandler-f4', pw);
    await p.getByRole('button', { name: /Spara och fortsätt|Save and continue/ }).click();
    await p.waitForTimeout(12000);
    console.log('2 URL:', p.url());
    console.log('2 Text:', await text());
    await p.screenshot({ path: `${process.argv[3]}-2.png` });
  }
  await b.close();
})();
