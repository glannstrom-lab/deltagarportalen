// Jonas Demo — godkänner delningsförslaget från coachen (Min konsulent), och
// kontrollerar Min veckas text (ska säga Arbetsförmedlingen/Rusta och matcha,
// inte kommun/socialtjänstlagen). Dator, svenska.
module.exports = async (p, h) => {
  await h.go('/my-consultant');
  await h.shot('01-min-konsulent');

  const jaKnapp = p.getByRole('button', { name: /Ja, dela/i }).first();
  if (await jaKnapp.count()) {
    await jaKnapp.click();
    await p.waitForTimeout(1500);
    await h.shot('02-efter-ja-dela');
  } else {
    h.log('INGET-VANTANDE-FORSLAG-HITTADES-FOR-JONAS');
    await h.shot('02b-inget-forslag');
  }

  // Min vecka — regelverkstext
  await h.go('/min-vecka');
  const text = await h.shot('03-min-vecka-sv');
  h.log('SV-NAMNER-ARBETSFORMEDLINGEN', /Arbetsförmedlingen/i.test(text));
  h.log('SV-NAMNER-RUSTA-OCH-MATCHA', /Rusta och matcha/i.test(text));
  h.log('SV-NAMNER-SOCIALTJANSTLAGEN', /socialtjänstlagen/i.test(text));
  h.log('SV-NAMNER-SOCIALNAMND', /socialnämnd/i.test(text));
  h.log('SV-NAMNER-KOMMUN', /\bkommun/i.test(text));

  // Närvarointyg-PDF — leta upp knappen
  const intygKnapp = p.getByRole('button', { name: /Ladda ner närvarointyg/i }).first();
  if (await intygKnapp.count()) {
    await h.shot('04-fore-narvarointyg');
    const [download] = await Promise.all([
      p.waitForEvent('download', { timeout: 15000 }).catch(() => null),
      intygKnapp.click(),
    ]);
    if (download) {
      const savePath = require('path').join(h.UT, 'narvarointyg-jonas.pdf');
      await download.saveAs(savePath);
      h.log('NARVAROINTYG-NEDLADDAT', savePath);
    } else {
      h.log('NARVAROINTYG-INGEN-NEDLADDNING-HANDELSE');
    }
    await h.shot('05-efter-narvarointyg');
  } else {
    h.log('INGEN-NARVAROINTYG-KNAPP-HITTAD');
  }

  h.log('KLART: Jonas godkännande + Min vecka + intyg.');
};
