// demo-leverantor@jobin.se — läsande kontroller: FT1 "inte längre valbar",
// meddelandetråden från Nordfrakt, aktivitetsloggen mot avtalskravet,
// kapacitet, och avvikelserapport-kortet för Jonas. Dator.
module.exports = async (p, h) => {
  // 1. FT1: SL-skarpt Lager ska INTE längre gå att välja för en NY placering.
  await h.go('/consultant/platser');
  await h.shot('01-platser-tab');
  const laggTillKnapp = p.getByRole('button', { name: /Lägg till plats/i }).first();
  await laggTillKnapp.click();
  await p.waitForTimeout(800);
  const foretagsplatsSelect = p.getByLabel(/Välj bland företagens platser/i);
  const optionsText = await foretagsplatsSelect.locator('option').allTextContents().catch(() => []);
  h.log('FORETAGSPLATS-OPTIONER', JSON.stringify(optionsText));
  h.log('LAGER-VALBAR-FT1-SKA-VARA-FALSE', optionsText.some((t) => /SL-skarpt Lager/i.test(t)));
  h.log('KONTOR-VALBAR-SKA-VARA-TRUE', optionsText.some((t) => /SL-skarpt Kontor/i.test(t)));
  await h.shot('02-foretagsplats-optioner');
  const avbryt = p.getByRole('button', { name: /Avbryt/i }).first();
  if (await avbryt.count()) await avbryt.click();
  await p.waitForTimeout(500);

  // 2. Meddelandetråden från Nordfrakt — når den coachen?
  await h.go('/consultant/platser');
  const jonasKort = p.locator('text=SL-skarpt Lager 2026-09-28').locator('xpath=ancestor::div[contains(@class,"space-y-2")][1]').first();
  const oppnaTrad = jonasKort.getByRole('button', { name: /Öppna tråd/i }).first();
  if (await oppnaTrad.count()) {
    await oppnaTrad.click();
    await p.waitForTimeout(1000);
    const tradText = await h.shot('03-foretagstrad-jonas');
    h.log('TRADEN-INNEHALLER-MITT-MEDDELANDE', /når det här meddelandet dig, Demo Coach/i.test(tradText));
  } else {
    h.log('INGEN-OPPNA-TRAD-KNAPP-PA-JONAS-KORT');
  }

  // 3. Rapporter — aktivitetsloggen mot avtalskravet (RR1) + kundtypsstyrd rapporttyp (RR9)
  await h.go('/consultant/analytics');
  await h.shot('04-rapporter-oversikt');
  const rapportText = await h.text();
  h.log('RAPPORT-NAMNER-NAMNDRAPPORT-SKA-VARA-FALSE-FOR-LEVERANTOR', /Nämndrapport/i.test(rapportText));

  // 4. Kapacitet i Inställningar
  await h.go('/consultant/settings');
  await h.shot('05-installningar-organisation');
  const settingsText = await h.text();
  h.log('INSTALLNINGAR-NAMNER-KAPACITET', /kapacitet|Mot taket/i.test(settingsText));
  h.log('INSTALLNINGAR-NAMNER-KOMMUN-ROLLER-SKA-VARA-FALSE', /Handläggare \(ekonomiskt bistånd\)/i.test(settingsText));

  // 5. Avvikelserapport-kortet hos Jonas (Aktivitet-fliken)
  await h.go('/consultant/participants');
  await h.shot('06-deltagarlista');
  const jonasRad = p.getByRole('link', { name: /Jonas Demo/i }).first();
  if (await jonasRad.count()) {
    await jonasRad.click();
  } else {
    await p.getByText('Jonas Demo', { exact: false }).first().click();
  }
  await p.waitForTimeout(1200);
  await h.shot('07-jonas-detaljsida');
  const aktivitetFlik = p.getByRole('tab', { name: /Aktivitet/i }).first();
  if (await aktivitetFlik.count()) {
    await aktivitetFlik.click();
    await p.waitForTimeout(1000);
  }
  const aktivitetText = await h.shot('08-jonas-aktivitet');
  h.log('AVVIKELSERAPPORT-SYNS', /[Aa]vvikelserapport/i.test(aktivitetText));
  h.log('SOCIALTJANSTLAGEN-SYNS-SKA-VARA-FALSE', /socialtjänstlagen/i.test(aktivitetText));
  h.log('SOCIALNAMND-SYNS-SKA-VARA-FALSE', /socialnämnd/i.test(aktivitetText));
  h.log('FORSORJNINGSHINDER-SYNS-SKA-VARA-FALSE', /[Ff]örsörjningshinder/i.test(aktivitetText));

  h.log('KLART: läsande kontroller genomförda.');
};
