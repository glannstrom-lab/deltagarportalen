const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/settings');
  await stangOnboardingOmSynlig(p, h, 'settings');
  const nav = p.getByRole('navigation', { name: /Avsnitt i inställningarna/i });
  await nav.getByRole('button', { name: /^Integritet$/i }).first().click({ timeout: 8000 });
  await p.waitForTimeout(1200);
  await h.shot('q0-integritet-installningar');

  // Scrolla till radera-sektionen och klicka på "Begär radering"
  const begarBtn = p.getByRole('button', { name: /Begär radering|Radera mitt konto/i }).first();
  const harBegar = await begarBtn.isVisible().catch(() => false);
  h.log('BEGAR_KNAPP_SYNLIG', harBegar);
  await h.shot('q1-fore-begar-klick');
  if (harBegar) {
    await begarBtn.click({ timeout: 8000 }).catch((e) => h.log('BEGAR_FEL', e.message));
    await p.waitForTimeout(1200);
  }
  await h.shot('q2-bekraftelsedialog');
  h.log('DIALOG_TEXT', (await h.text()).slice(0, 700));

  // Bekräfta begäran (14-dagars grace) — detta ger status "väntande"
  const bekraftaBtn = p.getByRole('button', { name: /Bekräfta|Skicka begäran|Begär radering/i }).last();
  if (await bekraftaBtn.isVisible().catch(() => false)) {
    await bekraftaBtn.click({ timeout: 8000 }).catch((e) => h.log('BEKRAFTA_FEL', e.message));
    await p.waitForTimeout(1500);
  }
  await h.shot('q3-efter-begaran');
  h.log('EFTER_BEGARAN', (await h.text()).slice(0, 700));

  // Nu ska "Radera nu" (omedelbar radering) vara synlig
  const raderaNuBtn = p.getByRole('button', { name: /Radera nu/i }).first();
  const synligNu = await raderaNuBtn.isVisible().catch(() => false);
  h.log('RADERA_NU_SYNLIG', synligNu);
  if (synligNu) {
    await raderaNuBtn.click({ timeout: 8000 }).catch((e) => h.log('RADERA_NU_FEL', e.message));
    await p.waitForTimeout(1200);
  }
  await h.shot('q4-omedelbar-dialog');
  h.log('OMEDELBAR_DIALOG', (await h.text()).slice(0, 700));
};
