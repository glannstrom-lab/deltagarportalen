// Steg 2: Mående — samtycke, logga mående, se historik.
async function stangOnboarding(p, h, var_) {
  const dialog = p.getByRole('dialog');
  const synlig = await dialog.isVisible().catch(() => false);
  if (synlig) {
    h.log('ONBOARDING_DYKER_UPP_IGEN', var_, p.url());
    await dialog.getByRole('button', { name: /Hoppa över/ }).click({ force: true, timeout: 5000 }).catch((e) => h.log('SKIP_FEL', e.message));
    await p.waitForTimeout(1200);
  }
}

module.exports = async (p, h) => {
  await h.go('/wellness');
  await stangOnboarding(p, h, 'wellness-start');
  await h.shot('10-wellness');
  const txt = await h.text();
  h.log('WELLNESS_TEXT', txt.slice(0, 600));

  const consentBtn = p.getByRole('button', { name: /Jag samtycker/i }).first();
  const harConsentGate = await consentBtn.isVisible().catch(() => false);
  h.log('CONSENT_GATE_SYNLIG', harConsentGate);
  if (harConsentGate) {
    await stangOnboarding(p, h, 'fore-consent-klick');
    await consentBtn.click({ timeout: 8000 }).catch((e) => h.log('CONSENT_KLICK_FEL', e.message));
    await p.waitForTimeout(2500);
  }
  await stangOnboarding(p, h, 'efter-consent');
  await h.shot('11-wellness-efter-samtycke');

  const moodBtn = p.getByText('🙂').first();
  const harMood = await moodBtn.isVisible().catch(() => false);
  h.log('MOOD_KNAPP_SYNLIG', harMood);
  if (harMood) {
    await moodBtn.click().catch((e) => h.log('MOOD_KLICK_FEL', e.message));
    await p.waitForTimeout(2000);
  }
  await stangOnboarding(p, h, 'efter-mood-klick');
  await h.shot('12-efter-mood-klick');
  const txt2 = await h.text();
  h.log('EFTER_MOOD_TEXT', txt2.slice(0, 800));

  await h.go('/wellness');
  await stangOnboarding(p, h, 'reload');
  await h.shot('13-wellness-efter-reload');
  const txt3 = await h.text();
  h.log('EFTER_RELOAD_TEXT', txt3.slice(0, 800));
};
