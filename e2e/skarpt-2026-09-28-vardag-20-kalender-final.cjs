const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/calendar');
  await stangOnboardingOmSynlig(p, h, 'calendar');
  const dagBtn = p.getByRole('button', { name: /^Dag$/i }).first();
  if (await dagBtn.isVisible().catch(() => false)) { await dagBtn.click(); await p.waitForTimeout(1000); }

  const evBtn = p.getByRole('button', { name: /Skarpt test/i });
  const antal = await evBtn.count();
  h.log('EVBTN_ANTAL', antal);
  for (let i = 0; i < antal; i++) {
    const box = await evBtn.nth(i).boundingBox().catch(() => null);
    h.log('BOX', i, JSON.stringify(box));
  }
  await evBtn.first().click({ timeout: 8000 });
  await p.waitForTimeout(1200);
  await stangOnboardingOmSynlig(p, h, 'efter-klick');
  await h.shot('b0-efter-klick-ratt-knapp');
  const titelFalt = p.locator('#eventmodal-f1');
  h.log('MODAL_OPPEN', await titelFalt.isVisible().catch(() => false));

  if (await titelFalt.isVisible().catch(() => false)) {
    await titelFalt.fill('Skarpt test — REDIGERAD händelse');
    await p.getByRole('button', { name: /Spara/i }).first().click();
    await p.waitForTimeout(1500);
    await h.shot('b1-efter-spara-redigering');
    h.log('EFTER_SPARA', (await h.text()).slice(0, 400));

    // Öppna igen och ta bort
    const evBtn2 = p.getByRole('button', { name: /REDIGERAD händelse/i }).first();
    await evBtn2.click({ timeout: 8000 }).catch((e) => h.log('OPPNA2_FEL', e.message));
    await p.waitForTimeout(1000);
    const taBortBtn = p.getByRole('button', { name: /^Ta bort$/i }).first();
    const synlig = await taBortBtn.isVisible().catch(() => false);
    h.log('TABORT_SYNLIG', synlig);
    if (synlig) {
      await taBortBtn.click();
      await p.waitForTimeout(1500);
    }
    await h.shot('b2-efter-tabort');
    h.log('EFTER_TABORT', (await h.text()).slice(0, 400));
  }

  await h.go('/calendar');
  await stangOnboardingOmSynlig(p, h, 'slutlig-reload');
  const dagBtn2 = p.getByRole('button', { name: /^Dag$/i }).first();
  if (await dagBtn2.isVisible().catch(() => false)) { await dagBtn2.click(); await p.waitForTimeout(1000); }
  await h.shot('b3-slutlig-reload');
  h.log('SLUTLIG_RELOAD', (await h.text()).slice(0, 500));
};
