const { tabTrace, axeKor, landmarkOchRubriker, skipLank } = require('./rollspel-2026-09-28-synskadad-helpers.cjs');
const fs = require('fs');
const path = require('path');

module.exports = async (p, h) => {
  // --- Översikt: full svit (hemsidan, det första Peter möter varje dag) ---
  await h.go('/oversikt');
  await h.shot('01-oversikt');
  await landmarkOchRubriker(p, h, 'oversikt');
  await skipLank(p, h, 'oversikt'); // tab #1
  // Testa att skip-länken FUNGERAR: tryck Enter på den och se var fokus hamnar
  await p.keyboard.press('Enter').catch(() => {});
  await p.waitForTimeout(300);
  const efterSkip = await p.evaluate(() => {
    const el = document.activeElement;
    return el ? { tag: el.tagName, id: el.id, text: (el.innerText || '').slice(0, 60) } : null;
  });
  fs.writeFileSync(path.join(h.UT, 'txt', 'skiplank-oversikt-mal.json'), JSON.stringify(efterSkip, null, 2), 'utf8');
  h.log('SKIPLÄNK MÅL (efter Enter)', JSON.stringify(efterSkip));

  await tabTrace(p, h, 'oversikt-huvud', 25);
  await axeKor(p, h, 'oversikt');

  // 200% zoom (motsvaras av CSS-zoom via deviceScaleFactor räcker inte — sätt font-size via browser zoom)
  await p.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(h.UT, 'd-01-oversikt-200pct.png'), fullPage: true });
  await p.evaluate(() => { document.documentElement.style.zoom = '1'; });

  // 320px reflow
  await p.setViewportSize({ width: 320, height: 900 });
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(h.UT, 'd-01-oversikt-320px.png'), fullPage: true });
  const scrollBredd = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  h.log('320PX SIDLEDSSCROLL oversikt (px, 0=ok)', scrollBredd);
  fs.writeFileSync(path.join(h.UT, 'txt', 'oversikt-320px-scroll.txt'), String(scrollBredd), 'utf8');
  await p.setViewportSize({ width: 1366, height: 900 });

  // forced-colors (Windows kontrastläge — det Peter faktiskt kan använda om synresten är kvar)
  await p.emulateMedia({ forcedColors: 'active' });
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(h.UT, 'd-01-oversikt-forced-colors.png'), fullPage: true });
  await p.emulateMedia({ forcedColors: 'none' });

  // --- Min vecka: Peter är nyinskriven — kolla om aktivitetsplan finns ---
  await h.go('/min-vecka');
  const veckaTxt = await h.shot('02-min-vecka');
  await landmarkOchRubriker(p, h, 'min-vecka');
  await axeKor(p, h, 'min-vecka');
  const tomVecka = /Ingen vecka planerad än/.test(veckaTxt);
  h.log('MIN VECKA — TOM PLAN?', tomVecka);
  fs.writeFileSync(path.join(h.UT, 'txt', 'min-vecka-tom-plan.txt'), String(tomVecka), 'utf8');

  if (tomVecka) {
    // Testa tomtillståndets CTA med tangentbord: "Gå till din konsulent"
    await tabTrace(p, h, 'min-vecka-tomt-cta', 12);
  }
};
