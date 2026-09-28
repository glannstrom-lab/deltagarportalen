module.exports = async (p, h) => {
  // Karriär-sidans fem flikar
  const flikar = [
    ['/career', '70-karriar-arbetsmarknad'],
    ['/career/adaptation', '71-karriar-anpassning'],
    ['/career/credentials', '72-karriar-meriter'],
    ['/career/relocation', '73-karriar-flytta'],
    ['/career/plan', '74-karriar-plan'],
  ];
  for (const [vag, namn] of flikar) {
    await h.go(vag);
    await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
    await h.shot(namn);
  }
  const flyttText = await h.text();
  h.log('FLYTTDATA_VISAS', /flyttkostnad|Flyttkostnad|bostad|hyresnivå|Göteborg|Malmö/i.test(flyttText));

  // Utbildningssidan — sök
  await h.go('/education');
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
  await h.shot('75-utbildning-forst');
  const sokFalt = p.getByPlaceholder(/Sök utbildning, ämne eller skola/);
  await sokFalt.fill('Redovisningsekonom');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(4000);
  await h.shot('76-utbildning-sokresultat');
  const t2 = await h.text();
  h.log('SOKRESULTAT_VISAS', /träff|resultat|Yrkeshögskola|utbildningar hittades/i.test(t2));
  h.log('KLART sk-07');
};
