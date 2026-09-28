const { stangOnboardingOmSynlig, klickaSakert } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  // --- MÅENDE: samtycke + logga ---
  await h.go('/wellness');
  await stangOnboardingOmSynlig(p, h, 'wellness');
  await h.shot('10-wellness');

  const consentBtn = p.getByRole('button', { name: /^Jag samtycker$/i }).first();
  const harConsentGate = await consentBtn.isVisible().catch(() => false);
  h.log('CONSENT_GATE_SYNLIG', harConsentGate);
  if (harConsentGate) {
    await klickaSakert(p, h, consentBtn, 'wellness-samtycke');
    await p.waitForTimeout(2000);
  }
  await h.shot('11-efter-samtycke');
  h.log('EFTER_SAMTYCKE_TEXT', (await h.text()).slice(0, 500));

  const moodBtn = p.getByText('🙂').first();
  const harMood = await moodBtn.isVisible().catch(() => false);
  h.log('MOOD_KNAPP_SYNLIG', harMood);
  if (harMood) {
    await klickaSakert(p, h, moodBtn, 'mood-knapp');
    await p.waitForTimeout(2000);
  }
  await h.shot('12-efter-mood');
  h.log('EFTER_MOOD_TEXT', (await h.text()).slice(0, 900));

  await h.go('/wellness');
  await stangOnboardingOmSynlig(p, h, 'wellness-reload');
  await h.shot('13-efter-reload');
  h.log('EFTER_RELOAD_TEXT', (await h.text()).slice(0, 900));

  // --- DAGBOK: skriv, redigera, radera, tacksamhet ---
  await h.go('/diary');
  await stangOnboardingOmSynlig(p, h, 'diary');
  await h.shot('20-diary');
  h.log('DIARY_TEXT', (await h.text()).slice(0, 700));
};
