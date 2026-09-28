// Demo-leverantör (R&M-coach) — skapar en plats + föreslår Peter Testsson till Nordfrakt. Dator.
module.exports = async (p, h) => {
  await h.go('/consultant/platser');
  await h.shot('01-platser-tab');

  // Placeringen för Peter Testsson hos Nordfrakt skapades i en tidigare körning
  // (d0433aa0…, "planerad") — skapa inte en till, gå direkt på förslaget.
  const foreslaKnapp = p.getByRole('button', { name: /Föreslå deltagaren för företaget/i }).first();
  if (await foreslaKnapp.count()) {
    await foreslaKnapp.click();
    await p.waitForTimeout(1000);
    await h.shot('06-foresla-dialog');

    // Kryssa i fält att dela: kompetenser + arbetslivserfarenhet
    const kompetenserBox = p.getByText('Kompetenser', { exact: true }).locator('xpath=ancestor::label//input[@type="checkbox"]').first();
    const erfarenhetBox = p.getByText('Arbetslivserfarenhet', { exact: true }).locator('xpath=ancestor::label//input[@type="checkbox"]').first();
    for (const box of [kompetenserBox, erfarenhetBox]) {
      if (await box.count()) await box.check().catch(() => {});
    }

    // Skriv presentation
    const presentationFalt = p.locator('textarea').first();
    if (await presentationFalt.count()) {
      await presentationFalt.fill('Peter är noggrann, gillar rutiner och har erfarenhet av fysiskt arbete. Vill prova lager.');
    }
    await h.shot('07-foresla-dialog-ifylld');

    const skickaForslag = p.getByRole('button', { name: /Skicka frågan/i }).first();
    if (await skickaForslag.count()) {
      await skickaForslag.click();
      await p.waitForTimeout(1500);
      await h.shot('08-efter-skicka-forslag');
    } else {
      h.log('Ingen tydlig skicka-knapp i föreslå-dialogen');
      await h.shot('08b-foreslag-dialog-knappar-saknas');
    }
  } else {
    h.log('Ingen "Föreslå deltagaren för företaget"-knapp hittad — kanske syns inte platsen som nyss skapad, eller kräver scroll');
  }

  h.log('KLART: coach-rollspelet kört.');
};
