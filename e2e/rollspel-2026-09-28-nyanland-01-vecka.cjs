// Fatima 01 — startsida, Min vecka (aktivitetskrav), sjukanmälan barn, konsulentmeddelande.
module.exports = async (p, h) => {
  await h.go('/');
  await h.shot('01-oversikt');

  await h.go('/min-vecka');
  await h.shot('02-min-vecka');

  // Försök hitta ett kommande pass och öppna "Jag kan inte komma".
  const knapp = p.getByRole('button', { name: /Jag kan inte komma/ }).first();
  if (await knapp.count()) {
    await knapp.click().catch(() => {});
    await p.waitForTimeout(500);
    await h.shot('03-franvaro-formular');
    // Välj "child_care" (Vab) om synligt.
    const barnRadio = p.getByText(/[Bb]arn/).first();
    if (await barnRadio.count()) await barnRadio.click().catch(() => {});
    await h.shot('04-franvaro-vald-orsak');
  } else {
    h.log('Ingen "Jag kan inte komma"-knapp hittades på Min vecka');
  }

  await h.go('/my-consultant');
  await h.shot('05-min-konsulent');
  const meddelandeFalt = p.getByPlaceholder(/./).last();
  if (await meddelandeFalt.count()) {
    await meddelandeFalt.click().catch(() => {});
    await h.shot('06-konsulent-meddelandefalt');
  }

  await h.go('/international');
  await h.shot('07-ny-i-sverige');

  await h.go('/settings');
  await h.shot('08-installningar');
};
