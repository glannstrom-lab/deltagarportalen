module.exports = async (p, h) => {
  await h.go('/cv');
  await p.waitForTimeout(1500);
  const fullstandig = p.getByText('Eller använd den fullständiga CV-byggaren', { exact: false }).first();
  if (await fullstandig.count()) { await fullstandig.click(); await p.waitForTimeout(1500); }
  const hoppaOver = p.getByRole('button', { name: /Hoppa över/i }).first();
  if (await hoppaOver.count()) { await hoppaOver.click(); await p.waitForTimeout(1000); }
  // Klicka Nästa två gånger för att nå Steg 3 (Profil) oavsett var vi står
  const nasta = p.getByRole('button', { name: /^Nästa$/ });
  await nasta.click();
  await p.waitForTimeout(1000);
  await nasta.click();
  await p.waitForTimeout(1000);

  const requests = [];
  p.on('request', (req) => {
    if (/supabase\.co|\/api\//.test(req.url())) requests.push(req.method() + ' ' + req.url().slice(0, 120));
  });

  const genereraBtn = p.getByRole('button', { name: /Generera sammanfattning/i });
  await genereraBtn.click();
  await p.waitForTimeout(3000);

  h.log('NATVERKSANROP UNDER GENERERA:', JSON.stringify(requests, null, 1));

  const ta = p.locator('textarea').first();
  const varde = await ta.inputValue().catch(() => '(kunde inte läsa värde)');
  h.log('TEXTAREA VARDE (innerText/value):', JSON.stringify(varde));
  const placeholder = await ta.getAttribute('placeholder').catch(() => null);
  h.log('PLACEHOLDER-ATTRIBUT:', placeholder);
};
