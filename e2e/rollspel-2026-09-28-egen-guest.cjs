// Bengt som besökare — läser guiden om varsel, klickar vidare mot registrering. Skickar INTE formuläret.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const UT = 'C:/Users/Mikael/Desktop/AI PROJEKT/deltagarportal/docs/review-2026-09-28-rollspel/egen';
fs.mkdirSync(path.join(UT, 'txt'), { recursive: true });

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'sv-SE', timezoneId: 'Europe/Stockholm' });
  const p = await ctx.newPage();
  async function shot(namn) {
    const f = path.join(UT, `m-${namn}.png`);
    await p.screenshot({ path: f, fullPage: true });
    const txt = await p.locator('body').innerText().catch(() => '');
    fs.writeFileSync(path.join(UT, 'txt', `m-${namn}.txt`), txt);
    console.log('SHOT', namn, txt.length);
  }
  const t0 = Date.now();
  await p.goto('https://www.jobin.se/guider/varsel-vad-betyder-det/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await shot('01-guide-varsel');
  console.log('laddad efter ms', Date.now() - t0);

  // Cookie-banner
  const cookieBtn = p.getByRole('button', { name: /Endast nödvändiga/ });
  if (await cookieBtn.count()) { await cookieBtn.click().catch(() => {}); await p.waitForTimeout(500); }

  await shot('02-guide-varsel-efter-cookie');

  // Bengt scrollar och läser checklistan, klickar sen på primär CTA "Uppdatera ditt CV medan du väntar"
  const cta = p.getByRole('link', { name: /Uppdatera ditt CV/i }).first();
  const ctaCount = await cta.count();
  console.log('CTA hittad:', ctaCount);
  if (ctaCount) {
    const t1 = Date.now();
    await cta.click();
    await p.waitForTimeout(2000);
    console.log('efter CTA-klick, url:', p.url(), 'ms', Date.now() - t1);
    await shot('03-efter-cv-cta');
  }

  // Bengt är inte inloggad, så /cv borde leda till registrering/inlogg
  await p.waitForTimeout(1000);
  await shot('04-lage-efter-cta');

  await ctx.close();
  await b.close();
})();
