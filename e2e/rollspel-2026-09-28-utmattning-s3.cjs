// Amina loggar en tuff dag: humör "Tufft", energi om det finns, reflektion.
module.exports = async (p, h) => {
  await h.go('/wellness');
  await p.waitForTimeout(9000); // spinnern behöver ibland flera sekunder
  await h.shot('07-halsa-redo');

  const tufft = p.getByText('Tufft', { exact: true });
  if (await tufft.count()) {
    const t0 = Date.now();
    await tufft.click();
    await p.waitForTimeout(1500);
    h.log('Klick på Tufft tog', Date.now() - t0, 'ms att svara visuellt');
    await h.shot('08-humor-tufft-vald');
  } else {
    h.log('HITTADE INTE "Tufft"');
  }

  // Finns energiloggning?
  const energiText = await p.locator('main').innerText().catch(() => '');
  h.log('INNEHALLER ENERGI?', /energi/i.test(energiText));
  await h.shot('09-efter-humor', true);

  // Reflektion
  const reflektionFalt = p.locator('textarea').first();
  if (await reflektionFalt.count()) {
    await reflektionFalt.click();
    await reflektionFalt.type('Orkar inte mycket idag. Låg energi.');
    await h.shot('10-reflektion-skriven');
    const sparaBtn = p.getByRole('button', { name: /Spara reflektion/i });
    if (await sparaBtn.count()) {
      await sparaBtn.click();
      await p.waitForTimeout(2000);
      await h.shot('11-efter-spara-reflektion');
      const efterText = await p.locator('main').innerText().catch(() => '');
      h.log('EFTER SPARA:', efterText.slice(0, 1500));
    }
  } else {
    h.log('INGET TEXTFALT FOR REFLEKTION HITTADES');
  }
};
