module.exports = async (p, h) => {
  await h.go('/interest-guide');
  await p.waitForTimeout(1000);
  await p.getByText('Se dina resultat', { exact: true }).click();
  await p.waitForTimeout(1500);
  await h.shot('48-riktiga-resultatet');
  const t = await h.text();
  h.log('VISAR_RIASEC', /RIASEC|Realistisk|Undersökande|Konstnärlig|Socialt|Företagsam|Konventionell/i.test(t));
  h.log('VISAR_BIGFIVE', /Öppenhet|Samvetsgrannhet|Extraversion/i.test(t));
  h.log('VISAR_ICF_HALSA', /ICF|funktionsförmåga|kognition|koncentration/i.test(t));

  await p.getByText('Historik', { exact: true }).first().click({ timeout: 3000 }).catch(() => {});
  await p.waitForTimeout(1000);
  await h.shot('49-historik-klick');
  const t2 = await h.text();
  h.log('HISTORIK_TOM', /Ingen historik|inga tidigare|Inga sparade/i.test(t2));
  h.log('HISTORIK_HAR_POST', /2026-09-28/.test(t2));
  h.log('KLART sk-04c');
};
