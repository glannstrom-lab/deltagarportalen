const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const UT = 'C:/Users/Mikael/Desktop/AI PROJEKT/deltagarportal/docs/review-2026-09-28-rollspel/egen';

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'sv-SE', timezoneId: 'Europe/Stockholm' });
  const p = await ctx.newPage();
  await p.goto('https://www.jobin.se/guider/varsel-vad-betyder-det/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  const cookieBtn = p.getByRole('button', { name: /Endast nödvändiga/ });
  if (await cookieBtn.count()) { await cookieBtn.click().catch(() => {}); await p.waitForTimeout(500); }
  const t0 = Date.now();
  await p.getByRole('link', { name: /CV-byggaren — kom igång/i }).click();
  await p.waitForTimeout(2500);
  console.log('url efter klick:', p.url(), 'ms', Date.now()-t0);
  await p.screenshot({ path: path.join(UT, 'm-05-efter-cv-kom-igang.png'), fullPage: true });
  const txt = await p.locator('body').innerText().catch(()=> '');
  fs.writeFileSync(path.join(UT, 'txt', 'm-05-efter-cv-kom-igang.txt'), txt);
  console.log(txt.slice(0, 800));
  await ctx.close();
  await b.close();
})();
