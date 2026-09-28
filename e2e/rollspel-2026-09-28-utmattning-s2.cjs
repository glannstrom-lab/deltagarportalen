// Amina, dålig dag: logga mående/energi, skriv i dagboken, se vad som krävs.
module.exports = async (p, h) => {
  await h.go('/wellness');
  const w1 = await h.shot('04-halsa-forst');
  h.log('HALSA FORST:', w1.slice(0, 2500));

  // Ge samtycke (art 9) för att se måendeloggen
  const samtyckBtn = p.getByRole('button', { name: /^Jag samtycker$/ });
  if (await samtyckBtn.count()) {
    await samtyckBtn.click();
    await p.waitForTimeout(1500);
    await h.shot('05-halsa-efter-samtycke');
  }

  const knappar = await p.locator('main').getByRole('button').allInnerTexts();
  h.log('KNAPPAR HALSA EFTER SAMTYCKE:', JSON.stringify(knappar));

  // Dagbok
  await h.go('/diary');
  const d1 = await h.shot('06-dagbok-forst');
  h.log('DAGBOK FORST:', d1.slice(0, 2500));
  const dagbokKnappar = await p.getByRole('button').allInnerTexts();
  h.log('DAGBOK KNAPPAR:', JSON.stringify(dagbokKnappar));
};
