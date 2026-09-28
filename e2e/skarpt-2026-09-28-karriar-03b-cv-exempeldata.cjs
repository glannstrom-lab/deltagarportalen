module.exports = async (p, h) => {
  await h.go('/cv');
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
  await p.getByRole('button', { name: /Hoppa över/ }).click({ timeout: 2000 }).catch(() => {});
  await p.waitForTimeout(300);
  await h.shot('25-cv-fore-exempel');
  const knapp = p.getByRole('button', { name: /Exempeldata/ });
  await knapp.click();
  await p.waitForTimeout(500);
  await p.getByRole('button', { name: /^Fyll i$/ }).click({ timeout: 3000 }).catch(() => {});
  await p.waitForTimeout(1500);
  await h.shot('26-cv-efter-exempel');
  // Spara CV:t så erfarenhet/utbildning finns kvar
  const sparaKnapp = p.getByRole('button', { name: /^Spara CV$/ });
  if (await sparaKnapp.count()) {
    await sparaKnapp.click();
    await p.waitForTimeout(2000);
  }
  await h.shot('27-cv-sparat');
  h.log('KLART sk-03b');
};
