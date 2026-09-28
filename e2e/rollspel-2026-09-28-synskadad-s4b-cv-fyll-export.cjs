const fs = require('fs');
const path = require('path');

module.exports = async (p, h) => {
  await h.go('/cv');
  await p.waitForTimeout(1000);
  const fullstandig = p.getByRole('link', { name: /fullständiga CV-byggaren/i }).or(p.getByRole('button', { name: /fullständiga CV-byggaren/i })).first();
  if (await fullstandig.count().then((c) => c > 0).catch(() => false)) {
    await fullstandig.click();
    await p.waitForTimeout(1500);
  }
  const erfFlik = p.getByRole('button', { name: /^erfarenhet$/i }).first();
  if (await erfFlik.count().then((c) => c > 0).catch(() => false)) {
    await erfFlik.scrollIntoViewIfNeeded().catch(() => {});
    await erfFlik.focus();
    await p.keyboard.press('Enter');
    await p.waitForTimeout(1200);
  }

  // Fyll fälten med tangentbord: jobbtitel, företag, plats, startdatum, beskrivning.
  const jobbtitel = p.getByLabel(/jobbtitel/i).first();
  if (await jobbtitel.count().then((c) => c > 0).catch(() => false)) {
    await jobbtitel.click();
    await p.keyboard.type('Kundtjänstmedarbetare', { delay: 15 });
  }
  const foretag = p.getByLabel(/^företag/i).first();
  if (await foretag.count().then((c) => c > 0).catch(() => false)) {
    await foretag.click();
    await p.keyboard.type('Exempel Kundservice AB', { delay: 15 });
  }
  const plats = p.getByLabel(/^plats/i).first();
  if (await plats.count().then((c) => c > 0).catch(() => false)) {
    await plats.click();
    await p.keyboard.type('Malmö', { delay: 15 });
  }
  const start = p.getByLabel(/startdatum/i).first();
  if (await start.count().then((c) => c > 0).catch(() => false)) {
    await start.click();
    await p.keyboard.type('032023', { delay: 20 }); // type=month: MM + YYYY
  }
  const beskrivning = p.getByRole('textbox', { name: /textredigerare/i }).first();
  if (await beskrivning.count().then((c) => c > 0).catch(() => false)) {
    await beskrivning.click();
    await p.keyboard.type('Svarade på kundfrågor via telefon och chatt, handlade cirka 60 ärenden per dag.', { delay: 10 });
  }
  await p.screenshot({ path: path.join(h.UT, 'd-12-cv-erfarenhet-ifylld.png'), fullPage: true });

  // Klicka "Klar" för att stänga formuläret för den här posten
  const klar = p.getByRole('button', { name: /^klar$/i }).first();
  if (await klar.count().then((c) => c > 0).catch(() => false)) {
    await klar.scrollIntoViewIfNeeded().catch(() => {});
    await klar.focus();
    await p.keyboard.press('Enter');
    await p.waitForTimeout(800);
  }
  const txt = await h.shot('13-cv-erfarenhet-sparad');
  console.log(txt.slice(1500, 3500));

  // Exportera PDF via tangentbord
  const exportBtn = p.getByRole('button', { name: /exportera pdf/i }).first();
  const harExport = await exportBtn.count().then((c) => c > 0).catch(() => false);
  h.log('EXPORTERA PDF-KNAPP HITTAD', harExport);
  if (harExport) {
    await exportBtn.scrollIntoViewIfNeeded().catch(() => {});
    await exportBtn.focus();
    const namnFore = await p.evaluate(() => document.activeElement?.textContent);
    const [download] = await Promise.all([
      p.waitForEvent('download', { timeout: 25000 }).catch((e) => ({ fel: String(e.message || e) })),
      p.keyboard.press('Enter'),
    ]);
    await p.waitForTimeout(2000);
    const info = download && download.suggestedFilename
      ? { nedladdad: true, filnamn: download.suggestedFilename() }
      : { nedladdad: false, fel: download?.fel };
    h.log('EXPORT PDF-RESULTAT', JSON.stringify(info), 'knappnamn före:', namnFore);
    fs.writeFileSync(path.join(h.UT, 'txt', 'cv-export-resultat.json'), JSON.stringify({ namnFore, ...info }, null, 2), 'utf8');
    await p.screenshot({ path: path.join(h.UT, 'd-14-cv-efter-export.png'), fullPage: true });
    const live = await p.evaluate(() => [...document.querySelectorAll('[role="status"],[role="alert"],[aria-live]')].map((e) => ({ role: e.getAttribute('role'), live: e.getAttribute('aria-live'), text: (e.textContent || '').slice(0, 150) })));
    fs.writeFileSync(path.join(h.UT, 'txt', 'cv-export-arialive.json'), JSON.stringify(live, null, 2), 'utf8');
    h.log('ARIA-LIVE EFTER EXPORT', JSON.stringify(live));
  }
};
