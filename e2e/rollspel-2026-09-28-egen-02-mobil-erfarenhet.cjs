// Bengt, mobil, fortsättning: stänger guidetouren som ligger ovanpå "CV skapat"-kvittot,
// fyller Ort, lägger till en arbetslivserfarenhet (30 år truckförare), försöker exportera PDF.
module.exports = async (p, h) => {
  if (p.url() === 'about:blank') await h.go('/cv');
  await p.waitForTimeout(1500);
  await h.shot('20-vid-ateranslutning');

  // Stäng ev. guidetur som stod ovanpå "CV skapat"-kvittot förra passet
  const stangTur = p.getByRole('button', { name: /^Hoppa över$/ }).first();
  if (await stangTur.count()) {
    h.log('Guidetur fortfarande öppen — stänger med Hoppa över');
    await stangTur.click();
    await p.waitForTimeout(800);
  }
  const xKnapp = p.locator('button[aria-label="Stäng"]').first();
  if (await xKnapp.count()) { await xKnapp.click().catch(() => {}); await p.waitForTimeout(500); }
  await h.shot('21-efter-stangd-tur');

  h.log('Sidtext vid ankomst (steg?):', (await p.locator('main').innerText().catch(() => '')).slice(0, 300));

  // Gå direkt till steg 4 (Erfarenhet) via stegcirkeln — CV-byggaren återupptar
  // INTE senast öppna steg vid ny sidladdning, den visar alltid steg 1 (Design).
  const stegCirkel = p.getByRole('button', { name: /steg 4/i }).first();
  if (await stegCirkel.count()) {
    await stegCirkel.click();
    await p.waitForTimeout(1200);
  } else {
    h.log('Hittade ingen stegcirkel för steg 4 — provar Nästa-knappen tre gånger');
    for (let i = 0; i < 3; i++) {
      const nastaKnapp = p.getByRole('button', { name: /^Nästa$/ }).first();
      if (await nastaKnapp.count()) { await nastaKnapp.click(); await p.waitForTimeout(800); }
    }
  }
  await h.shot('23-erfarenhet-sida');
  h.log('Sidtext på erfarenhetssteget:', (await p.locator('main').innerText().catch(() => '')).slice(0, 600));

  // Fyll Ort på "Om dig"-steget också, om det inte redan gjorts (gå dit separat efteråt)
  const stegCirkel2 = p.getByRole('button', { name: /steg 2/i }).first();
  if (await stegCirkel2.count()) {
    await stegCirkel2.click();
    await p.waitForTimeout(800);
    const ortFalt = p.getByLabel(/^Ort$/i).first();
    if (await ortFalt.count()) {
      const nuvarande = await ortFalt.inputValue().catch(() => '');
      h.log('Ort-fältets värde vid återbesök på steg 2:', JSON.stringify(nuvarande));
      if (!nuvarande) await ortFalt.fill('Jönköping');
    }
    await h.shot('22b-ort-pa-steg2');
    // Tillbaka till erfarenhet
    const tillbakaTillErf = p.getByRole('button', { name: /steg 4/i }).first();
    if (await tillbakaTillErf.count()) { await tillbakaTillErf.click(); await p.waitForTimeout(1000); }
  }
  await h.shot('23b-tillbaka-pa-erfarenhet');
  h.log('Erfarenhet-sida text:', (await p.locator('main').innerText().catch(() => '')).slice(0, 800));

  // Lägg till en post om det finns en "Lägg till"-knapp
  const laggTill = p.getByRole('button', { name: /Lägg till (erfarenhet|arbetslivserfarenhet)/i }).first();
  if (await laggTill.count()) {
    await laggTill.click();
    await p.waitForTimeout(800);
    await h.shot('24-erfarenhet-formular-tomt');

    async function fyll(regex, varde) {
      const f = p.getByLabel(regex).first();
      if (await f.count()) { await f.fill(varde).catch(() => {}); return true; }
      return false;
    }
    const r = {};
    r.titel = await fyll(/titel|befattning|roll/i, 'Truckförare och lagerarbetare');
    r.foretag = await fyll(/företag|arbetsgivare/i, 'Jönköpings Lager & Logistik AB');
    r.plats = await fyll(/plats|ort/i, 'Jönköping');
    r.start = await fyll(/från|start/i, '1994-03');
    r.beskrivning = await fyll(/beskrivning|arbetsuppgifter/i,
      'Körde truck (A1-A4, förarbevis) i höglager, plockade och packade kundorder, ansvarade för dagliga säkerhetskontroller av fordon.');
    h.log('Erfarenhetsfält ifyllda:', JSON.stringify(r));
    await h.shot('25-erfarenhet-ifylld');

    const nuvarandeJobb = p.getByLabel(/pågående|nuvarande/i).first();
    if (await nuvarandeJobb.count()) { await nuvarandeJobb.check().catch(() => {}); }

    const spara = p.getByRole('button', { name: /Spara|Lägg till$/i }).first();
    if (await spara.count()) {
      await spara.click();
      await p.waitForTimeout(1200);
    }
    await h.shot('26-erfarenhet-sparad');
  } else {
    h.log('Ingen "Lägg till erfarenhet"-knapp hittad på den här sidan.');
  }

  h.log('KLART — mobilpasset avslutat.');
};
