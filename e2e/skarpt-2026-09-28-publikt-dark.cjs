const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const BAS = 'https://www.jobin.se';
const UT = path.join(__dirname, '..', 'docs', 'review-2026-09-28-rollspel', 'skarpt-publikt');

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, locale: 'sv-SE', colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto(`${BAS}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(UT, 'dark-01-start.png'), fullPage: true });

  await page.goto(`${BAS}/guider/a-kassa-sa-fungerar-det/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(UT, 'dark-02-guide.png'), fullPage: true });

  await ctx.close();
  await b.close();
  console.log('KLART DARK');
})();
