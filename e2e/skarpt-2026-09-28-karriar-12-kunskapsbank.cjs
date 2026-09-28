module.exports = async (p, h) => {
  await h.go('/knowledge-base');
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
  await h.shot('110-kunskapsbank-forst');

  const sokFalt = p.locator('#kb-sok');
  await sokFalt.fill('CV');
  await sokFalt.press('Enter');
  await p.waitForTimeout(1200);
  await h.shot('111-sok-resultat');
  const t1 = await h.text();
  h.log('SOKTRAFFAR_VISAS', /träff|resultat/i.test(t1));

  // Öppna första artikeln i sökresultatet
  const forstaLank = p.locator('main a[href*="/knowledge-base/article/"]').first();
  if (await forstaLank.count()) {
    await forstaLank.click();
    await p.waitForTimeout(1500);
  } else {
    h.log('INGEN ARTIKELLÄNK HITTADES I SÖKRESULTATET');
  }
  await h.shot('112-artikel-oppnad');
  const t2 = await h.text();
  h.log('ARTIKEL_OPPNAD', t2.length > 500);

  // Lyssna/Listen (text-till-tal) — kan saknas i headless Chromium
  const lyssnaKnapp = p.getByRole('button', { name: /^(Lyssna|Listen)$/ });
  h.log('LYSSNA_KNAPP_FINNS', await lyssnaKnapp.count() > 0);
  if (await lyssnaKnapp.count()) {
    await lyssnaKnapp.click();
    await p.waitForTimeout(1000);
    await h.shot('113-efter-lyssna-klick');
  }

  // Ladda ner/Download PDF
  const laddaNerKnapp = p.getByRole('button', { name: /Ladda ner|Download/ });
  if (await laddaNerKnapp.count()) {
    const [download] = await Promise.all([
      p.waitForEvent('download', { timeout: 15000 }).catch(() => null),
      laddaNerKnapp.click(),
    ]);
    h.log('PDF_NEDLADDNING_TRIGGAD', !!download);
    if (download) h.log('PDF_FILNAMN', download.suggestedFilename());
  } else {
    h.log('INGEN LADDA NER-KNAPP');
  }
  await h.shot('114-efter-ladda-ner');

  // Skriv ut/Print — window.print(); kontrollera bara att inget kraschar
  const skrivUtKnapp = p.getByRole('button', { name: /Skriv ut|Print/ });
  if (await skrivUtKnapp.count()) {
    await p.evaluate(() => { window.print = () => { window.__printAnropad = true; }; });
    await skrivUtKnapp.click();
    await p.waitForTimeout(500);
    const printAnropad = await p.evaluate(() => window.__printAnropad === true);
    h.log('SKRIV_UT_ANROPADE_WINDOW_PRINT', printAnropad);
  }

  // Nuvarande språk och växla till det andra
  const htmlLang = await p.evaluate(() => document.documentElement.lang);
  h.log('SPRAK_INNAN_BYTE', htmlLang);
  const sprakKnapp = p.getByRole('button', { name: /Välj språk|Select language/ });
  if (await sprakKnapp.count()) {
    await sprakKnapp.click();
    await p.waitForTimeout(300);
    const malSprak = htmlLang?.startsWith('en') ? /Svenska/ : /English/;
    await p.getByRole('option', { name: malSprak }).click();
    await p.waitForTimeout(1500);
  } else {
    h.log('INGEN SPRÅKVÄLJARE HITTADES');
  }
  await h.shot('115-efter-sprakbyte');
  const nyttLang = await p.evaluate(() => document.documentElement.lang);
  h.log('SPRAK_EFTER_BYTE', nyttLang);
  h.log('SPRAK_BYTTES_FAKTISKT', nyttLang !== htmlLang);

  await h.go('/knowledge-base');
  await p.waitForTimeout(1000);
  await h.shot('116-kunskapsbank-efter-byte');
  const forstaLank2 = p.locator('main a[href*="/knowledge-base/article/"]').first();
  if (await forstaLank2.count()) {
    await forstaLank2.click();
    await p.waitForTimeout(1500);
    await h.shot('117-artikel-efter-byte');
  }
  h.log('KLART sk-12-kunskapsbank');
};
