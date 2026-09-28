const { tabTrace, axeKor, landmarkOchRubriker } = require('./rollspel-2026-09-28-synskadad-helpers.cjs');
const fs = require('fs');
const path = require('path');

module.exports = async (p, h) => {
  await h.go('/job-search');
  await h.shot('04-jobbsok-start');
  await landmarkOchRubriker(p, h, 'jobbsok');

  // Sökfältet: hitta med role textbox/label
  const sokfalt = p.getByRole('textbox').first();
  const harSok = await sokfalt.count().then((c) => c > 0).catch(() => false);
  h.log('SÖKFÄLT HITTAT', harSok);
  if (harSok) {
    await sokfalt.click();
    await p.keyboard.type('kundtjänst', { delay: 20 });
    await p.keyboard.press('Enter');
    await p.waitForTimeout(4000);
  }
  await h.shot('05-jobbsok-resultat');
  await axeKor(p, h, 'jobbsok-resultat');

  // Tabba genom sökresultaten och hitta en "Spara"-knapp/hjärt-ikon
  const rader = await tabTrace(p, h, 'jobbsok-resultat', 30);
  fs.writeFileSync(path.join(h.UT, 'txt', 'jobbsok-tab-rader.json'), JSON.stringify(rader, null, 2), 'utf8');

  // Försök hitta en spara-knapp via tillgängligt namn och trigga den med tangentbord
  const sparaKnapp = p.getByRole('button', { name: /spara/i }).first();
  const harSpara = await sparaKnapp.count().then((c) => c > 0).catch(() => false);
  h.log('SPARA-KNAPP HITTAD (getByRole)', harSpara);
  if (harSpara) {
    await sparaKnapp.focus();
    const namnFore = await p.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent);
    await p.keyboard.press('Enter');
    await p.waitForTimeout(1500);
    const namnEfter = await p.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent);
    h.log('SPARA — namn före/efter', namnFore, '/', namnEfter);
    fs.writeFileSync(path.join(h.UT, 'txt', 'jobbsok-spara-fore-efter.json'), JSON.stringify({ namnFore, namnEfter }, null, 2), 'utf8');
    await p.screenshot({ path: path.join(h.UT, 'd-06-jobbsok-sparat.png'), fullPage: true });
    const live = await p.evaluate(() => [...document.querySelectorAll('[role="status"],[role="alert"],[aria-live]')].map((e) => ({ role: e.getAttribute('role'), live: e.getAttribute('aria-live'), text: (e.textContent || '').slice(0, 150) })));
    fs.writeFileSync(path.join(h.UT, 'txt', 'jobbsok-spara-arialive.json'), JSON.stringify(live, null, 2), 'utf8');
    h.log('ARIA-LIVE EFTER SPARA', JSON.stringify(live));
  }

  // Verifiera i Sparade-fliken
  await h.go('/job-search?tab=saved');
  await h.shot('07-jobbsok-sparade-flik');
};
