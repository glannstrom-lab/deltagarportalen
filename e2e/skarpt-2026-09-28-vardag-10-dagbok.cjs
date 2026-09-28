const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/diary');
  await stangOnboardingOmSynlig(p, h, 'diary');
  await h.shot('20-diary-start');
  h.log('START', (await h.text()).slice(0, 500));

  // Skriv första inlägget
  const nyKnapp = p.getByRole('button', { name: /Ny anteckning|Skriv ditt första inlägg/i }).first();
  if (await nyKnapp.isVisible().catch(() => false)) {
    await nyKnapp.click();
    await p.waitForTimeout(1500);
  }
  await stangOnboardingOmSynlig(p, h, 'ny-anteckning');
  await h.shot('21-nytt-inlagg-formular');
  h.log('FORMULAR', (await h.text()).slice(0, 500));

  const textarea = p.locator('textarea').first();
  const harTextarea = await textarea.isVisible().catch(() => false);
  h.log('TEXTAREA_SYNLIG', harTextarea);
  if (harTextarea) {
    await textarea.fill('Skarpt test 2026-09-28: provinlägg i dagboken. Det här ska gå att redigera och radera.');
  }
  await h.shot('22-text-ifylld');

  const sparaKnapp = p.getByRole('button', { name: /Spara/i }).first();
  if (await sparaKnapp.isVisible().catch(() => false)) {
    await sparaKnapp.click().catch((e) => h.log('SPARA_FEL', e.message));
    await p.waitForTimeout(2000);
  }
  await h.shot('23-efter-spara');
  h.log('EFTER_SPARA', (await h.text()).slice(0, 900));

  // Reload
  await h.go('/diary');
  await stangOnboardingOmSynlig(p, h, 'diary-reload');
  await h.shot('24-diary-reload');
  h.log('EFTER_RELOAD', (await h.text()).slice(0, 900));

  // Tacksamhet-flik
  const tacksamTab = p.getByRole('tab', { name: /Tacksamhet/i }).or(p.getByRole('button', { name: /Tacksamhet/i })).first();
  if (await tacksamTab.isVisible().catch(() => false)) {
    await tacksamTab.click().catch(() => {});
    await p.waitForTimeout(1500);
  }
  await h.shot('25-tacksamhet-flik');
  h.log('TACKSAMHET', (await h.text()).slice(0, 700));
};
