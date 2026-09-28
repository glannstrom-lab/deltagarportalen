const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/settings');
  await stangOnboardingOmSynlig(p, h, 'settings');
  const tillgBtn = p.getByRole('button', { name: /^Tillgänglighet$/i }).first();
  if (await tillgBtn.isVisible().catch(() => false)) { await tillgBtn.click(); await p.waitForTimeout(800); }
  await h.shot('j0-tillganglighet');

  // Språk: Lätt svenska
  const lattBtn = p.getByRole('button', { name: /^Lätt svenska$/i }).or(p.getByText('Lätt svenska', { exact: true })).first();
  if (await lattBtn.isVisible().catch(() => false)) {
    await lattBtn.click().catch((e) => h.log('LATT_FEL', e.message));
    await p.waitForTimeout(1500);
  }
  await h.shot('j1-latt-svenska');
  h.log('EFTER_LATT', (await h.text()).slice(0, 400));

  // Reload - kvar?
  await h.go('/settings');
  await stangOnboardingOmSynlig(p, h, 'reload-sprak');
  await h.shot('j2-reload-sprak');
  h.log('RELOAD_SPRAK', (await h.text()).slice(0, 300));

  // Byt till English
  const tillgBtn2 = p.getByRole('button', { name: /Tillgänglighet|Accessibility/i }).first();
  if (await tillgBtn2.isVisible().catch(() => false)) { await tillgBtn2.click(); await p.waitForTimeout(800); }
  const enBtn = p.getByRole('button', { name: /^English$/i }).first();
  if (await enBtn.isVisible().catch(() => false)) {
    await enBtn.click().catch((e) => h.log('EN_FEL', e.message));
    await p.waitForTimeout(1500);
  }
  await h.shot('j3-english');
  h.log('EFTER_EN', (await h.text()).slice(0, 400));

  // Tillbaka till svenska
  const tillgBtn3 = p.getByRole('button', { name: /Accessibility|Tillgänglighet/i }).first();
  if (await tillgBtn3.isVisible().catch(() => false)) { await tillgBtn3.click(); await p.waitForTimeout(800); }
  const svBtn = p.getByRole('button', { name: /^Swedish$|^Svenska$/i }).first();
  if (await svBtn.isVisible().catch(() => false)) {
    await svBtn.click().catch((e) => h.log('SV_FEL', e.message));
    await p.waitForTimeout(1500);
  }
  await h.shot('j4-tillbaka-svenska');

  // Större text
  const storTextVaxel = p.getByRole('switch', { name: /Större text/i }).first();
  if (await storTextVaxel.isVisible().catch(() => false)) {
    await storTextVaxel.click().catch((e) => h.log('STORTEXT_FEL', e.message));
    await p.waitForTimeout(1000);
  }
  await h.shot('j5-storre-text-pa');
  h.log('EFTER_STORTEXT', (await h.text()).slice(0, 200));
  // Slå av igen
  if (await storTextVaxel.isVisible().catch(() => false)) {
    await storTextVaxel.click().catch(() => {});
    await p.waitForTimeout(800);
  }

  // Tema
  const utseendeBtn = p.getByRole('button', { name: /^Utseende$/i }).first();
  if (await utseendeBtn.isVisible().catch(() => false)) { await utseendeBtn.click(); await p.waitForTimeout(800); }
  await h.shot('j6-utseende');
  const morkBtn = p.getByRole('button', { name: /Mörkt/i }).first();
  if (await morkBtn.isVisible().catch(() => false)) {
    await morkBtn.click().catch((e) => h.log('MORK_FEL', e.message));
    await p.waitForTimeout(1200);
  }
  await h.shot('j7-morkt-tema');
  // Reload - kvar mörkt tema?
  await h.go('/settings');
  await stangOnboardingOmSynlig(p, h, 'reload-tema');
  await h.shot('j8-reload-tema');
  // Tillbaka till ljust
  const utseendeBtn2 = p.getByRole('button', { name: /^Utseende$/i }).first();
  if (await utseendeBtn2.isVisible().catch(() => false)) { await utseendeBtn2.click(); await p.waitForTimeout(800); }
  const ljustBtn = p.getByRole('button', { name: /Ljust/i }).first();
  if (await ljustBtn.isVisible().catch(() => false)) { await ljustBtn.click(); await p.waitForTimeout(1000); }

  // Notifikationer
  const notisBtn = p.getByRole('button', { name: /^Notifikationer$/i }).first();
  if (await notisBtn.isVisible().catch(() => false)) { await notisBtn.click(); await p.waitForTimeout(800); }
  await h.shot('j9-notifikationer');
  h.log('NOTIS', (await h.text()).slice(0, 500));
  const emailVaxel = p.getByRole('switch').first();
  if (await emailVaxel.isVisible().catch(() => false)) {
    const fore = await emailVaxel.getAttribute('aria-checked');
    await emailVaxel.click().catch((e) => h.log('EMAIL_VAXEL_FEL', e.message));
    await p.waitForTimeout(1000);
    const efter = await emailVaxel.getAttribute('aria-checked');
    h.log('EMAIL_VAXEL', fore, '->', efter);
  }
  await h.shot('j10-efter-notis-vaxling');

  // Säkerhet — password-formuläret
  const sakerhetBtn = p.getByRole('button', { name: /^Säkerhet$/i }).first();
  if (await sakerhetBtn.isVisible().catch(() => false)) { await sakerhetBtn.click(); await p.waitForTimeout(800); }
  await h.shot('j11-sakerhet');
  h.log('SAKERHET', (await h.text()).slice(0, 500));
};
