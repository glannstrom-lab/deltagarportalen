const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/settings');
  await stangOnboardingOmSynlig(p, h, 'settings');
  const tillgBtn = p.getByRole('button', { name: /Tillgänglighet/i }).first();
  if (await tillgBtn.isVisible().catch(() => false)) { await tillgBtn.click(); await p.waitForTimeout(800); }

  const sprakSelect = p.locator('select').first();
  const synlig = await sprakSelect.isVisible().catch(() => false);
  h.log('SELECT_SYNLIG', synlig);
  if (synlig) {
    const optioner = await sprakSelect.locator('option').allTextContents();
    h.log('OPTIONER', JSON.stringify(optioner));
    await sprakSelect.selectOption({ label: 'Lätt svenska' }).catch(async () => {
      // Om exakt label inte matchar, testa via value-gissning
      const vals = await sprakSelect.locator('option').evaluateAll(opts => opts.map(o => o.value));
      h.log('VALUES', JSON.stringify(vals));
    });
    await p.waitForTimeout(1500);
  }
  await h.shot('k0-efter-latt-svenska-select');
  h.log('EFTER_LATT', (await h.text()).slice(0, 400));

  await h.go('/oversikt');
  await stangOnboardingOmSynlig(p, h, 'oversikt-latt');
  await h.shot('k1-oversikt-latt-svenska');
  h.log('OVERSIKT_LATT', (await h.text()).slice(0, 300));

  // English
  await h.go('/settings');
  await stangOnboardingOmSynlig(p, h, 'settings-en');
  const tillgBtn2 = p.getByRole('button', { name: /Tillgänglighet|Accessibility/i }).first();
  if (await tillgBtn2.isVisible().catch(() => false)) { await tillgBtn2.click(); await p.waitForTimeout(800); }
  const sprakSelect2 = p.locator('select').first();
  if (await sprakSelect2.isVisible().catch(() => false)) {
    await sprakSelect2.selectOption({ label: 'English' }).catch((e) => h.log('EN_SELECT_FEL', e.message));
    await p.waitForTimeout(1500);
  }
  await h.shot('k2-english-select');
  h.log('EFTER_EN_TEXT', (await h.text()).slice(0, 400));

  await h.go('/oversikt');
  await stangOnboardingOmSynlig(p, h, 'oversikt-en');
  await h.shot('k3-oversikt-en');
  h.log('OVERSIKT_EN', (await h.text()).slice(0, 300));

  // Tillbaka till svenska
  await h.go('/settings');
  await stangOnboardingOmSynlig(p, h, 'settings-sv-tillbaka');
  const tillgBtn3 = p.getByRole('button', { name: /Accessibility|Tillgänglighet/i }).first();
  if (await tillgBtn3.isVisible().catch(() => false)) { await tillgBtn3.click(); await p.waitForTimeout(800); }
  const sprakSelect3 = p.locator('select').first();
  if (await sprakSelect3.isVisible().catch(() => false)) {
    await sprakSelect3.selectOption({ label: 'Swedish' }).catch(async () => {
      await sprakSelect3.selectOption({ label: 'Svenska' }).catch((e) => h.log('SV_TILLBAKA_FEL', e.message));
    });
    await p.waitForTimeout(1200);
  }
  await h.shot('k4-tillbaka-svenska');
};
