module.exports = async (p, h) => {
  // Vi landar redan inloggade (runner gör visa-som-inloggningen). Gå till start.
  await h.go('/oversikt');
  await h.shot('01-oversikt-forst');

  // Samtyckessteget (villkor + integritet + AI, frivillig ruta ikryssad)
  const dialog = p.locator('[data-testid="samtyckessteg"]');
  if (await dialog.count()) {
    await p.locator('#samtycke-villkor').check().catch(() => {});
    await p.locator('#samtycke-integritet').check().catch(() => {});
    await p.locator('#samtycke-ai').check().catch(() => {});
    await h.shot('02-samtycke-ifyllt');
    await p.getByRole('button', { name: /Godkänn och fortsätt/ }).click();
    await p.waitForTimeout(2500);
    await h.shot('03-efter-samtycke');
  } else {
    h.log('INGET SAMTYCKESSTEG SYNTES');
  }

  // Cookie-banner (om den inte redan togs av go())
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});

  // Kort CV via QuickCVMode så AI har underlag
  await h.go('/cv');
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
  await p.getByRole('button', { name: /Hoppa över/ }).click({ timeout: 1500 }).catch(() => {});
  await p.waitForTimeout(500);
  await h.shot('04-cv-forst');
  const namnFalt = p.getByPlaceholder(/Ditt namn/);
  if (await namnFalt.count()) {
    await namnFalt.fill('Karin Skarp');
    await p.getByRole('button', { name: /Nästa|Fortsätt/ }).click();
    await p.waitForTimeout(500);
    await p.getByPlaceholder(/Projektledare, Säljare, Utvecklare/).fill('Ekonomiassistent');
    await p.getByRole('button', { name: /Nästa|Fortsätt/ }).click();
    await p.waitForTimeout(500);
    await p.getByPlaceholder(/din.email@exempel.se/).fill('skarpt-karriar-2026-09-28@jobin.test');
    await h.shot('05-quickcv-ifyllt');
    await p.getByRole('button', { name: /Skapa CV|Fortsätt|Skapa mitt CV/ }).click();
    await p.waitForTimeout(3000);
    await h.shot('06-cv-skapat');
  } else {
    h.log('QuickCVMode syntes inte — kanske redan finns CV-data');
  }
  h.log('KLART sk-01');
};
