const { tabTrace, axeKor, landmarkOchRubriker } = require('./rollspel-2026-09-28-synskadad-helpers.cjs');
const fs = require('fs');
const path = require('path');

module.exports = async (p, h) => {
  await h.go('/knowledge-base');
  await h.shot('19-kunskapsbank-start');
  await landmarkOchRubriker(p, h, 'kunskapsbank');

  // Sök efter en artikel med tangentbord
  const sokfalt = p.getByRole('textbox').first();
  if (await sokfalt.count().then((c) => c > 0).catch(() => false)) {
    await sokfalt.click();
    await p.keyboard.type('intervju', { delay: 20 });
    await p.waitForTimeout(1500);
  }
  await h.shot('20-kunskapsbank-sok');

  // Klicka på första artikellänken
  const forstaArtikel = p.getByRole('link').filter({ hasNotText: /^$/ }).nth(0);
  const lankar = await p.locator('main a[href*="/knowledge-base/article"], main a[href*="#/article"]').all();
  h.log('ANTAL ARTIKELLÄNKAR I MAIN', lankar.length);
  if (lankar.length > 0) {
    await lankar[0].click();
    await p.waitForTimeout(2000);
  }
  const txt = await h.shot('21-kunskapsbank-artikel');
  console.log(txt.slice(0, 2000));
  await landmarkOchRubriker(p, h, 'artikel');
  await axeKor(p, h, 'artikel');

  // Hitta "Lyssna"-knappen (TextToSpeech) och testa den
  const lyssna = p.getByRole('button', { name: /lyssna/i }).first();
  const harLyssna = await lyssna.count().then((c) => c > 0).catch(() => false);
  h.log('LYSSNA-KNAPP HITTAD', harLyssna);
  if (harLyssna) {
    await lyssna.scrollIntoViewIfNeeded().catch(() => {});
    await lyssna.focus();
    const namnFore = await p.evaluate(() => document.activeElement?.textContent);
    await p.keyboard.press('Enter');
    await p.waitForTimeout(1500);
    const namnEfter = await p.evaluate(() => document.activeElement?.textContent);
    const talarNu = await p.evaluate(() => window.speechSynthesis ? window.speechSynthesis.speaking : null);
    h.log('LYSSNA — namn före/efter, speechSynthesis.speaking', namnFore, namnEfter, talarNu);
    fs.writeFileSync(path.join(h.UT, 'txt', 'kunskapsbank-lyssna.json'), JSON.stringify({ namnFore, namnEfter, talarNu }, null, 2), 'utf8');
    await p.waitForTimeout(1000);
    // Stoppa
    const stopp = p.getByRole('button', { name: /stoppa/i }).first();
    if (await stopp.count().then((c) => c > 0).catch(() => false)) await stopp.click().catch(() => {});
  }

  // Tabbordning genom artikelns åtgärdsrad (Skriv ut / Ladda ner / Bokmärk / Lyssna)
  const rader = await tabTrace(p, h, 'artikel-atgarder', 15);
  fs.writeFileSync(path.join(h.UT, 'txt', 'kunskapsbank-artikel-tab.json'), JSON.stringify(rader, null, 2), 'utf8');
};
