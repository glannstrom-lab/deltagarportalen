module.exports = async (p, h) => {
  await h.go('/salary');
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
  await p.getByRole('button', { name: /Hoppa över/ }).click({ timeout: 2000 }).catch(() => {});
  await h.shot('60-lon-forst');

  await p.locator('#salary-occupation').selectOption({ index: 1 });
  await p.locator('#salary-region').selectOption({ index: 1 });
  await p.locator('#salary-experience').selectOption({ index: 1 });
  await h.shot('61-lon-ifylld');
  await p.getByRole('button', { name: /Räkna ut din lön/ }).click();
  await p.waitForTimeout(1000);
  await h.shot('62-lon-berakning-resultat');
  const t1 = await h.text();
  h.log('VISAR_LONESPANN', /kr\/mån|median|Lönespann/i.test(t1));
  h.log('VISAR_SKATT', /nettolön|skatt|Netto/i.test(t1));

  // AI-lönekompassen
  const hamtaKnapp = p.getByRole('button', { name: /Hämta löneläget/ });
  if (await hamtaKnapp.count()) {
    await hamtaKnapp.click();
    await p.waitForTimeout(20000);
    await h.shot('63-lonekompass-ai');
    const t2 = await h.text();
    h.log('LONEKOMPASS_VISAR_DATA', /Marknadslön|Löneutveckling|förhandlingsläge|Jämförelser/i.test(t2));
  } else {
    h.log('INGEN HAMTA-KNAPP (kanske AI-samtycke saknas eller redan hämtat)');
  }
  h.log('KLART sk-06-lon');
};
