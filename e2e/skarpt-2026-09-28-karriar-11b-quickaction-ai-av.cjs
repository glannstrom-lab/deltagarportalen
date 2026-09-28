module.exports = async (p, h) => {
  await h.go('/ai-team');
  await p.waitForTimeout(1000);
  await h.shot('105-aiteam-fore-quickaction');

  // Klicka en snabbfunktion i sidopanelen (UT3-misstanken)
  const snabb = p.getByText('LinkedIn-tips', { exact: true });
  if (await snabb.count()) {
    await snabb.first().click();
    await p.waitForTimeout(3000);
    await h.shot('106-efter-quickaction-klick');
    const t = await h.text();
    h.log('VISAR_FELMEDDELANDE_OM_AI_AV', /stängt av AI|Slå på det i Inställningar|pausad/i.test(t));
    h.log('NYTT_AI_SVAR_TILLAGT', (t.match(/Online-närvaro/g) || []).length);
  } else {
    h.log('HITTADE INTE SNABBFUNKTIONEN LinkedIn-tips');
  }

  // Försök skicka ett manuellt meddelande också
  const faltet = p.getByPlaceholder(/Skriv meddelande/);
  if (await faltet.count()) {
    await faltet.fill('Test medan AI är av');
    await p.getByRole('button', { name: /^Skicka$/ }).click();
    await p.waitForTimeout(3000);
    await h.shot('107-efter-manuellt-skicka');
    const t2 = await h.text();
    h.log('MANUELLT_SKICKA_FEL_VISAS', /stängt av AI|Slå på det i Inställningar|pausad/i.test(t2));
  }
  h.log('KLART sk-11b');
};
