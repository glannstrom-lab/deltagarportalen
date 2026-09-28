const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/diary');
  await stangOnboardingOmSynlig(p, h, 'diary');
  await h.shot('40-diary-lista');

  // Klicka direkt på raderaikonen på KORTET (öppna inte läsvyn)
  const raderaBtn = p.getByRole('button', { name: /Radera dagboksinlägget/i }).first();
  const synlig = await raderaBtn.isVisible().catch(() => false);
  h.log('RADERA_IKON_SYNLIG_UTAN_MODAL', synlig);
  await raderaBtn.scrollIntoViewIfNeeded().catch(() => {});
  await h.shot('41-fore-radera-klick');
  if (synlig) {
    await raderaBtn.click({ timeout: 8000 }).catch((e) => h.log('RADERA_KLICK_FEL', e.message.slice(0, 300)));
    await p.waitForTimeout(1000);
  }
  await h.shot('42-efter-forsta-klick');
  h.log('EFTER_FORSTA_KLICK', (await h.text()).slice(0, 500));

  // Bekräftelsedialog?
  const dialogTexter = await p.locator('[role="dialog"], [role="alertdialog"]').allInnerTexts().catch(() => []);
  h.log('DIALOGER', JSON.stringify(dialogTexter).slice(0, 500));
  const bekraftaBtn = p.getByRole('button', { name: /^(Radera|Ta bort|Ja, radera|Bekräfta)$/i }).last();
  if (await bekraftaBtn.isVisible().catch(() => false)) {
    await bekraftaBtn.click({ timeout: 8000 }).catch((e) => h.log('BEKRAFTA_FEL', e.message.slice(0, 300)));
    await p.waitForTimeout(1500);
  }
  await h.shot('43-efter-bekraftelse');
  h.log('EFTER_BEKRAFTELSE', (await h.text()).slice(0, 700));

  await h.go('/diary');
  await stangOnboardingOmSynlig(p, h, 'diary-reload-efter-radering');
  await h.shot('44-reload-final');
  h.log('RELOAD_FINAL', (await h.text()).slice(0, 700));
};
