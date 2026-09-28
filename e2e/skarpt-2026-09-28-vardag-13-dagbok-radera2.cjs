const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/diary');
  await stangOnboardingOmSynlig(p, h, 'diary');
  const raderaBtn = p.getByRole('button', { name: /Radera dagboksinlägget/i }).first();
  await raderaBtn.scrollIntoViewIfNeeded().catch(() => {});
  await p.waitForTimeout(500);
  await h.shot('50-fore-klick');
  await raderaBtn.click({ timeout: 8000, force: true });
  await p.waitForTimeout(1000);
  await h.shot('51-direkt-efter-klick');
  h.log('TEXT_DIREKT_EFTER', (await h.text()).slice(0, 400));

  // Om en bekräftelseknapp nu syns nära "Radera" — lista ALLA synliga knappar
  const knappar = await p.getByRole('button').all();
  const namn = [];
  for (const k of knappar) {
    if (await k.isVisible().catch(() => false)) {
      namn.push(await k.innerText().catch(() => '?'));
    }
  }
  h.log('SYNLIGA_KNAPPAR', JSON.stringify(namn.filter(n => n.trim()).slice(0, 40)));
};
