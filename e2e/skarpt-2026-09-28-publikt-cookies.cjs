// Testar de tre cookievalen VAR FÖR SIG i egna context (föregående test blandade
// ihop "Anpassa" och "Endast nödvändiga" i samma session, vilket gav falskt
// resultat eftersom knapparna byts ut när panelen expanderas).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BAS = 'https://www.jobin.se';
const UT = path.join(__dirname, '..', 'docs', 'review-2026-09-28-rollspel', 'skarpt-publikt');

async function testaVal(b, namn, gorVal) {
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, locale: 'sv-SE' });
  const page = await ctx.newPage();
  await page.goto(`${BAS}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const bannerForeSynlig = await page.locator('[data-cookie-banner]').isVisible().catch(() => false);
  await gorVal(page);
  await page.waitForTimeout(500);
  const state1 = await page.evaluate(() => ({
    consent: localStorage.getItem('jobin_cookie_consent'),
    prefs: localStorage.getItem('jobin_cookie_preferences'),
  }));
  const bannerBorta = !(await page.locator('[data-cookie-banner]').isVisible().catch(() => false));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const bannerEfterReload = await page.locator('[data-cookie-banner]').isVisible().catch(() => false);
  const state2 = await page.evaluate(() => ({
    consent: localStorage.getItem('jobin_cookie_consent'),
    prefs: localStorage.getItem('jobin_cookie_preferences'),
  }));
  console.log(`[${namn}] bannerFore=${bannerForeSynlig} bannerBortaEfterVal=${bannerBorta} state1=${JSON.stringify(state1)} bannerEfterReload=${bannerEfterReload} state2=${JSON.stringify(state2)}`);
  await ctx.close();
  return { namn, bannerForeSynlig, bannerBorta, state1, bannerEfterReload, state2 };
}

(async () => {
  const b = await chromium.launch();
  const resultat = [];

  resultat.push(await testaVal(b, 'acceptera-alla', async (page) => {
    await page.getByRole('button', { name: /^Acceptera alla$/ }).click();
  }));

  resultat.push(await testaVal(b, 'endast-nodvandiga', async (page) => {
    await page.getByRole('button', { name: /Endast nödvändiga/ }).click();
  }));

  resultat.push(await testaVal(b, 'anpassa-och-spara', async (page) => {
    await page.getByRole('button', { name: /^Anpassa$/ }).click();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: /Spara/ }).click();
  }));

  fs.writeFileSync(path.join(UT, 'cookie-val-resultat.json'), JSON.stringify(resultat, null, 2));
  await b.close();
  console.log('KLART COOKIES');
})();
