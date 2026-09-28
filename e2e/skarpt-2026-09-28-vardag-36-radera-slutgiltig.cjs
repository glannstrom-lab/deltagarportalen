const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/settings');
  await stangOnboardingOmSynlig(p, h, 'settings');
  const nav = p.getByRole('navigation', { name: /Avsnitt i inställningarna/i });
  await nav.getByRole('button', { name: /^Integritet$/i }).first().click({ timeout: 8000 });
  await p.waitForTimeout(1200);

  const raderaNuBtn = p.getByRole('button', { name: /Radera nu/i }).first();
  if (await raderaNuBtn.isVisible().catch(() => false)) {
    await raderaNuBtn.click({ timeout: 8000 }).catch((e) => h.log('RADERA_NU_FEL', e.message));
    await p.waitForTimeout(1000);
  }
  await h.shot('r0-dialog-oppen');

  const bekraftaInput = p.locator('#deleteaccountsection-f2');
  const synlig = await bekraftaInput.isVisible().catch(() => false);
  h.log('INPUT_SYNLIG', synlig);
  if (synlig) {
    await bekraftaInput.fill('RADERA');
    await p.waitForTimeout(500);
  }
  await h.shot('r1-ord-ifyllt');

  const slutgiltigBtn = p.getByRole('button', { name: /Radera för alltid/i }).first();
  const btnSynlig = await slutgiltigBtn.isVisible().catch(() => false);
  const btnEnabled = await slutgiltigBtn.isEnabled().catch(() => false);
  h.log('SLUTGILTIG_KNAPP', btnSynlig, btnEnabled);
  await h.shot('r2-fore-slutklick');

  if (btnSynlig && btnEnabled) {
    await slutgiltigBtn.click({ timeout: 10000 }).catch((e) => h.log('SLUTKLICK_FEL', e.message));
    await p.waitForTimeout(4000);
  }
  await h.shot('r3-efter-radering');
  h.log('URL_EFTER', p.url());
  h.log('TEXT_EFTER', (await h.text()).slice(0, 500));
};
