// Fatima 05 — mörkt läge på hennes viktigaste sidor.
module.exports = async (p, h) => {
  await h.go('/oversikt');
  await h.shot('50-oversikt-morkt');
  await h.go('/min-vecka');
  await h.shot('51-min-vecka-morkt');
  await h.go('/international');
  await h.shot('52-international-morkt');
  await h.go('/my-consultant');
  await h.shot('53-min-konsulent-morkt');
  await h.go('/knowledge-base/article/aktivitetskrav-forsorjningsstod');
  await h.shot('54-artikel-morkt');
};
