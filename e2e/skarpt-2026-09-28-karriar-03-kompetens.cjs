module.exports = async (p, h) => {
  await h.go('/skills-gap-analysis');
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
  await h.shot('20-kompetens-forst');

  const textarea = p.getByPlaceholder(/Klistra in en jobbannons/);
  await textarea.fill('Redovisningsekonom');
  await h.shot('21-dromjobb-ifyllt');
  await p.getByRole('button', { name: /Visa vad som behövs/ }).click();
  await p.waitForTimeout(20000); // AI-anrop: gap-analys
  await h.shot('22-analys-resultat');
  const t1 = await h.text();
  h.log('VISAR_RESULTAT', /gap|kompetens|Vad du redan kan|behöver/i.test(t1));
  h.log('VISAR_KURSER', /kurs|utbildning|Kurser/i.test(t1));

  const laggTill = p.getByRole('button', { name: /Ta med det här i din plan/ });
  if (await laggTill.count()) {
    await laggTill.first().click();
    await p.waitForTimeout(2000);
    await h.shot('23-efter-lagg-till-plan');
  }

  // Ladda om — ska analysen finnas kvar (sparad)?
  await p.reload();
  await p.waitForTimeout(3000);
  await h.shot('24-efter-omladdning');
  const t2 = await h.text();
  h.log('ANALYS_KVAR_EFTER_OMLADDNING', /Redovisningsekonom/.test(t2));
  h.log('KLART sk-03-kompetens');
};
