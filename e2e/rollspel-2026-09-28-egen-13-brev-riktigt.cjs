// Enda passet: navigera EN gång, klicka AI-utkast, och vänta kvar på SAMMA sida upp till 70s.
module.exports = async (p, h) => {
  await h.go('/cover-letter');
  await p.waitForTimeout(1500);

  const fortsatt = p.getByRole('button', { name: /Fortsätt på det/i }).first();
  if (await fortsatt.count()) {
    h.log('Fanns en återupptagningsbanner vid start — klickar bort den (Börja om) för ett rent test');
    const bo = p.getByRole('button', { name: /Börja om/i }).first();
    if (await bo.count()) await bo.click();
    await p.waitForTimeout(1000);
  }

  const jobbKort = p.getByText(/Truckförare med erfarenhet av skjutstativtruck/i).first();
  if (await jobbKort.count()) { await jobbKort.click(); await p.waitForTimeout(500); }
  const nasta = p.getByRole('button', { name: /^Nästa$/i }).first();
  if (await nasta.count()) { await nasta.click(); await p.waitForTimeout(1000); }

  const knapp = p.getByRole('button', { name: /Skriv ett utkast åt mig/i }).first();
  h.log('Utkastknapp finns:', await knapp.count());
  const t0 = Date.now();
  await knapp.click();

  let text = '';
  let klart = false;
  for (let i = 0; i < 9; i++) {
    await p.waitForTimeout(8000);
    text = await p.locator('main').innerText().catch(() => '');
    const genererar = /Skriver ett utkast/.test(text);
    h.log(`Poll ${i} (${Date.now() - t0}ms): genererar fortfarande?`, genererar);
    if (!genererar) { klart = true; break; }
  }
  await h.shot('80-brev-klart-eller-timeout');
  h.log('KLAR efter ms:', Date.now() - t0, 'klart:', klart);
  h.log('SLUTTEXT (brevdel):', text.slice(text.indexOf('Nu skriver vi brevet'), text.indexOf('Nu skriver vi brevet') + 2500));
};
