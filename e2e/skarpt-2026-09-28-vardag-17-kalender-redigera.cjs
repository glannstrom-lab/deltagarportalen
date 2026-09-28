const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/calendar');
  await stangOnboardingOmSynlig(p, h, 'calendar');
  await h.shot('90-calendar');

  // Öppna händelsen genom att klicka på den i kalendern
  const handelse = p.getByText('Skarpt test — provhändelse', { exact: false }).first();
  const synlig = await handelse.isVisible().catch(() => false);
  h.log('HANDELSE_SYNLIG', synlig);
  if (synlig) {
    await handelse.click().catch((e) => h.log('OPPNA_FEL', e.message));
    await p.waitForTimeout(1200);
  }
  await stangOnboardingOmSynlig(p, h, 'redigera-modal');
  await h.shot('91-redigera-modal');
  h.log('MODAL_TEXT', (await h.text()).slice(0, 500));

  // Ändra titeln
  const titelFalt = p.locator('#eventmodal-f1');
  if (await titelFalt.isVisible().catch(() => false)) {
    await titelFalt.fill('Skarpt test — REDIGERAD händelse');
  }
  const sparaBtn = p.getByRole('button', { name: /Spara ändringar|Spara/i }).first();
  if (await sparaBtn.isVisible().catch(() => false)) {
    await sparaBtn.click().catch((e) => h.log('SPARA_REDIGERING_FEL', e.message));
    await p.waitForTimeout(1500);
  }
  await h.shot('92-efter-redigering');
  h.log('EFTER_REDIGERING', (await h.text()).slice(0, 700));

  // Ta bort händelsen
  const handelse2 = p.getByText('REDIGERAD händelse', { exact: false }).first();
  if (await handelse2.isVisible().catch(() => false)) {
    await handelse2.click().catch((e) => h.log('OPPNA2_FEL', e.message));
    await p.waitForTimeout(1000);
  }
  const taBortBtn = p.getByRole('button', { name: /^Ta bort$/i }).first();
  if (await taBortBtn.isVisible().catch(() => false)) {
    await taBortBtn.click().catch((e) => h.log('TABORT_FEL', e.message));
    await p.waitForTimeout(1500);
  }
  await h.shot('93-efter-tabort');
  h.log('EFTER_TABORT', (await h.text()).slice(0, 700));

  await h.go('/calendar');
  await stangOnboardingOmSynlig(p, h, 'reload-efter-tabort');
  await h.shot('94-reload-slutgiltig');
  h.log('RELOAD_SLUTGILTIG', (await h.text()).slice(0, 700));
};
