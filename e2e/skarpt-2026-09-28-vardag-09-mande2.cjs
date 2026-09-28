const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/wellness');
  await stangOnboardingOmSynlig(p, h, 'wellness');
  await h.shot('14-wellness-nu');
  h.log('TXT', (await h.text()).slice(0, 700));

  // Logga mående — humörknapp
  const moodBtn = p.getByText('🙂').first();
  if (await moodBtn.isVisible().catch(() => false)) {
    await moodBtn.click();
    await p.waitForTimeout(1500);
  }
  await stangOnboardingOmSynlig(p, h, 'efter-mood');
  await h.shot('15-efter-mood');
  h.log('EFTER_MOOD', (await h.text()).slice(0, 900));

  // Notering + spara om ett fält finns
  const anteckningFalt = p.locator('textarea').first();
  if (await anteckningFalt.isVisible().catch(() => false)) {
    await anteckningFalt.fill('Skarpt test 2026-09-28 — provanteckning.');
    await h.shot('16-anteckning-ifylld');
    const sparaBtn = p.getByRole('button', { name: /Spara|Logga/i }).first();
    if (await sparaBtn.isVisible().catch(() => false)) {
      await sparaBtn.click().catch((e) => h.log('SPARA_FEL', e.message));
      await p.waitForTimeout(1500);
    }
  }
  await h.shot('17-efter-spara');
  h.log('EFTER_SPARA', (await h.text()).slice(0, 900));

  // Reload — finns kvar?
  await h.go('/wellness');
  await stangOnboardingOmSynlig(p, h, 'reload2');
  await h.shot('18-reload');
  h.log('EFTER_RELOAD2', (await h.text()).slice(0, 900));
};
