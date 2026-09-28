// Peter Testsson — deltagare som svarar på delningsförslaget från sin coach. Mobil.
module.exports = async (p, h) => {
  await h.go('/my-consultant');
  await h.shot('01-min-konsulent');

  const jaKnapp = p.getByRole('button', { name: /Ja, dela|Godkänn|Säg ja|Tacka ja/i }).first();
  if (await jaKnapp.count()) {
    await jaKnapp.click();
    await p.waitForTimeout(1500);
    await h.shot('02-efter-ja');
  } else {
    h.log('Ingen tydlig ja-knapp hittad på Min konsulent-sidan');
    await h.shot('02b-ingen-ja-knapp');
  }
};
