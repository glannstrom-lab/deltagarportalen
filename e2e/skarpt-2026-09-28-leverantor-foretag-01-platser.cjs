// Nordfrakt (foretag.demo@example.com) — skapar två nya platser för det skarpa
// funktionstestet av leverantörsområdet (SL). Dator.
module.exports = async (p, h) => {
  await h.go('/foretag/platser');
  await h.shot('01-platser-fore');

  const skapaPlats = async (titel, beskrivning, typ) => {
    const knapp = p.getByRole('button', { name: /Lägg till (en )?plats/i }).first();
    await knapp.click();
    await p.waitForTimeout(800);
    await p.locator('#plats-title').fill(titel);
    await p.locator('#plats-typ').selectOption(typ).catch(() => {});
    await p.locator('#plats-description').fill(beskrivning);
    await h.shot(`02-dialog-ifylld-${titel.slice(0, 12)}`);
    await p.getByRole('button', { name: /Lägg till platsen/i }).click();
    await p.waitForTimeout(1500);
  };

  await skapaPlats('SL-skarpt Lager 2026-09-28', 'Lagerarbete, plockning och packning. Skarpt funktionstest av leverantörsflödet.', 'praktik');
  await h.shot('03-efter-plats-1');

  await skapaPlats('SL-skarpt Kontor 2026-09-28', 'Enklare kontorsuppgifter, registrering. Skarpt funktionstest.', 'arbetstraning');
  await h.shot('04-efter-plats-2');

  const text = await h.text();
  h.log('PLATSER-TEXT-INNEHALLER-SKARPT', text.includes('SL-skarpt'));
  h.log('KLART: Nordfrakt har skapat två nya platser.');
};
