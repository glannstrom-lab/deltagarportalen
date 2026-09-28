// Nordfrakt (foretag.demo@example.com) — svarar på förslagen för Jonas (ja) och
// Sara (nej), kontrollerar FT1 (auto-tillsatt), notisklockan, gör en avstämning
// och skickar ett meddelande till coachen. Dator.
module.exports = async (p, h) => {
  await h.go('/foretag');
  const oversiktTextFore = await h.shot('01-oversikt-fore');
  const klockaFore = await p.getByRole('button', { name: /notifikation|notification/i }).first().textContent().catch(() => null);
  h.log('KLOCKA-FORE', klockaFore);

  // -- Jonas: "Vi vill gå vidare" --
  await h.go('/foretag/forslag');
  await h.shot('02-forslag-lista');
  const jonasKnapp = p.getByRole('button', { name: /Jonas/i }).first();
  if (await jonasKnapp.count()) {
    await jonasKnapp.click();
    await p.waitForTimeout(1200);
    await h.shot('03-jonas-detalj');
    const gaVidare = p.getByRole('button', { name: /Vi vill gå vidare/i });
    if (await gaVidare.count()) {
      await gaVidare.click();
      await p.waitForTimeout(700);
      const textarea = p.locator('#svar-meddelande');
      if (await textarea.count()) {
        await textarea.fill('Ja tack, vi vill gärna ta emot Jonas på lagret. Skarpt funktionstest 2026-09-28.');
      }
      await h.shot('04-svar-dialog-jonas');
      const skicka = p.getByRole('button', { name: /Skicka: vi vill gå vidare/i });
      await skicka.click();
      await p.waitForTimeout(2000);
      await h.shot('05-jonas-efter-svar');
    } else {
      h.log('INGEN-GA-VIDARE-KNAPP-JONAS');
    }
  } else {
    h.log('JONAS-FORSLAG-INTE-HITTAT');
  }

  // -- Sara: "Tacka nej" --
  await h.go('/foretag/forslag');
  await h.shot('06-forslag-lista-igen');
  const saraKnapp = p.getByRole('button', { name: /Sara/i }).first();
  if (await saraKnapp.count()) {
    await saraKnapp.click();
    await p.waitForTimeout(1200);
    await h.shot('07-sara-detalj');
    const tackaNej = p.getByRole('button', { name: /Tacka nej/i });
    if (await tackaNej.count()) {
      await tackaNej.click();
      await p.waitForTimeout(700);
      const textarea = p.locator('#svar-meddelande');
      if (await textarea.count()) {
        await textarea.fill('Tyvärr har vi inte plats för fler på kontoret just nu. Skarpt funktionstest 2026-09-28.');
      }
      await h.shot('08-svar-dialog-sara');
      const skicka = p.getByRole('button', { name: /Skicka: vi tackar nej/i });
      if (await skicka.count()) {
        await skicka.click();
      } else {
        // Om knappens text är annorlunda, ta den enda synliga "Skicka"-knappen i dialogen
        await p.getByRole('button', { name: /Skicka/i }).last().click();
      }
      await p.waitForTimeout(2000);
      await h.shot('09-sara-efter-svar');
    } else {
      h.log('INGEN-TACKA-NEJ-KNAPP-SARA');
    }
  } else {
    h.log('SARA-FORSLAG-INTE-HITTAT');
  }

  // -- Notisklockan efter --
  await h.go('/foretag');
  await h.shot('10-oversikt-efter');
  const klockaEfter = await p.getByRole('button', { name: /notifikation|notification/i }).first().textContent().catch(() => null);
  h.log('KLOCKA-EFTER', klockaEfter);

  // -- Platser: kontrollera status --
  await h.go('/foretag/platser');
  await h.shot('11-platser-status');

  // -- Pågående: avstämning på Jonas plats --
  await h.go('/foretag/pagaende');
  await h.shot('12-pagaende');
  const avstamningKnapp = p.getByRole('button', { name: /Gör en avstämning/i }).first();
  if (await avstamningKnapp.count()) {
    await avstamningKnapp.click();
    await p.waitForTimeout(800);
    await h.shot('13-avstamning-dialog');
    const braFalt = p.locator('#avstamning-bra');
    if (await braFalt.count()) await braFalt.fill('Jonas är på plats i tid och lär sig lagerrutinerna snabbt. Skarpt funktionstest.');
    const oroFalt = p.locator('#avstamning-oro');
    if (await oroFalt.count()) await oroFalt.fill('Inget särskilt.');
    const intresseSelect = p.locator('#avstamning-intresse');
    if (await intresseSelect.count()) await intresseSelect.selectOption('ja');
    const skickaAvst = p.getByRole('button', { name: /Skicka avstämningen/i });
    await skickaAvst.click();
    await p.waitForTimeout(2000);
    await h.shot('14-avstamning-efter');
  } else {
    h.log('INGEN-AVSTAMNINGSKNAPP-PA-PAGAENDE');
  }

  // -- Meddelande till coachen (Jonas tråd) --
  await h.go('/foretag/meddelanden');
  await h.shot('15-meddelanden-lista');
  const jonasTrad = p.getByRole('button', { name: /Jonas/i }).first();
  if (await jonasTrad.count()) {
    await jonasTrad.click();
    await p.waitForTimeout(1000);
    await h.shot('16-jonas-trad');
    const textarea = p.locator('#meddelande-text');
    if (await textarea.count()) {
      await textarea.fill('Hej! Jonas gör ett bra jobb hittills. Skarpt funktionstest — når det här meddelandet dig, Demo Coach? (2026-09-28)');
      const skickaBtn = p.getByRole('button', { name: /^Skicka$/i });
      await skickaBtn.click();
      await p.waitForTimeout(1500);
      await h.shot('17-jonas-trad-efter-skickat');
    }
  } else {
    h.log('INGEN-JONAS-TRAD-HITTAD');
  }

  h.log('KLART: Nordfrakt har svarat, gjort avstämning och skickat meddelande.');
};
