// Diagnos 2: rent klick på "Hoppa över" — går PATCH mot profiles iväg? Vad svarar den?
module.exports = async (p, h) => {
  const reqs = [];
  p.on('response', async (r) => {
    if (/\/rest\/v1\/profiles/.test(r.url())) {
      let body = '';
      try { body = (await r.text()).slice(0, 300); } catch {}
      reqs.push(`${r.request().method()} ${r.status()} ${r.url().slice(0, 150)} :: ${body}`);
    }
  });

  await h.go('/oversikt');
  await p.waitForTimeout(1500);
  const dialog = p.getByRole('dialog');
  const synlig = await dialog.isVisible().catch(() => false);
  h.log('DIALOG_SYNLIG', synlig);
  await h.shot('30-fore-klick');
  if (synlig) {
    const knapp = dialog.getByRole('button', { name: /Hoppa över/ });
    await knapp.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await knapp.click({ timeout: 10000 }).catch((e) => h.log('KLICK_FEL', e.message));
    await p.waitForTimeout(3000);
  }
  await h.shot('31-efter-klick');
  const synligEfter = await dialog.isVisible().catch(() => false);
  h.log('DIALOG_SYNLIG_EFTER', synligEfter);
  h.log('PROFILES_REQS', JSON.stringify(reqs, null, 2));
};
