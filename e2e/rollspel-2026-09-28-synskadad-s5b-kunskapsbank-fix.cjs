const { tabTrace, axeKor, landmarkOchRubriker } = require('./rollspel-2026-09-28-synskadad-helpers.cjs');
const fs = require('fs');
const path = require('path');

module.exports = async (p, h) => {
  await h.go('/knowledge-base');
  const sok = p.locator('input[type="search"]').first();
  const harSok = await sok.count().then((c) => c > 0).catch(() => false);
  h.log('SÖKFÄLT (input[type=search]) HITTAT', harSok);
  if (harSok) {
    await sok.click();
    await p.keyboard.type('intervju', { delay: 25 });
    await p.waitForTimeout(1500);
  }
  await h.shot('22-kunskapsbank-sokresultat');

  const lankar = await p.locator('main a[href*="knowledge-base/article"]').all();
  h.log('ANTAL ARTIKELLÄNKAR EFTER SÖKNING', lankar.length);
  if (lankar.length > 0) {
    const forstaText = await lankar[0].innerText().catch(() => '');
    h.log('KLICKAR PÅ ARTIKEL', forstaText.slice(0, 80));
    await lankar[0].click();
    await p.waitForTimeout(2000);
  }
  const txt = await h.shot('23-kunskapsbank-artikel-verklig');
  console.log(txt.slice(0, 2500));
  await landmarkOchRubriker(p, h, 'artikel-verklig');
  await axeKor(p, h, 'artikel-verklig');

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
    fs.writeFileSync(path.join(h.UT, 'txt', 'kunskapsbank-lyssna-verklig.json'), JSON.stringify({ namnEfter, talarNu }, null, 2), 'utf8');
  } else {
    // Skriv ut hela knapplistan i åtgärdsraden så vi ser vad som faktiskt finns
    const knappar = await p.evaluate(() => [...document.querySelectorAll('main button')].map((b) => (b.textContent || '').trim()).filter(Boolean).slice(0, 30));
    h.log('KNAPPAR I MAIN (om Lyssna saknas)', JSON.stringify(knappar));
  }

  await tabTrace(p, h, 'artikel-verklig-atgarder', 18);
};
