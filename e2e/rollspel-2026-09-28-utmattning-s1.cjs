// Amina, dålig dag, mobil, mörkt läge, kl 21. Vad möter henne först?
module.exports = async (p, h) => {
  // Startsökväg '/' hanteras av körarens visa-som-flöde (till=/).
  await p.waitForTimeout(1500);
  const startText = await h.shot('01-forsta-skarmen');
  h.log('ORD PA FORSTA SKARMEN:', startText.trim().split(/\s+/).length);
  h.log('TEXT:', startText.slice(0, 1500));

  // Översikt (om vi inte redan är där)
  await h.go('/oversikt');
  const ov = await h.shot('02-oversikt');
  h.log('OVERSIKT ORD:', ov.trim().split(/\s+/).length);

  // Min vecka — vad krävs, siffror, röda varningar?
  await h.go('/min-vecka');
  const mv = await h.shot('03-min-vecka');
  h.log('MIN VECKA:', mv.slice(0, 3000));

  // Leta upp dagens pass och se om det finns en "jag orkar inte idag"-väg
  const knappar = await p.getByRole('button').allInnerTexts();
  h.log('KNAPPAR MIN VECKA:', JSON.stringify(knappar));
};
