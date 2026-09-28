// Amina: Inställningar — Integritet (dela mående med konsulent), Utseende (större text),
// och Lugnare läge/fokusläge/pauspåminnelse i praktiken.
module.exports = async (p, h) => {
  await h.go('/settings');
  await p.waitForTimeout(1500);
  await h.shot('13-installningar-forst');
  const flikar = await p.getByRole('tab').allInnerTexts().catch(() => []);
  h.log('FLIKAR:', JSON.stringify(flikar));
  const knappar = await p.locator('main').getByRole('button').allInnerTexts();
  h.log('KNAPPAR INSTALLNINGAR:', JSON.stringify(knappar));

  // Försök klicka Integritet
  const integritet = p.getByRole('button', { name: /Integritet/i }).first();
  if (await integritet.count()) {
    await integritet.click();
    await p.waitForTimeout(1200);
    await h.shot('14-integritet');
    const t = await p.locator('main').innerText().catch(() => '');
    h.log('INTEGRITET TEXT:', t.slice(0, 3000));
  }
};
