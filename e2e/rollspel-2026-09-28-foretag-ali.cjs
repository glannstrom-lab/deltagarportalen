// Ali, Nordfrakt Logistik (demo) — företagskontot, mobil.
module.exports = async (p, h) => {
  // 1. Startsida efter inloggning — ska landa på /foretag (StartRedirect).
  await h.go('/');
  await h.shot('01-start');

  // 2. Översikt
  await h.go('/foretag');
  await h.shot('02-oversikt');

  // 3. Förslag — lista
  await h.go('/foretag/forslag');
  await h.shot('03-forslag-lista');

  // Öppna Omars förslag (pending) om det finns
  const omarKnapp = p.getByRole('button', { name: /Omar/i }).first();
  if (await omarKnapp.count()) {
    await omarKnapp.click();
    await p.waitForTimeout(1500);
    await h.shot('04-forslag-omar-detalj');

    const gaVidare = p.getByRole('button', { name: /Vi vill gå vidare/i });
    if (await gaVidare.count()) {
      await gaVidare.click();
      await p.waitForTimeout(800);
      await h.shot('05-svar-dialog');
      const textarea = p.locator('#svar-meddelande');
      if (await textarea.count()) {
        await textarea.fill('Ja tack, vi vill gärna ta emot Omar. Vi kan ta ett första möte redan nästa vecka, ring mig på 070-000 00 00.');
      }
      const skicka = p.getByRole('button', { name: /Skicka: vi vill gå vidare/i });
      await skicka.click();
      await p.waitForTimeout(2000);
      await h.shot('06-forslag-omar-efter-svar');
    }
  } else {
    h.log('Omars förslag hittades inte i listan');
  }

  // 4. Våra platser
  await h.go('/foretag/platser');
  await h.shot('07-platser');

  // 5. Pågående — Anna
  await h.go('/foretag/pagaende');
  await h.shot('08-pagaende');

  const avstamningKnapp = p.getByRole('button', { name: /Gör en avstämning/i }).first();
  if (await avstamningKnapp.count()) {
    await avstamningKnapp.click();
    await p.waitForTimeout(800);
    await h.shot('09-avstamning-dialog');
    const braFalt = p.locator('#avstamning-bra');
    if (await braFalt.count()) {
      await braFalt.fill('Anna är på plats varje dag, lär sig snabbt och sköter fakturering nu nästan själv.');
    }
    const oroFalt = p.locator('#avstamning-oro');
    if (await oroFalt.count()) {
      await oroFalt.fill('Inget särskilt just nu.');
    }
    const intresseSelect = p.locator('#avstamning-intresse');
    if (await intresseSelect.count()) {
      await intresseSelect.selectOption('ja');
    }
    const skickaAvst = p.getByRole('button', { name: /Skicka avstämningen/i });
    await skickaAvst.click();
    await p.waitForTimeout(2000);
    await h.shot('10-avstamning-efter');
  } else {
    h.log('Ingen avstämningsknapp hittades (kanske ingen pågående placering)');
  }

  // 6. Meddelanden
  await h.go('/foretag/meddelanden');
  await h.shot('11-meddelanden-lista');
  const annaTrad = p.getByRole('button', { name: /Anna/i }).first();
  if (await annaTrad.count()) {
    await annaTrad.click();
    await p.waitForTimeout(1200);
    await h.shot('12-meddelanden-anna-trad');
    const textarea = p.locator('#meddelande-text');
    if (await textarea.count()) {
      await textarea.fill('Hej! Bra jobbat med avstämningen, Anna sköter sig fint. Hör av dig om något dyker upp.');
      const skickaBtn = p.getByRole('button', { name: /^Skicka$/i });
      await skickaBtn.click();
      await p.waitForTimeout(1500);
      await h.shot('13-meddelanden-anna-efter-skickat');
    }
  }

  // 7. Stöd och regler
  await h.go('/foretag/stod');
  await h.shot('14-stod');

  // 8. Om företaget
  await h.go('/foretag/om');
  await h.shot('15-om-foretaget');

  // Bjud in kollega — öppna dialogen men avbryt (inget riktigt mejl ska skickas)
  const bjudInKnapp = p.getByRole('button', { name: /Bjud in kollega/i });
  if (await bjudInKnapp.count()) {
    await bjudInKnapp.click();
    await p.waitForTimeout(800);
    await h.shot('16-bjud-in-kollega-dialog');
    const avbryt = p.getByRole('button', { name: /Avbryt/i });
    if (await avbryt.count()) await avbryt.click();
    await p.waitForTimeout(500);
  }

  h.log('KLART: Alis rollspel körd.');
};
