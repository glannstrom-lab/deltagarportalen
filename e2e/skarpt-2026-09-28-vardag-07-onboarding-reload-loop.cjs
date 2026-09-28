// Diagnos 5: p.reload() (RIKTIG omladdning varje gång, inte hash-navigering) i loop tills dialogen dyker upp.
module.exports = async (p, h) => {
  const alla = [];
  p.on('requestfinished', async (req) => {
    if (/supabase\.co\/rest\/v1\/profiles/.test(req.url()) && req.method() !== 'GET') {
      const resp = await req.response();
      let body = '';
      try { body = (await resp.text()).slice(0, 200); } catch {}
      alla.push(`${req.method()} ${resp?.status()} ${req.url().slice(0, 180)} :: ${body}`);
    }
  });

  await h.go('/oversikt');
  let synlig = false;
  let forsok = 0;
  for (; forsok < 8; forsok++) {
    await p.reload();
    await p.waitForTimeout(3500);
    synlig = await p.getByRole('dialog').isVisible().catch(() => false);
    h.log('RELOAD_FORSOK', forsok, 'SYNLIG', synlig);
    if (synlig) break;
  }
  await h.shot('60-dialog-vid-forsok-' + forsok);
  if (synlig) {
    const dialog = p.getByRole('dialog');
    const knapp = dialog.getByRole('button', { name: /Hoppa över/ });
    await knapp.click({ timeout: 10000 }).catch((e) => h.log('KLICK_FEL', e.message));
    h.log('KLICK_FORSOKT');
  }
  await p.waitForTimeout(5000);
  await h.shot('61-efter-klick');
  h.log('SYNLIG_EFTER_KLICK', await p.getByRole('dialog').isVisible().catch(() => false));
  h.log('PATCH_REQS', JSON.stringify(alla, null, 2));
};
