const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/settings');
  await stangOnboardingOmSynlig(p, h, 'settings');
  const helaSidan = p.getByRole('button', { name: /Visa hela sidan i stället/i }).first();
  if (await helaSidan.isVisible().catch(() => false)) {
    await helaSidan.click();
    await p.waitForTimeout(1200);
  }
  await h.shot('h0-hela-sidan');
  h.log('TEXT', (await h.text()).slice(0, 600));

  const tillgBtn = p.getByRole('button', { name: /^Tillgänglighet$/i }).first();
  if (await tillgBtn.isVisible().catch(() => false)) {
    await tillgBtn.click();
    await p.waitForTimeout(800);
  }
  await h.shot('h1-tillganglighet');
  const fokusVaxel = p.getByRole('switch', { name: /Fokusläge/i }).first();
  const state = await fokusVaxel.getAttribute('aria-checked').catch(() => null);
  h.log('FOKUS_STATE', state);
  if (state === 'true') {
    await fokusVaxel.click();
    await p.waitForTimeout(1000);
  }
  await h.shot('h2-fokus-avstangd');
  h.log('EFTER', (await h.text()).slice(0, 600));

  await h.go('/oversikt');
  await stangOnboardingOmSynlig(p, h, 'oversikt-kontroll');
  await h.shot('h3-oversikt-kontroll');
  h.log('OVERSIKT_NU', (await h.text()).slice(0, 300));
};
