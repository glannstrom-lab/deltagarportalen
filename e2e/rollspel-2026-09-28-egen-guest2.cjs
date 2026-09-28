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
  const links = await p.$$eval('a', as => as.map(a => ({ text: a.textContent.trim().slice(0,60), href: a.getAttribute('href') })));
  fs.writeFileSync(path.join(UT, 'txt', 'lankar.json'), JSON.stringify(links, null, 2));
  console.log(JSON.stringify(links.filter(l => /cv|register|konto|job/i.test(l.href||'')), null, 2));
  await ctx.close();
  await b.close();
})();
