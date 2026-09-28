module.exports = async (p, h) => {
  await h.go('/interview-simulator');
  await h.shot('18-atersok-efter-avslutad');
  const t1 = await h.text();
  h.log('VISAR_FORTFARANDE_SAMMANFATTNING', /Bra jobbat!/.test(t1));
  h.log('AI_SAMMANFATTNING_TEXT_FINNS', /styrkor|Styrkor|förbättra|utveckla vidare/i.test(t1));
  h.log('SNURRA_KVAR', /Vi tittar igenom hela övningen/.test(t1));

  // Testa historikvyn: gå tillbaka till startskärmen ("Öva en gång till")
  const ovaIgen = p.getByRole('button', { name: /Öva en gång till/ });
  if (await ovaIgen.count()) {
    await ovaIgen.click();
    await p.waitForTimeout(1500);
    await h.shot('19-efter-ova-igen');
    const t2 = await h.text();
    h.log('HISTORIKLISTA_SYNS_PA_START', /Dina tidigare övningar/.test(t2));
  }
  h.log('KLART sk-02b');
};
