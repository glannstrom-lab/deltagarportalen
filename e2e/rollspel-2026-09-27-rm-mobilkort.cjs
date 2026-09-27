// Rollspel R&M 2026-09-27: närbild av avtalskravskortet på 390 px. argv: <state> <ut>
const { chromium } = require('playwright');
(async () => {
  const [state, ut] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ storageState: state, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto('https://www.jobin.se/#/consultant/analytics'); await p.waitForTimeout(10000);
  const h = p.getByText('Aktivitetsloggen mot avtalskravet');
  await h.scrollIntoViewIfNeeded();
  const kort = h.locator('xpath=ancestor::*[.//table][1]');
  await kort.screenshot({ path: `${ut}/m-7-avtalskrav-kort.png` });
  const t = kort.locator('table');
  console.log('tabell', await t.evaluate((e) => [e.scrollWidth, e.parentElement.clientWidth, getComputedStyle(e.parentElement).overflowX]));
  await b.close();
})();
