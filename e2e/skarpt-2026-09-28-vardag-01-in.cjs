// Steg 1: logga in, gå igenom samtyckessteget (villkor+integritet), se onboarding.
module.exports = async (p, h) => {
  await h.shot('00-start');
  // Samtyckessteget (villkor + integritet) — DP1
  const villkor = p.getByRole('checkbox').first();
  const txt0 = await h.text();
  h.log('TEXT0', txt0.slice(0, 400));
  // Kryssa i alla checkboxar som finns på samtyckessteget
  const boxes = await p.getByRole('checkbox').all();
  h.log('ANTAL_CHECKBOXAR', boxes.length);
  for (const b of boxes) {
    await b.check({ force: true }).catch(() => {});
  }
  await h.shot('01-samtycke-ikryssat');
  const fortsattBtn = p.getByRole('button', { name: /Fortsätt|Godkänn|Spara/ }).first();
  await fortsattBtn.click({ timeout: 5000 }).catch((e) => h.log('KNAPP_FEL', e.message));
  await p.waitForTimeout(3000);
  await h.shot('02-efter-samtycke');

  // Onboarding-flödet — hoppa över om det visas
  const skipBtn = p.getByRole('button', { name: /Hoppa över|Skip|Stäng/ }).first();
  const harSkip = await skipBtn.isVisible().catch(() => false);
  h.log('ONBOARDING_SKIP_SYNLIG', harSkip);
  if (harSkip) {
    await h.shot('03-onboarding-visas');
    await skipBtn.click().catch(() => {});
    await p.waitForTimeout(1500);
  }
  await h.shot('04-efter-onboarding');

  await h.go('/oversikt');
  await h.shot('05-oversikt');
  await h.go('/min-vardag');
  await h.shot('06-min-vardag-hub');
};
