// CV-byggaren: glappet på tre år. Amina vill förklara det utan att ljuga.
module.exports = async (p, h) => {
  await h.go('/cv');
  await p.waitForTimeout(2000);
  await h.shot('24-cv-forst');
  const t1 = await p.locator('main').innerText().catch(() => '');
  h.log('CV FORST:', t1.slice(0, 2000));

  const fullstandig = p.getByText('Eller använd den fullständiga CV-byggaren', { exact: false }).first();
  if (await fullstandig.count()) {
    await fullstandig.click();
    await p.waitForTimeout(1500);
    await h.shot('24b-cv-full-byggare');
  }

  // Hitta Erfarenhet-steget
  const erfLank = p.getByText('Erfarenhet', { exact: false }).first();
  if (await erfLank.count()) {
    await erfLank.click();
    await p.waitForTimeout(1200);
    await h.shot('25-cv-erfarenhet');
    const t2 = await p.locator('main').innerText().catch(() => '');
    h.log('ERFARENHET:', t2.slice(0, 2000));
    const knappar = await p.locator('main').getByRole('button').allInnerTexts();
    h.log('KNAPPAR ERFARENHET:', JSON.stringify(knappar));
  }
};
