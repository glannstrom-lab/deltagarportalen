module.exports = async (p, h) => {
  await h.go('/cv');
  await p.waitForTimeout(1500);
  const fullstandig = p.getByText('Eller använd den fullständiga CV-byggaren', { exact: false }).first();
  if (await fullstandig.count()) { await fullstandig.click(); await p.waitForTimeout(1500); }
  const hoppaOver = p.getByRole('button', { name: /Hoppa över/i }).first();
  if (await hoppaOver.count()) { await hoppaOver.click(); await p.waitForTimeout(1000); }

  // Steg 3: Profil -- testa AI-skrivhjälpen med AI avstängt
  await p.locator('main').getByText('3', { exact: true }).first().click();
  await p.waitForTimeout(1000);
  const genereraBtn = p.getByRole('button', { name: /Generera sammanfattning/i });
  h.log('GENERERA-KNAPP FINNS:', await genereraBtn.count());
  if (await genereraBtn.count()) {
    await genereraBtn.click();
    await p.waitForTimeout(2500);
    await h.shot('28-efter-generera-sammanfattning-ai-av');
    const t = await p.locator('main').innerText().catch(() => '');
    h.log('EFTER GENERERA-KLICK:', t.slice(0, 1500));
  }

  // Steg 4: Erfarenhet -- lägg till två jobb med ett glapp
  await p.locator('main').getByText('4', { exact: true }).first().click();
  await p.waitForTimeout(1200);
  await h.shot('29-cv-steg4');
  const t2 = await p.locator('main').innerText().catch(() => '');
  h.log('STEG 4 INNEHALL:', t2.slice(0, 3000));
  const knappar = await p.locator('main').getByRole('button').allInnerTexts();
  h.log('KNAPPAR STEG 4:', JSON.stringify(knappar));
};
