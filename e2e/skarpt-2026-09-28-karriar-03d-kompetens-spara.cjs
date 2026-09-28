module.exports = async (p, h) => {
  await h.go('/skills-gap-analysis');
  await h.shot('30-kompetens-efter-ny-inloggning');
  const t0 = await h.text();
  h.log('ANALYS_SPARAD_VID_ATERBESOK', /Redovisningsekonom/.test(t0));

  const laggTill = p.getByRole('button', { name: /Ta med det här i din plan/ });
  if (await laggTill.count()) {
    await laggTill.first().click();
    await p.waitForTimeout(2000);
    await h.shot('31-efter-lagg-till-plan');
    const t1 = await h.text();
    h.log('BEKRAFTAR_TILLAGD', /tillagd|redan i din plan|Visa plan/i.test(t1));
  } else {
    h.log('INGEN LAGG-TILL-KNAPP');
  }
  h.log('KLART sk-03d');
};
