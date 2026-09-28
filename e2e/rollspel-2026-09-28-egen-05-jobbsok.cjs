// Bengt, dator: söker lagerjobb i Jönköpings län, sparar ett jobb, sparar sökningen som bevakning.
module.exports = async (p, h) => {
  if (p.url() === 'about:blank') await h.go('/job-search');
  await p.waitForTimeout(1500);
  const t0 = Date.now();

  const sokfalt = p.getByPlaceholder(/Vad vill du jobba med/i).first();
  if (await sokfalt.count()) await sokfalt.fill('truckförare lager');

  const lanVal = p.locator('select').filter({ hasText: /Alla län/i }).first();
  if (await lanVal.count()) {
    await lanVal.selectOption({ label: 'Jönköpings län' }).catch(async (e) => {
      h.log('Kunde inte välja "Jönköpings län" med det namnet:', e.message);
      const opts = await lanVal.locator('option').allTextContents();
      h.log('Tillgängliga län-alternativ:', JSON.stringify(opts));
    });
  } else {
    h.log('Hittade ingen <select> med "Alla län"');
  }
  await p.waitForTimeout(500);
  await h.shot('51-sok-ifylld');

  // Leta efter en sök-knapp (kan vara implicit / live-filter)
  const sokKnapp = p.getByRole('button', { name: /^Sök$/i }).first();
  if (await sokKnapp.count()) { await sokKnapp.click(); }
  await p.waitForTimeout(2000);
  const tSok = Date.now();
  h.log('Sökning klar efter ms:', tSok - t0);
  await h.shot('52-sokresultat');
  h.log('Resultat-text:', (await p.locator('main').innerText().catch(() => '')).slice(0, 1000));

  // Spara första jobbet i listan
  const sparaKnapp = p.getByRole('button', { name: /^Spara$/i }).first();
  if (await sparaKnapp.count()) {
    await sparaKnapp.click();
    await p.waitForTimeout(1000);
    h.log('Klickade Spara på första träffen');
  } else {
    h.log('Ingen "Spara"-knapp hittad på träfflistan');
  }
  await h.shot('53-jobb-sparat');

  // Leta efter "Spara sökningen som bevakning" (AT2)
  const bevakningKnapp = p.getByRole('button', { name: /Spara.*sökning.*bevakning|bevakning/i }).first();
  if (await bevakningKnapp.count()) {
    await bevakningKnapp.click();
    await p.waitForTimeout(1200);
    await h.shot('54-bevakning-dialog');
    h.log('Bevakningsdialog-text:', (await p.locator('main, [role="dialog"]').first().innerText().catch(() => '')).slice(0, 600));
    const spara2 = p.getByRole('button', { name: /^(Spara|Skapa bevakning|Spara bevakning)$/i }).first();
    if (await spara2.count()) {
      await spara2.click();
      await p.waitForTimeout(1200);
      h.log('Bevakning sparad');
    }
  } else {
    h.log('Ingen knapp för att spara sökningen som bevakning hittades på sidan.');
  }
  await h.shot('55-efter-bevakning');
  h.log('TOTAL tid jobbsök-sekvens ms:', Date.now() - t0);
};
