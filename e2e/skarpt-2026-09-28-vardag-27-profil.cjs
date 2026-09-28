const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/profile');
  await stangOnboardingOmSynlig(p, h, 'profile');
  await h.shot('i0-profil-start');
  h.log('START', (await h.text()).slice(0, 700));

  // Fyll i efternamn på Översikt-fliken (eller motsvarande synligt fält)
  const efternamnFalt = p.locator('input').filter({ hasText: '' }).first();
  const allaInputs = await p.locator('input[type=text], input:not([type])').all();
  h.log('ANTAL_TEXTFALT', allaInputs.length);
  if (allaInputs.length > 1) {
    await allaInputs[1].fill('SkarptEfternamn').catch(() => {});
  }
  await h.shot('i1-ifyllt');

  const sparaBtn = p.getByRole('button', { name: /Spara/i }).first();
  if (await sparaBtn.isVisible().catch(() => false)) {
    await sparaBtn.click().catch((e) => h.log('SPARA_FEL', e.message));
    await p.waitForTimeout(1500);
  }
  await h.shot('i2-efter-spara');
  h.log('EFTER_SPARA', (await h.text()).slice(0, 500));

  await h.go('/profile');
  await stangOnboardingOmSynlig(p, h, 'reload');
  await h.shot('i3-reload');
  h.log('RELOAD', (await h.text()).slice(0, 500));

  // Gå igenom flikarna
  const flikNamn = ['Jobbsökning', 'Kompetens', 'Support', 'Inställningar'];
  for (const namn of flikNamn) {
    const flik = p.getByRole('button', { name: new RegExp(namn, 'i') }).first();
    if (await flik.isVisible().catch(() => false)) {
      await flik.click().catch(() => {});
      await p.waitForTimeout(1200);
      await stangOnboardingOmSynlig(p, h, `flik-${namn}`);
      await h.shot(`i4-flik-${namn}`);
      h.log(`FLIK_${namn}`, (await h.text()).slice(0, 400));
    } else {
      h.log(`FLIK_${namn}_SAKNAS`, true);
    }
  }
};
