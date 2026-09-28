module.exports = async (p, h) => {
  await h.go('/cv');
  await p.waitForTimeout(1500);
  const fullstandig = p.getByText('Eller använd den fullständiga CV-byggaren', { exact: false }).first();
  if (await fullstandig.count()) {
    await fullstandig.click();
    await p.waitForTimeout(1500);
  }
  const hoppaOver = p.getByRole('button', { name: /Hoppa över/i }).first();
  if (await hoppaOver.count()) {
    await hoppaOver.click();
    await p.waitForTimeout(1000);
  }
  await h.shot('26-cv-efter-tour');

  // Klicka steg 2 (troligen Erfarenhet i ordningen Design/Kontakt/Erfarenhet/...)
  for (const stegnr of [2, 3]) {
    const stegKnapp = p.locator('main').getByText(String(stegnr), { exact: true }).first();
    if (await stegKnapp.count()) {
      await stegKnapp.click();
      await p.waitForTimeout(1000);
      const rubrik = await p.locator('main').innerText().catch(() => '');
      h.log(`STEG ${stegnr} INNEHALL:`, rubrik.slice(rubrik.indexOf('Steg'), rubrik.indexOf('Steg') + 200));
    }
  }
  await h.shot('27-cv-steg-utforskat');
  const helText = await p.locator('main').innerText().catch(() => '');
  h.log('HELA HUVUDTEXTEN:', helText.slice(0, 4000));
};
