const { tabTrace, axeKor, landmarkOchRubriker } = require('./rollspel-2026-09-28-synskadad-helpers.cjs');
const fs = require('fs');
const path = require('path');

module.exports = async (p, h) => {
  await h.go('/settings');
  await h.shot('26-installningar-start');
  await landmarkOchRubriker(p, h, 'installningar');
  await axeKor(p, h, 'installningar');

  // Flikarna: Profil / Tillgänglighet / Notifikationer / Utseende / Integritet / Säkerhet
  const flikar = await p.evaluate(() => [...document.querySelectorAll('[role="tab"]')].map((t) => ({ text: (t.textContent || '').trim(), selected: t.getAttribute('aria-selected'), tag: t.tagName })));
  h.log('FLIKAR (role=tab)', JSON.stringify(flikar));
  if (flikar.length === 0) {
    // Kanske knappar/länkar i stället för role=tab
    const knappflikar = await p.evaluate(() => [...document.querySelectorAll('main button, main a')].map((t) => (t.textContent || '').trim()).filter((t) => /tillgänglighet|profil|notifikation|utseende|integritet|säkerhet/i.test(t)));
    h.log('MÖJLIGA FLIKAR (fallback)', JSON.stringify(knappflikar));
  }

  const tillg = p.getByRole('tab', { name: /tillgänglighet/i }).or(p.getByRole('button', { name: /tillgänglighet/i })).first();
  const harTillg = await tillg.count().then((c) => c > 0).catch(() => false);
  h.log('TILLGÄNGLIGHET-FLIK HITTAD', harTillg);
  if (harTillg) {
    await tillg.focus();
    await p.keyboard.press('Enter');
    await p.waitForTimeout(1000);
  }
  const txt = await h.shot('27-installningar-tillganglighet');
  console.log(txt.slice(0, 2500));
  await axeKor(p, h, 'installningar-tillganglighet');
  await tabTrace(p, h, 'installningar-tillganglighet', 20);
};
