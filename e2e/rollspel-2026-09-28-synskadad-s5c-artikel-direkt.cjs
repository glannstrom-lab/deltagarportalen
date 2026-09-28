const { tabTrace, axeKor, landmarkOchRubriker } = require('./rollspel-2026-09-28-synskadad-helpers.cjs');
const fs = require('fs');
const path = require('path');

module.exports = async (p, h) => {
  await h.go('/knowledge-base?category=getting-started');
  await p.waitForTimeout(1500);
  const txt0 = await h.shot('24-kunskapsbank-kategori');
  console.log(txt0.slice(0, 1500));

  const lankar = await p.locator('main a[href*="knowledge-base/article"], main a[href*="/article/"]').all();
  h.log('ANTAL ARTIKELLÄNKAR I KATEGORIN', lankar.length);
  if (lankar.length === 0) {
    // fallback: alla länkar i main, filtrera bort kategori/sök-relaterade
    const alla = await p.evaluate(() => [...document.querySelectorAll('main a[href]')].map((a) => a.getAttribute('href')).filter(Boolean).slice(0, 40));
    h.log('ALLA LÄNKAR I MAIN (fallback)', JSON.stringify(alla));
  } else {
    await lankar[0].click();
    await p.waitForTimeout(2000);
  }
  const txt = await h.shot('25-kunskapsbank-artikel-2');
  console.log(txt.slice(0, 2500));
  await landmarkOchRubriker(p, h, 'artikel-2');
  await axeKor(p, h, 'artikel-2');

  const lyssna = p.getByRole('button', { name: /lyssna/i }).first();
  const harLyssna = await lyssna.count().then((c) => c > 0).catch(() => false);
  h.log('LYSSNA-KNAPP HITTAD', harLyssna);
  if (harLyssna) {
    await lyssna.scrollIntoViewIfNeeded().catch(() => {});
    await lyssna.focus();
    await p.keyboard.press('Enter');
    await p.waitForTimeout(1500);
    const namnEfter = await p.evaluate(() => document.activeElement?.textContent);
    const talarNu = await p.evaluate(() => (window.speechSynthesis ? window.speechSynthesis.speaking : null));
    h.log('LYSSNA — namn efter, speechSynthesis.speaking', namnEfter, talarNu);
  }
  await tabTrace(p, h, 'artikel-2-atgarder', 18);
};
