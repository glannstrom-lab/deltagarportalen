const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/calendar');
  await stangOnboardingOmSynlig(p, h, 'calendar');
  // Byt till dagvy direkt
  const dagBtn = p.getByRole('button', { name: /^Dag$/i }).first();
  if (await dagBtn.isVisible().catch(() => false)) {
    await dagBtn.click();
    await p.waitForTimeout(1000);
  }
  await h.shot('a0-dagvy');

  const alla = await p.getByText('Skarpt test — provhändelse').all();
  h.log('ANTAL_TRAFFAR', alla.length);
  // Klicka på den SISTA träffen (den i schemat, inte ev. chip)
  const mal = alla[alla.length - 1];
  await mal.click({ timeout: 8000 }).catch((e) => h.log('KLICK_FEL', e.message));
  await p.waitForTimeout(1200);
  await stangOnboardingOmSynlig(p, h, 'efter-klick-dagvy');
  await h.shot('a1-efter-klick');
  h.log('EFTER_KLICK', (await h.text()).slice(0, 500));

  const titelFalt = p.locator('#eventmodal-f1');
  const modalOppen = await titelFalt.isVisible().catch(() => false);
  h.log('MODAL_OPPEN', modalOppen);
  if (modalOppen) {
    await titelFalt.fill('Skarpt test — REDIGERAD händelse');
    const sparaBtn = p.getByRole('button', { name: /Spara/i }).first();
    await sparaBtn.click().catch((e) => h.log('SPARA_FEL', e.message));
    await p.waitForTimeout(1500);
  }
  await h.shot('a2-efter-spara-redigering');
  h.log('EFTER_SPARA', (await h.text()).slice(0, 600));

  // Öppna igen och ta bort
  const alla2 = await p.getByText('REDIGERAD händelse').all();
  h.log('ANTAL_TRAFFAR_2', alla2.length);
  if (alla2.length) {
    await alla2[alla2.length - 1].click({ timeout: 8000 }).catch((e) => h.log('KLICK2_FEL', e.message));
    await p.waitForTimeout(1000);
  }
  const taBortBtn = p.getByRole('button', { name: /^Ta bort$/i }).first();
  const taBortSynlig = await taBortBtn.isVisible().catch(() => false);
  h.log('TABORT_SYNLIG', taBortSynlig);
  if (taBortSynlig) {
    await taBortBtn.click().catch((e) => h.log('TABORT_FEL', e.message));
    await p.waitForTimeout(1500);
  }
  await h.shot('a3-efter-tabort');
  h.log('EFTER_TABORT', (await h.text()).slice(0, 600));

  await h.go('/calendar');
  await stangOnboardingOmSynlig(p, h, 'reload-slut');
  await h.shot('a4-reload-slut');
  h.log('RELOAD_SLUT', (await h.text()).slice(0, 600));
};
