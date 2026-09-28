module.exports = async (p, h) => {
  await h.go('/cv');
  await p.waitForTimeout(1500);
  await h.shot('30-cv-nuvarande-tillstand');
  const t = await p.locator('main').innerText().catch(() => '');
  h.log('NUVARANDE TILLSTAND:', t.slice(0, 1500));

  // Klicka på det tredje steg-cirkelelementet (index 2) i steg-raden
  const stegCirklar = p.locator('main button').filter({ hasText: /^\d$|^✓$/ });
  h.log('ANTAL STEGCIRKLAR:', await stegCirklar.count());

  // Enklare: klicka via role button med siffra i class-namn — testa positionsbaserat
  const knappHandtag = p.locator('main').locator('div').filter({ hasText: 'Steg' }).first();
  await h.shot('31-steg-omraden');

  const requests = [];
  p.on('request', (req) => {
    if (/supabase\.co|\/api\//.test(req.url())) requests.push(req.method() + ' ' + req.url().slice(0, 140));
  });

  // Försök klicka steg-nav-knapp nr 3 (0-indexerad: 1=nummer 2, kanske vi redan e på 3)
  const alla = await p.locator('main').getByRole('button').all();
  const texter = [];
  for (const k of alla) texter.push((await k.innerText().catch(() => '')).trim());
  h.log('ALLA KNAPPTEXTER:', JSON.stringify(texter));
};
