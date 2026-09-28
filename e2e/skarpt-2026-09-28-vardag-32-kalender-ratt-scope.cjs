const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/calendar');
  await stangOnboardingOmSynlig(p, h, 'calendar');
  const dagBtn = p.getByRole('button', { name: /^Dag$/i }).first();
  if (await dagBtn.isVisible().catch(() => false)) { await dagBtn.click(); await p.waitForTimeout(1000); }

  // Hur många knappar med "Skarpt test" finns totalt, och vilka klasser har de?
  const alla = p.getByRole('button', { name: /Skarpt test/i });
  const n = await alla.count();
  h.log('TOTALT_ANTAL_MATCHANDE_KNAPPAR', n);
  for (let i = 0; i < n; i++) {
    const cls = await alla.nth(i).evaluate(el => el.className).catch(() => '?');
    const box = await alla.nth(i).boundingBox().catch(() => null);
    h.log(`KNAPP_${i}`, cls.slice(0, 80), JSON.stringify(box));
  }

  // Välj specifikt den knapp som har klassen "h-28" INTE (månadsvyns cell) —
  // dvs den SISTA (dagvyns kort ligger sist i DOM given { view === 'day' })
  const dagvyKnapp = alla.last();
  await dagvyKnapp.scrollIntoViewIfNeeded().catch(() => {});
  await p.waitForTimeout(400);
  const box2 = await dagvyKnapp.boundingBox();
  h.log('DAGVY_KNAPP_BOX', JSON.stringify(box2));
  await dagvyKnapp.click({ timeout: 8000 }).catch((e) => h.log('KLICK_FEL', e.message.slice(0, 200)));
  await p.waitForTimeout(1200);
  const modalOppen = await p.locator('#eventmodal-f1').isVisible().catch(() => false);
  h.log('MODAL_OPPEN', modalOppen);
  await h.shot('n0-resultat');
};
