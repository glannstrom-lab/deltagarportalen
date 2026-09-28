// Bengt, mobil: fyller Ort (via placeholder, EG3-buggen gör getByLabel opålitlig),
// lägger till arbetslivserfarenhet, går till Kompetenser/Granska, exporterar PDF.
module.exports = async (p, h) => {
  if (p.url() === 'about:blank') await h.go('/cv');
  await p.waitForTimeout(1200);

  async function gaTillSteg(n) {
    const c = p.getByRole('button', { name: new RegExp(`steg ${n}`, 'i') }).first();
    if (await c.count()) { await c.click(); await p.waitForTimeout(900); return true; }
    return false;
  }

  await gaTillSteg(2);
  // Ort-fältet: EG3-buggen (id="cvbuilder-f1" på alla fält) gör getByLabel
  // opålitligt. Måla via placeholder "Stockholm" i stället.
  const ortFalt = p.getByPlaceholder('Stockholm').first();
  if (await ortFalt.count()) {
    const v = await ortFalt.inputValue().catch(() => '');
    h.log('Ort innan (via placeholder):', JSON.stringify(v));
    if (!v) await ortFalt.fill('Jönköping');
    await h.shot('30-ort-via-placeholder');
    h.log('Ort efter:', JSON.stringify(await ortFalt.inputValue().catch(() => '')));
  }

  await gaTillSteg(4); // Erfarenhet
  await h.shot('31-erfarenhet');
  const laggTill = p.getByRole('button', { name: /Lägg till jobb/i }).first();
  if (await laggTill.count()) {
    const tStart = Date.now();
    await laggTill.click();
    await p.waitForTimeout(1000);
    await h.shot('32-erfarenhet-formular');
    h.log('Erfarenhetsformulär-text:', (await p.locator('main').innerText().catch(() => '')).slice(0, 800));

    // Fyll via synliga textfält i DOM-ordning (robust mot dubblett-id:t)
    const faltVarden = ['Truckförare och lagerarbetare', 'Jönköpings Lager & Logistik AB', 'Jönköping'];
    const textInputs = p.locator('input[type="text"]:visible, input:not([type]):visible');
    const antal = await textInputs.count();
    h.log('Antal synliga textinputs i formuläret:', antal);
    for (let i = 0; i < Math.min(antal, faltVarden.length); i++) {
      await textInputs.nth(i).fill(faltVarden[i]).catch((e) => h.log('fyll-fel', i, e.message));
    }
    const beskrivning = p.locator('textarea:visible').first();
    if (await beskrivning.count()) {
      await beskrivning.fill('Körde truck (A1-A4) i höglager, plockade och packade kundorder, ansvarade för dagliga säkerhetskontroller av fordon. 30 år på samma arbetsplats.');
    }
    await h.shot('33-erfarenhet-ifylld');

    const pagaende = p.getByLabel(/pågående|nuvarande|jobbar (fortfarande|kvar)/i).first();
    if (await pagaende.count()) { await pagaende.check().catch(() => {}); }
    else {
      // Ange slutdatum manuellt (varsel = jobbet pågick fram till varslet)
      const datumFalt = p.locator('input[type="month"]:visible, input[type="date"]:visible');
      const nDatum = await datumFalt.count();
      h.log('Datumfält hittade:', nDatum);
      if (nDatum >= 1) await datumFalt.nth(0).fill('1994-03').catch(() => {});
      if (nDatum >= 2) await datumFalt.nth(1).fill('2026-09').catch(() => {});
    }
    await h.shot('34-erfarenhet-fardig');

    const spara = p.getByRole('button', { name: /^(Spara|Lägg till)$/i }).last();
    if (await spara.count()) {
      await spara.click();
      await p.waitForTimeout(1500);
    }
    h.log('Erfarenhet sparad, tid ms:', Date.now() - tStart);
    await h.shot('35-erfarenhet-sparad');
    h.log('Text efter spara:', (await p.locator('main').innerText().catch(() => '')).slice(0, 600));
  } else {
    h.log('Ingen "Lägg till jobb"-knapp — kan inte lägga till erfarenhet.');
  }

  // Exportera PDF
  const tPdf = Date.now();
  const exportKnapp = p.getByRole('button', { name: /Exportera PDF/i }).first();
  if (await exportKnapp.count()) {
    const nedladdning = p.waitForEvent('download', { timeout: 20000 }).catch((e) => null);
    await exportKnapp.click();
    const dl = await nedladdning;
    if (dl) {
      const filnamn = dl.suggestedFilename();
      await dl.saveAs(`${h.UT}/bengt-cv-mobil.pdf`);
      h.log('PDF nedladdad:', filnamn, 'på ms', Date.now() - tPdf);
    } else {
      h.log('INGEN nedladdning triggades inom 20s efter Exportera PDF-klick.');
    }
    await p.waitForTimeout(1000);
    await h.shot('36-efter-pdf-export');
  }
};
