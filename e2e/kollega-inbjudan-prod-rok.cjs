// Röktest av kollegeinbjudan via mejl (2026-09-27): km-konsulent (chef i Testkommun)
// bjuder in en adress utan konto från Inställningar → Din organisation.
// argv: <fil med token_hash för km-konsulent> <mottagaradress> <skärmdump>
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const th = fs.readFileSync(process.argv[2], 'utf8').trim();
  const mottagare = process.argv[3];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 1000 } });
  await p.goto(`https://www.jobin.se/#/visa-som?t=${th}&e=km-konsulent%40jobin.test&till=%2Fconsultant%2Fsettings`);
  await p.waitForTimeout(8000);
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click().catch(() => {});
  await p.waitForFunction(() => /Lägg till kollega/.test(document.body.innerText), null, { timeout: 30000 });
  await p.locator('input[type="email"]').last().fill(mottagare);
  await p.getByRole('button', { name: /^Lägg till$/ }).click();
  await p.waitForTimeout(3000);
  const knapp = p.getByRole('button', { name: /Skicka inbjudan via mejl/ });
  console.log('erbjuder mejlinbjudan:', await knapp.isVisible().catch(() => false));
  await knapp.click();
  await p.waitForTimeout(8000);
  const txt = await p.locator('main').innerText();
  const i = txt.indexOf('Obesvarade inbjudningar');
  console.log(i >= 0 ? txt.slice(i, i + 300) : 'ingen lista: ' + txt.slice(txt.indexOf('Lägg till kollega'), txt.indexOf('Lägg till kollega') + 400));
  await p.screenshot({ path: process.argv[4], fullPage: true });
  await b.close();
})();
