module.exports = async (p, h) => {
  if (p.url() === 'about:blank') await h.go('/cover-letter');
  await p.waitForTimeout(1500);
  // Se till att vi är på steg 2 (jobb redan valt i förra passet, state ska ha sparats)
  const utkastKnapp = p.getByRole('button', { name: /Skriv ett utkast åt mig/i }).first();
  if (!(await utkastKnapp.count())) {
    h.log('Utkastknapp syns inte direkt — försöker välja jobb och gå till steg 2 igen');
    const jobbKort = p.getByText(/Truckförare med erfarenhet av skjutstativtruck/i).first();
    if (await jobbKort.count()) { await jobbKort.click(); await p.waitForTimeout(500); }
    const nasta = p.getByRole('button', { name: /^Nästa$/i }).first();
    if (await nasta.count()) { await nasta.click(); await p.waitForTimeout(1200); }
  }
  await h.shot('73-fore-ai-klick');
  const knapp = p.getByRole('button', { name: /Skriv ett utkast åt mig/i }).first();
  h.log('Utkastknapp finns:', await knapp.count());
  const t0 = Date.now();
  await knapp.click();
  // Vänta på att brevtexten fylls i (leta efter en längre textmassa i förhandsvisningen)
  await p.waitForTimeout(15000);
  const tid = Date.now() - t0;
  await h.shot('74-efter-ai-generering');
  const text = await p.locator('main').innerText().catch(() => '');
  h.log('AI-generering tog ca ms:', tid);
  h.log('Text efter generering:', text.slice(0, 2500));
};
