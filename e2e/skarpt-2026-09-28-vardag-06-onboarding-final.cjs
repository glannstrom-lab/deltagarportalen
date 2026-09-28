// Diagnos 4: generös väntan, klick, generös väntan efter, full nätverksloggning.
module.exports = async (p, h) => {
  const alla = [];
  p.on('requestfinished', async (req) => {
    if (/supabase\.co\/rest|supabase\.co\/auth/.test(req.url()) && req.method() !== 'GET') {
      const resp = await req.response();
      let body = '';
      try { body = (await resp.text()).slice(0, 200); } catch {}
      alla.push(`${req.method()} ${resp?.status()} ${req.url().slice(0, 180)} :: ${body}`);
    }
  });
  p.on('requestfailed', (req) => {
    if (/supabase\.co/.test(req.url())) alla.push(`FAILED ${req.method()} ${req.url().slice(0,180)} :: ${req.failure()?.errorText}`);
  });

  await h.go('/oversikt');
  await p.waitForTimeout(5000); // generös väntan på profil + dialog
  const dialog = p.getByRole('dialog');
  const synlig = await dialog.isVisible().catch(() => false);
  h.log('SYNLIG_EFTER_5S', synlig);
  await h.shot('50-fore');
  if (synlig) {
    const knapp = dialog.getByRole('button', { name: /Hoppa över/ });
    h.log('KNAPP_TEXT', await knapp.innerText().catch(() => '?'));
    await knapp.click({ timeout: 10000 });
    h.log('KLICK_OK');
  } else {
    h.log('INGEN_DIALOG_ATT_KLICKA');
  }
  await p.waitForTimeout(6000); // generös väntan EFTER klick, innan skriptet/browsern stängs
  await h.shot('51-efter');
  h.log('NATVERK', JSON.stringify(alla, null, 2));
};
