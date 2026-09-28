// Diagnos 3: försök tvinga fram dialogen (flera go()) och klicka rent, logga ALLA profiles-anrop.
module.exports = async (p, h) => {
  const reqs = [];
  p.on('response', async (r) => {
    if (/\/rest\/v1\/profiles/.test(r.url()) && r.request().method() !== 'GET') {
      let body = '';
      try { body = (await r.text()).slice(0, 300); } catch {}
      reqs.push(`${r.request().method()} ${r.status()} ${r.url().slice(0, 200)} :: ${body}`);
    }
  });

  let synlig = false;
  for (let i = 0; i < 5 && !synlig; i++) {
    await h.go(i % 2 === 0 ? '/oversikt' : '/min-vardag');
    await p.waitForTimeout(2000);
    synlig = await p.getByRole('dialog').isVisible().catch(() => false);
    h.log('FORSOK', i, 'SYNLIG', synlig);
  }
  await h.shot('40-dialog-forsok');
  if (synlig) {
    const dialog = p.getByRole('dialog');
    const knapp = dialog.getByRole('button', { name: /Hoppa över/ });
    await knapp.click({ timeout: 10000 }).catch((e) => h.log('KLICK_FEL', e.message));
    await p.waitForTimeout(3000);
  }
  await h.shot('41-efter-klick');
  h.log('PATCH_REQS', JSON.stringify(reqs, null, 2));
};
