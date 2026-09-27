const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  // Röktest av "Visa som" (2026-09-27). argv: <fil med token_hash> <skärmdump>. BAS=http://localhost:3000 för dev.
  const th = fs.readFileSync(process.argv[2], 'utf8').trim();
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const bas = process.env.BAS || 'https://www.jobin.se';
  const url = `${bas}/#/visa-som?t=${th}&e=km-konsulent%40jobin.test&till=%2Fconsultant%2Fanalytics`;
  await p.goto(url);
  await p.waitForTimeout(9000);
  console.log('URL efter:', p.url());
  const banner = await p.locator('[data-testid="visa-som-banner"]').textContent().catch(() => null);
  console.log('banner:', banner);
  const txt = await p.locator('main').innerText().catch(() => '');
  console.log('IVO-underlag syns:', /IVO/i.test(txt), '| FFU/Rusta och matcha syns:', /FFU|Rusta och matcha/.test(txt));
  await p.screenshot({ path: process.argv[3], fullPage: false });
  // återanvänd länken: ska ge fel
  const p2 = await (await b.newContext()).newPage();
  await p2.goto(url); await p2.waitForTimeout(6000);
  console.log('andra gången:', (await p2.locator('main').innerText().catch(()=>'')).slice(0,120));
  await b.close();
})();
