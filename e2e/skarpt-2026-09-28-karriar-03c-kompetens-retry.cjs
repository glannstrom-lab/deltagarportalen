module.exports = async (p, h) => {
  await h.go('/skills-gap-analysis');
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
  await h.shot('28-kompetens-omforsok-forst');
  const textarea = p.getByPlaceholder(/Klistra in en jobbannons/);
  if (await textarea.count()) {
    await textarea.fill('Redovisningsekonom');
    await p.getByRole('button', { name: /Visa vad som behövs/ }).click();
  }
  await p.waitForTimeout(40000); // längre väntan — "kan ta upp till en minut"
  await h.shot('29-kompetens-omforsok-resultat');
  const t = await h.text();
  h.log('VISAR_GAP_RESULTAT', /Vad du redan har|behöver utveckla|Din utvecklingsplan|Kompetensjämförelse/i.test(t));
  h.log('VISAR_FELMEDDELANDE', /gick inte|kunde inte|försök igen/i.test(t));
  h.log('KLART sk-03c');
};
