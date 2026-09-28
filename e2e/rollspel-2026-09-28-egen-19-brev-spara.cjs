module.exports = async (p, h) => {
  await h.go('/cover-letter');
  await p.waitForTimeout(1500);
  const fortsatt = p.getByRole('button', { name: /Fortsätt på det/i }).first();
  if (await fortsatt.count()) { await fortsatt.click(); await p.waitForTimeout(1200); }
  await h.shot('100-brev-vid-ankomst');
  let text = await p.locator('main').innerText().catch(() => '');
  h.log('Läge:', text.slice(0, 600));

  // Om brevtexten inte finns (data borta pga tidigare "Fortsätt på det"-bugg), generera på nytt
  if (!/Jag skriver för att uttrycka|Jag söker tjänsten|intresse för tjänsten/i.test(text)) {
    h.log('Inget existerande utkast hittades i texten — startar om från jobbval.');
    const jobbKort = p.getByText(/Truckförare med erfarenhet av skjutstativtruck/i).first();
    if (await jobbKort.count()) { await jobbKort.click(); await p.waitForTimeout(500); }
    const nasta1 = p.getByRole('button', { name: /^Nästa$/i }).first();
    if (await nasta1.count()) { await nasta1.click(); await p.waitForTimeout(1000); }
    const knapp = p.getByRole('button', { name: /Skriv ett utkast åt mig/i }).first();
    if (await knapp.count()) {
      await knapp.click();
      for (let i = 0; i < 9; i++) {
        await p.waitForTimeout(8000);
        text = await p.locator('main').innerText().catch(() => '');
        if (!/Skriver ett utkast/.test(text)) break;
      }
    }
  }
  await h.shot('101-brev-fardigt-eller-genererat');

  const nastaTillSteg3 = p.getByRole('button', { name: /^Nästa$/i }).first();
  if (await nastaTillSteg3.count()) {
    await nastaTillSteg3.click();
    await p.waitForTimeout(1500);
  }
  await h.shot('102-steg3-las-igenom');
  text = await p.locator('main').innerText().catch(() => '');
  h.log('Steg 3-text:', text.slice(0, 1200));

  const sparaKnapp = p.getByRole('button', { name: /^Spara/i }).first();
  if (await sparaKnapp.count()) {
    await sparaKnapp.click();
    await p.waitForTimeout(1500);
    h.log('Klickade Spara på steg 3');
  } else {
    h.log('INGEN Spara-knapp hittad på steg 3');
  }
  await h.shot('103-efter-spara');
  h.log('Text efter spara:', (await p.locator('main').innerText().catch(() => '')).slice(0, 800));
};
