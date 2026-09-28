const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/settings');
  await stangOnboardingOmSynlig(p, h, 'settings');
  await h.shot('g0-settings');
  // Gå till Tillgänglighet-fliken om den inte redan är vald
  const tillgBtn = p.getByRole('button', { name: /Tillgänglighet/i }).first();
  if (await tillgBtn.isVisible().catch(() => false)) {
    await tillgBtn.click().catch(() => {});
    await p.waitForTimeout(800);
  }
  await h.shot('g1-tillganglighet-flik');
  h.log('TILLG', (await h.text()).slice(0, 800));

  const fokusVaxel = p.getByRole('switch', { name: /Fokusläge/i }).first();
  if (await fokusVaxel.isVisible().catch(() => false)) {
    const state = await fokusVaxel.getAttribute('aria-checked');
    h.log('FOKUS_STATE', state);
    if (state === 'true') {
      await fokusVaxel.click();
      await p.waitForTimeout(1000);
    }
  }
  await h.shot('g2-fokus-avstangd');
  h.log('EFTER_AV', (await h.text()).slice(0, 600));
};
