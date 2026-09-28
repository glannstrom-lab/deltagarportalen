// demo-leverantor@jobin.se — kopplar Jonas Demo och Sara Exempel till Nordfrakts
// nya platser (SL-skarpt) och föreslår dem för företaget. Dator.
module.exports = async (p, h) => {
  await h.go('/consultant/platser');
  await h.shot('01-platser-tab');

  const kopplaOchForesla = async (deltagarNamn, platsTextFragment, presentation) => {
    const laggTillKnapp = p.getByRole('button', { name: /Lägg till plats/i }).first();
    await laggTillKnapp.click();
    await p.waitForTimeout(800);
    await h.shot(`02-dialog-oppen-${deltagarNamn}`);

    // Välj bland företagens platser (Field är ett <label> som omsluter <select>)
    const foretagsplatsSelect = p.getByLabel(/Välj bland företagens platser/i);
    let anvandeSelect = false;
    if (await foretagsplatsSelect.count()) {
      const optionLoc = foretagsplatsSelect.locator('option', { hasText: platsTextFragment }).first();
      const optionText = await optionLoc.count() ? await optionLoc.textContent() : null;
      if (optionText) {
        await foretagsplatsSelect.selectOption({ label: optionText });
        anvandeSelect = true;
      }
    }
    h.log('ANVANDE-FORETAGSPLATS-SELECT', deltagarNamn, anvandeSelect);
    await h.shot(`03-plats-vald-${deltagarNamn}`);

    // Deltagare
    const deltagareSelect = p.getByLabel(/^Deltagare \*/i);
    await deltagareSelect.selectOption({ label: deltagarNamn });
    await h.shot(`04-deltagare-vald-${deltagarNamn}`);

    const spara = p.getByRole('button', { name: /^(Skapa plats|Spara ändringar)/i }).last();
    await spara.click();
    await p.waitForTimeout(1500);
    await h.shot(`05-efter-spara-${deltagarNamn}`);

    // Föreslå deltagaren för företaget — knappen för den senast tillagda raden
    const foreslaKnapp = p.getByRole('button', { name: /Föreslå deltagaren för företaget/i }).last();
    if (await foreslaKnapp.count()) {
      await foreslaKnapp.click();
      await p.waitForTimeout(800);
      await h.shot(`06-foresla-dialog-${deltagarNamn}`);

      const kompetenserBox = p.getByText('Kompetenser', { exact: true }).locator('xpath=ancestor::label//input[@type="checkbox"]').first();
      const erfarenhetBox = p.getByText('Arbetslivserfarenhet', { exact: true }).locator('xpath=ancestor::label//input[@type="checkbox"]').first();
      for (const box of [kompetenserBox, erfarenhetBox]) {
        if (await box.count()) await box.check().catch(() => {});
      }
      const textarea = p.locator('textarea').first();
      if (await textarea.count()) await textarea.fill(presentation);
      await h.shot(`07-foresla-ifylld-${deltagarNamn}`);

      const skicka = p.getByRole('button', { name: /Skicka frågan/i }).first();
      if (await skicka.count()) {
        await skicka.click();
        await p.waitForTimeout(1500);
        await h.shot(`08-efter-skicka-${deltagarNamn}`);
      } else {
        h.log('INGEN-SKICKA-KNAPP', deltagarNamn);
      }
    } else {
      h.log('INGEN-FORESLA-KNAPP', deltagarNamn);
    }
  };

  await kopplaOchForesla('Jonas Demo', 'Lager', 'Jonas är punktlig, gillar fysiskt arbete och har erfarenhet av lagerplock. Skarpt funktionstest 2026-09-28.');
  await kopplaOchForesla('Sara Exempel', 'Kontor', 'Sara är noggrann och van vid administration. Skarpt funktionstest 2026-09-28.');

  await h.go('/consultant/platser');
  await h.shot('09-platser-efter-allt');

  h.log('KLART: koppling + förslag för Jonas och Sara.');
};
