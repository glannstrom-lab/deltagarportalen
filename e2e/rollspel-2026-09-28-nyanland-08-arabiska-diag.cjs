// Fatima 08 — diagnos: laddas Google Translate-scriptet över huvud taget?
module.exports = async (p, h) => {
  const natverk = [];
  p.on('response', (r) => {
    if (/translate\.google|googleapis/.test(r.url())) natverk.push(`${r.status()} ${r.url().slice(0, 150)}`);
  });
  const konsolfel = [];
  p.on('console', (m) => konsolfel.push(`${m.type()}: ${m.text().slice(0, 200)}`));
  p.on('requestfailed', (r) => {
    if (/translate\.google/.test(r.url())) natverk.push(`FAILED ${r.failure()?.errorText} ${r.url().slice(0, 150)}`);
  });

  await h.go('/international');
  const sprakKnapp = p.getByRole('button', { name: 'Välj språk' });
  await sprakKnapp.click({ timeout: 5000 });
  await p.waitForTimeout(300);
  const oversattKnapp = p.getByRole('button', { name: /Översätt sidan till fler språk|Översatt till/ });
  await oversattKnapp.click({ timeout: 5000 });
  await p.waitForTimeout(300);
  const arabiska = p.getByRole('button', { name: 'العربية' });
  await arabiska.click({ timeout: 5000 });
  await p.waitForTimeout(6000);

  const scriptExists = await p.evaluate(() =>
    !!document.querySelector('script[src*="translate.google.com/translate_a/element.js"]')
  );
  const googExists = await p.evaluate(() => typeof window.google !== 'undefined');
  const cookie = await p.evaluate(() => document.cookie);

  h.log('=== DIAGNOS ===');
  h.log('scriptExists', scriptExists);
  h.log('googExists', googExists);
  h.log('cookie innehåller googtrans:', /googtrans/.test(cookie));
  h.log('Nätverksanrop mot Google Translate:', JSON.stringify(natverk));
  h.log('Konsolmeddelanden (senaste 15):', JSON.stringify(konsolfel.slice(-15)));

  await h.shot('80-diagnos-arabiska');

  // Städa
  const sprakKnapp2 = p.getByRole('button', { name: 'Välj språk' });
  await sprakKnapp2.click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  const oversattKnapp2 = p.getByRole('button', { name: /Översatt till/ });
  if (await oversattKnapp2.count()) {
    await oversattKnapp2.click().catch(() => {});
    await p.waitForTimeout(300);
    const original = p.getByRole('button', { name: /Svenska \(utan översättning\)/ });
    if (await original.count()) { await original.click().catch(() => {}); await p.waitForTimeout(1500); }
  }
};
