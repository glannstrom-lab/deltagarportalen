const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');
const fs = require('fs');
const path = require('path');

module.exports = async (p, h) => {
  // Notisklockan
  await h.go('/oversikt');
  await stangOnboardingOmSynlig(p, h, 'oversikt');
  const klocka = p.getByRole('button', { name: /Notifikation/i }).first();
  await klocka.click({ timeout: 8000 }).catch((e) => h.log('KLOCKA_FEL', e.message.slice(0, 150)));
  await p.waitForTimeout(1200);
  await h.shot('p0-notisklocka-oppen');
  h.log('NOTIS_INNEHALL', (await h.text()).slice(0, 500));

  // Stäng och gå till Inställningar > Integritet > exportera
  await p.keyboard.press('Escape').catch(() => {});
  await h.go('/settings');
  await stangOnboardingOmSynlig(p, h, 'settings');
  const nav = p.getByRole('navigation', { name: /Avsnitt i inställningarna/i });
  await nav.getByRole('button', { name: /^Integritet$/i }).first().click({ timeout: 8000 }).catch((e) => h.log('INTEGRITET_FEL', e.message));
  await p.waitForTimeout(1000);

  const exportBtn = p.getByRole('button', { name: /Exportera|Ladda ner.*data/i }).first();
  const synlig = await exportBtn.isVisible().catch(() => false);
  h.log('EXPORT_KNAPP_SYNLIG', synlig);
  await h.shot('p1-fore-export');

  if (synlig) {
    const [download] = await Promise.all([
      p.waitForEvent('download', { timeout: 15000 }).catch((e) => { h.log('DOWNLOAD_TIMEOUT', e.message); return null; }),
      exportBtn.click(),
    ]);
    if (download) {
      const filnamn = download.suggestedFilename();
      h.log('NEDLADDAD_FIL', filnamn);
      const sparaTill = path.join(h.UT, 'export.json');
      await download.saveAs(sparaTill);
      const innehall = fs.readFileSync(sparaTill, 'utf8');
      h.log('EXPORT_STORLEK_BYTES', innehall.length);
      const data = JSON.parse(innehall);
      h.log('EXPORT_NYCKLAR_TOPPNIVA', JSON.stringify(Object.keys(data)));
      if (data.data) h.log('EXPORT_NYCKLAR_DATA', JSON.stringify(Object.keys(data.data)));
    }
  }
  await h.shot('p2-efter-export');
  h.log('EFTER_EXPORT_TEXT', (await h.text()).slice(0, 400));
};
