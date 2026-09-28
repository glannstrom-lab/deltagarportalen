// Fatima 07 — Google-översätt till arabiska, robust (svensk session).
module.exports = async (p, h) => {
  await h.go('/international');
  await h.shot('70-fore-arabiska');

  const sprakKnapp = p.getByRole('button', { name: 'Välj språk' });
  await sprakKnapp.click({ timeout: 5000 });
  await p.waitForTimeout(400);
  await h.shot('71-sprakmeny');

  const oversattKnapp = p.getByRole('button', { name: /Översätt sidan till fler språk|Översatt till/ });
  await oversattKnapp.click({ timeout: 5000 });
  await p.waitForTimeout(400);
  await h.shot('72-oversattlista-oppen');

  const arabiska = p.getByRole('button', { name: 'العربية' });
  await arabiska.click({ timeout: 5000 });
  h.log('Klickade arabiska, väntar på Google Translate-widgeten...');
  await p.waitForTimeout(5000);
  await h.shot('73-efter-arabiska-klick');
  // Ge Google-scriptet ytterligare tid — det laddas asynkront och kan vara långsamt.
  await p.waitForTimeout(5000);
  await h.shot('74-efter-arabiska-lang-vantan');

  // Kolla om en Google Translate-banderoll eller iframe finns i DOM.
  const iframeCount = await p.locator('iframe.goog-te-banner-frame, iframe#\\:1\\.container, .goog-te-banner-frame').count();
  const htmlLang = await p.evaluate(() => document.documentElement.lang);
  const bodyClass = await p.evaluate(() => document.body.className);
  h.log('iframeCount', iframeCount, 'htmlLang', htmlLang, 'bodyClass', bodyClass);

  // Städa: visa originalet igen
  await sprakKnapp.click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  const oversattKnapp2 = p.getByRole('button', { name: /Översatt till/ });
  if (await oversattKnapp2.count()) {
    await oversattKnapp2.click().catch(() => {});
    await p.waitForTimeout(300);
    const original = p.getByRole('button', { name: /Svenska \(utan översättning\)/ });
    if (await original.count()) { await original.click().catch(() => {}); await p.waitForTimeout(1500); }
  }
  await h.shot('75-tillbaka-original');
};
