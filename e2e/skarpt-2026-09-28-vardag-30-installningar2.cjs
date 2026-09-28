const { stangOnboardingOmSynlig, klickaSakert } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/settings');
  await stangOnboardingOmSynlig(p, h, 'settings');

  // Notifikationer
  const notisBtn = p.getByRole('button', { name: /^Notifikationer$/i }).first();
  await klickaSakert(p, h, notisBtn, 'flik-notifikationer');
  await h.shot('l0-notifikationer');
  h.log('NOTIS', (await h.text()).slice(0, 600));

  const vaxlar = p.getByRole('switch');
  const antalVaxlar = await vaxlar.count();
  h.log('ANTAL_VAXLAR_NOTIS', antalVaxlar);
  if (antalVaxlar > 0) {
    const fore = await vaxlar.first().getAttribute('aria-checked');
    await klickaSakert(p, h, vaxlar.first(), 'epost-vaxel');
    await p.waitForTimeout(800);
    const efter = await vaxlar.first().getAttribute('aria-checked');
    h.log('EPOST_VAXEL', fore, '->', efter);
  }
  await h.shot('l1-efter-epost-vaxel');

  // Ladda om — kvar?
  await h.go('/settings');
  await stangOnboardingOmSynlig(p, h, 'reload-notis');
  const notisBtn2 = p.getByRole('button', { name: /^Notifikationer$/i }).first();
  await klickaSakert(p, h, notisBtn2, 'flik-notis-igen');
  const efterReload = await p.getByRole('switch').first().getAttribute('aria-checked').catch(() => null);
  h.log('EPOST_VAXEL_EFTER_RELOAD', efterReload);
  await h.shot('l2-notis-efter-reload');

  // Säkerhet — "Byt lösenord"
  const sakerhetBtn = p.getByRole('button', { name: /^Säkerhet$/i }).first();
  await klickaSakert(p, h, sakerhetBtn, 'flik-sakerhet');
  await h.shot('l3-sakerhet');
  h.log('SAKERHET', (await h.text()).slice(0, 500));

  const uppdateraBtn = p.getByRole('button', { name: /Uppdatera lösenord|Byt lösenord/i }).first();
  const synlig = await uppdateraBtn.isVisible().catch(() => false);
  h.log('UPPDATERA_KNAPP_SYNLIG', synlig);
  if (synlig) {
    // Fyll i fälten och klicka — förväntar oss att INGET händer (BP6)
    const falt = p.locator('input[type=password]');
    const antal = await falt.count();
    h.log('ANTAL_LOSENORDSFALT', antal);
    if (antal >= 3) {
      await falt.nth(0).fill('nuvarandeTest123!');
      await falt.nth(1).fill('nyttTestLosen456!');
      await falt.nth(2).fill('nyttTestLosen456!');
    }
    await h.shot('l4-losenordsfalt-ifyllda');

    let natverksanrop = [];
    const lyssnare = (req) => { if (/auth\/v1|password/i.test(req.url())) natverksanrop.push(`${req.method()} ${req.url().slice(0,150)}`); };
    p.on('request', lyssnare);
    await uppdateraBtn.click({ timeout: 8000 }).catch((e) => h.log('UPPDATERA_KLICK_FEL', e.message));
    await p.waitForTimeout(2500);
    p.off('request', lyssnare);
    h.log('NATVERKSANROP_VID_LOSENORDSBYTE', JSON.stringify(natverksanrop));
    await h.shot('l5-efter-uppdatera-klick');
    h.log('EFTER_UPPDATERA', (await h.text()).slice(0, 400));
  }
};
