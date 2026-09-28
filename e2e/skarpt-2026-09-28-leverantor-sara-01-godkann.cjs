// Sara Exempel — godkänner delningsförslaget, och kontrollerar Min veckas
// text på svenska, engelska och Lätt svenska (RD3/RR2: ska ALDRIG säga
// kommun/socialtjänstlagen för en R&M-deltagare). Dator.
// OBS: kontot stod redan på engelska vid inloggning (delat demokonto) — knappar
// matchas därför bilingvalt.
module.exports = async (p, h) => {
  await h.go('/my-consultant');
  await h.shot('01-min-konsulent');

  const jaKnapp = p.getByRole('button', { name: /Ja, dela|Yes, share/i }).first();
  if (await jaKnapp.count()) {
    await jaKnapp.click();
    await p.waitForTimeout(1500);
    await h.shot('02-efter-ja-dela');
  } else {
    h.log('INGET-VANTANDE-FORSLAG-HITTADES-FOR-SARA');
    await h.shot('02b-inget-forslag');
  }

  const bytSprak = async (namn) => {
    const knapp = p.getByRole('button', { name: /Välj språk|Select language/i });
    await knapp.click();
    await p.waitForTimeout(400);
    const val = p.getByRole('option', { name: new RegExp(namn, 'i') });
    await val.click();
    await p.waitForTimeout(1200);
  };

  const kollaMinVecka = async (taggPrefix) => {
    await h.go('/min-vecka');
    const text = await h.shot(`${taggPrefix}-min-vecka`);
    h.log(`${taggPrefix}-NAMNER-ARBETSFORMEDLINGEN`, /Arbetsförmedlingen|Swedish Public Employment Service|Employment Service/i.test(text));
    h.log(`${taggPrefix}-NAMNER-RUSTA-OCH-MATCHA`, /Rusta och matcha/i.test(text));
    h.log(`${taggPrefix}-NAMNER-SOCIALTJANSTLAGEN`, /socialtjänstlagen|Social Services Act/i.test(text));
    h.log(`${taggPrefix}-NAMNER-SOCIALNAMND`, /socialnämnd|social welfare committee/i.test(text));
    h.log(`${taggPrefix}-NAMNER-KOMMUN`, /\bkommun(en)?\b|\bmunicipal/i.test(text));
    return text;
  };

  // 1. Nuvarande språk (kan vara engelska redan)
  await kollaMinVecka('03-forsta-sprak');

  // 2. Svenska
  await bytSprak('^Svenska$');
  await kollaMinVecka('04-sv');

  // 3. Engelska
  await bytSprak('^English$');
  await kollaMinVecka('05-en');

  // 4. Lätt svenska
  await bytSprak('Lätt svenska');
  await kollaMinVecka('06-lattsvenska');

  // Tillbaka till svenska
  await bytSprak('^Svenska$');

  h.log('KLART: Sara godkännande + Min vecka på tre språk.');
};
