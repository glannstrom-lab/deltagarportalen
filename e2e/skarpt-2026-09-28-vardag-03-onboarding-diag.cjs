// Diagnos: reagerar onboarding-turens "Hoppa över" alls?
module.exports = async (p, h) => {
  await h.go('/oversikt');
  await h.shot('20-oversikt-start');
  const dialog = p.getByRole('dialog');
  const harDialog = await dialog.isVisible().catch(() => false);
  h.log('DIALOG_SYNLIG', harDialog);
  if (harDialog) {
    const knapp = dialog.getByRole('button', { name: /Hoppa över/ });
    const antal = await knapp.count();
    h.log('HOPPA_OVER_KNAPPAR', antal);
    const box = await knapp.first().boundingBox().catch(() => null);
    h.log('BOUNDING_BOX', JSON.stringify(box));
    await knapp.first().click({ force: true, timeout: 5000 }).catch((e) => h.log('FORCE_KLICK_FEL', e.message));
    await p.waitForTimeout(2000);
    const fortfarandeSynlig = await dialog.isVisible().catch(() => false);
    h.log('DIALOG_SYNLIG_EFTER_KLICK', fortfarandeSynlig);
  }
  await h.shot('21-efter-force-klick');

  // Navigera om — kommer den tillbaka?
  await h.go('/wellness');
  await h.shot('22-wellness-efter-skip');
  const dialog2 = p.getByRole('dialog');
  h.log('DIALOG_PA_WELLNESS', await dialog2.isVisible().catch(() => false));
};
