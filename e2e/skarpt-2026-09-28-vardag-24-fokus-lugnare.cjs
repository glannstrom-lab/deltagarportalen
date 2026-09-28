const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/oversikt');
  await stangOnboardingOmSynlig(p, h, 'oversikt');

  // Öppna "Lugnare läge"-panelen
  const panel = p.getByRole('button', { name: /Lugnare läge/i }).first();
  if (await panel.isVisible().catch(() => false)) {
    await panel.click().catch((e) => h.log('PANEL_FEL', e.message));
    await p.waitForTimeout(1000);
  }
  await h.shot('f0-lugnare-panel-oppen');
  h.log('PANEL', (await h.text()).slice(0, 900));

  // Slå på Fokusläge-växeln
  const fokusVaxel = p.getByRole('switch').first();
  const antalVaxlar = await p.getByRole('switch').count();
  h.log('ANTAL_VAXLAR', antalVaxlar);
  if (await fokusVaxel.isVisible().catch(() => false)) {
    const foreState = await fokusVaxel.getAttribute('aria-checked');
    h.log('FOKUS_FORE', foreState);
    await fokusVaxel.click().catch((e) => h.log('FOKUS_KLICK_FEL', e.message));
    await p.waitForTimeout(1500);
  }
  await h.shot('f1-efter-fokus-pa');
  h.log('EFTER_FOKUS_PA', (await h.text()).slice(0, 900));

  // Ladda om — kvar?
  await h.go('/oversikt');
  await stangOnboardingOmSynlig(p, h, 'reload');
  await h.shot('f2-reload');
  h.log('RELOAD_TEXT', (await h.text()).slice(0, 600));

  // Slå av fokusläge igen (så resten av testet inte körs i fokusläge)
  const panel2 = p.getByRole('button', { name: /Lugnare läge/i }).first();
  if (await panel2.isVisible().catch(() => false)) {
    await panel2.click().catch(() => {});
    await p.waitForTimeout(800);
  }
  const fokusVaxel2 = p.getByRole('switch').first();
  if (await fokusVaxel2.isVisible().catch(() => false)) {
    const state = await fokusVaxel2.getAttribute('aria-checked');
    h.log('FOKUS_STATE_INNAN_AVSTANGNING', state);
    if (state === 'true') {
      await fokusVaxel2.click().catch(() => {});
      await p.waitForTimeout(1000);
    }
  }
  await h.shot('f3-fokus-avstangd-igen');
};
