module.exports = async (p, h) => {
  await h.go('/interest-guide?tab=results');
  await p.waitForTimeout(2000);
  await h.shot('46-resultat-efter-ny-sidladdning');
  const t = await h.text();
  h.log('RESULTAT_TOMT', /inget resultat|Gör testet först|Du har inte gjort/i.test(t));
  h.log('RESULTAT_VISAS', /RIASEC|Dina styrkor|Ditt resultat/i.test(t));

  await h.go('/interest-guide?tab=history');
  await p.waitForTimeout(1500);
  await h.shot('47-historik');
  const t2 = await h.text();
  h.log('HISTORIK_INNEHALLER_POST', /2026-09-28/.test(t2));
  h.log('KLART sk-04b');
};
