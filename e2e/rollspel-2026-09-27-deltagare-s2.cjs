const path = require('path');
module.exports = async (p, h) => {
  await h.go('/min-vecka');
  // närvarointyg
  const dl = p.waitForEvent('download', { timeout: 20000 }).catch((e) => null);
  await p.getByRole('button', { name: /Ladda ner närvarointyg/ }).click();
  const d = await dl;
  if (d) { const f = path.join(h.UT, 'anna-narvarointyg.pdf'); await d.saveAs(f); h.log('PDF', d.suggestedFilename()); }
  else { await p.waitForTimeout(3000); await h.shot('03-intyg-efter-klick', false); }
  // Jag är här
  await p.getByRole('button', { name: /^Jag är här$/ }).click();
  await p.waitForTimeout(2500);
  const idag = p.locator('section').filter({ hasText: /I dag/i }).last();
  await idag.scrollIntoViewIfNeeded();
  await h.shot('04-incheckad', false);
  // Nästa vecka
  await p.getByRole('button', { name: /Nästa vecka/ }).click();
  await p.waitForTimeout(3000);
  console.log((await h.shot('05-nasta-vecka')).split('Nästa vecka').slice(-1)[0].slice(0, 3000));
};
