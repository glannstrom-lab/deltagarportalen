const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/settings');
  await stangOnboardingOmSynlig(p, h, 'settings');
  const nav = p.getByRole('navigation', { name: /Avsnitt i inställningarna/i });
  const navSynlig = await nav.isVisible().catch(() => false);
  h.log('NAV_SYNLIG', navSynlig);

  async function gaTillFlik(namn) {
    const btn = nav.getByRole('button', { name: new RegExp(`^${namn}$`, 'i') }).first();
    await btn.click({ timeout: 8000 }).catch((e) => h.log('FLIK_FEL', namn, e.message.slice(0, 150)));
    await p.waitForTimeout(1000);
  }

  // Notifikationer
  await gaTillFlik('Notifikationer');
  await h.shot('o0-notifikationer');
  h.log('NOTIS_TEXT', (await h.text()).slice(0, 500));
  const vaxel = p.getByRole('switch').first();
  const foreState = await vaxel.getAttribute('aria-checked').catch(() => null);
  await vaxel.click({ timeout: 6000 }).catch((e) => h.log('VAXEL_FEL', e.message.slice(0, 150)));
  await p.waitForTimeout(1000);
  const efterState = await vaxel.getAttribute('aria-checked').catch(() => null);
  h.log('EPOST_VAXEL', foreState, '->', efterState);
  await h.shot('o1-efter-vaxel');

  await h.go('/settings');
  await stangOnboardingOmSynlig(p, h, 'reload');
  await gaTillFlik('Notifikationer');
  const efterReload = await p.getByRole('switch').first().getAttribute('aria-checked').catch(() => null);
  h.log('EPOST_VAXEL_EFTER_RELOAD', efterReload);

  // Säkerhet
  await gaTillFlik('Säkerhet');
  await h.shot('o2-sakerhet');
  h.log('SAKERHET_TEXT', (await h.text()).slice(0, 500));
  const uppdateraBtn = p.getByRole('button', { name: /Uppdatera lösenord/i }).first();
  const synlig = await uppdateraBtn.isVisible().catch(() => false);
  h.log('UPPDATERA_SYNLIG', synlig);
  if (synlig) {
    const falt = p.locator('input[type=password]');
    if (await falt.count() >= 3) {
      await falt.nth(0).fill('nuvarandeTest123!');
      await falt.nth(1).fill('nyttTestLosen456!');
      await falt.nth(2).fill('nyttTestLosen456!');
    }
    let anrop = [];
    const lyss = (req) => { if (/auth\/v1/i.test(req.url())) anrop.push(`${req.method()} ${req.url().slice(0,150)}`); };
    p.on('request', lyss);
    await uppdateraBtn.click({ timeout: 6000 }).catch((e) => h.log('UPPDATERA_FEL', e.message.slice(0,150)));
    await p.waitForTimeout(2000);
    p.off('request', lyss);
    h.log('NATVERK_VID_UPPDATERA', JSON.stringify(anrop));
  }
  await h.shot('o3-efter-uppdatera-forsok');

  // Integritet — samtyckeslista
  await gaTillFlik('Integritet');
  await h.shot('o4-integritet');
  h.log('INTEGRITET_TEXT', (await h.text()).slice(0, 1200));
};
