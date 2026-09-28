module.exports = async (p, h) => {
  await h.go('/personal-brand/pitch');
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
  await p.getByRole('button', { name: /Hoppa över/ }).click({ timeout: 2000 }).catch(() => {});
  await h.shot('80-varumarke-pitch-forst');

  const nyKnapp = p.getByRole('button', { name: /Ny pitch|Skapa pitch|Lägg till/ });
  if (await nyKnapp.count()) {
    await nyKnapp.first().click();
    await p.waitForTimeout(500);
  }
  await h.shot('81-pitch-formular');

  const titel = p.locator('#pitchtab-f1');
  if (await titel.count()) {
    await titel.fill('Min pitch som ekonomiassistent');
    await p.locator('#pitchtab-f5').fill('Jag är strukturerad och noggrann med erfarenhet av bokföring och Excel. Jag söker en roll som ekonomiassistent där jag kan växa vidare mot redovisningsekonom.');
    await h.shot('82-pitch-ifylld');
    await p.getByRole('button', { name: /^Spara$/ }).click();
    await p.waitForTimeout(2000);
    await h.shot('83-pitch-sparad');
  } else {
    h.log('INGET PITCH-FORMULÄR HITTADES');
  }

  await p.reload();
  await p.waitForTimeout(2000);
  await h.shot('84-pitch-efter-omladdning');
  const t = await h.text();
  h.log('PITCH_SPARAD_KVAR_EFTER_OMLADDNING', /Min pitch som ekonomiassistent/.test(t));
  h.log('KLART sk-08');
};
