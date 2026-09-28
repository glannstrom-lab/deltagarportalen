// Fatima 03 — CV-byggaren på mobil, kunskapsbankens artikel om aktivitetskravet (sv + en).
module.exports = async (p, h) => {
  await h.go('/cv');
  await h.shot('30-cv-oversikt');

  // Försök starta/öppna CV-byggaren
  const byggKnapp = p.getByRole('link', { name: /Skapa|Bygg|Kom igång|Fortsätt/ }).first();
  if (await byggKnapp.count()) {
    await byggKnapp.click().catch(() => {});
    await p.waitForTimeout(1500);
  }
  await h.shot('31-cv-byggare-steg');

  // Knowledge base — sök artikeln om aktivitetskravet
  await h.go('/knowledge-base');
  await h.shot('32-kunskapsbank-lista');
  const sok = p.getByPlaceholder(/[Ss]ök/).first();
  if (await sok.count()) {
    await sok.fill('aktivitetskrav').catch(() => {});
    await p.waitForTimeout(800);
  }
  await h.shot('33-kunskapsbank-sok-aktivitetskrav');
  const artikelLank = p.locator('a,button').filter({ hasText: /Aktivitetskravet/i }).first();
  if (await artikelLank.count()) {
    await artikelLank.click().catch(() => {});
    await p.waitForTimeout(1200);
  }
  await h.shot('34-artikel-aktivitetskrav-svenska');

  // Byt till English och kolla samma artikel
  const knapp = p.getByRole('button', { name: /Välj språk/ }).first();
  if (await knapp.count()) {
    await knapp.click().catch(() => {});
    await p.waitForTimeout(300);
    const en = p.getByText('English', { exact: true }).first();
    if (await en.count()) { await en.click().catch(() => {}); await p.waitForTimeout(1200); }
  }
  await h.shot('35-artikel-aktivitetskrav-english');

  // Sök samma sak fast lättsvensk-artikeln (försörjningsstöd)
  const knapp2 = p.getByRole('button', { name: /Select language/ }).first();
  if (await knapp2.count()) {
    await knapp2.click().catch(() => {});
    await p.waitForTimeout(300);
    const sv = p.getByText('Svenska', { exact: true }).first();
    if (await sv.count()) { await sv.click().catch(() => {}); await p.waitForTimeout(1200); }
  }
  await h.go('/knowledge-base');
  const sok2 = p.getByPlaceholder(/[Ss]ök/).first();
  if (await sok2.count()) {
    await sok2.fill('försörjningsstöd').catch(() => {});
    await p.waitForTimeout(800);
  }
  await h.shot('36-kunskapsbank-sok-forsorjningsstod');
};
