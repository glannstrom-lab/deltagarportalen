// Ett sammanhängande pass utan omnavigering: starta, svara, se feedback.
module.exports = async (p, h) => {
  await h.go('/interview-simulator');
  await p.waitForTimeout(1500);
  const rollFalt = p.getByLabel(/Vilken roll ska du intervjua för/i).first();
  if (await rollFalt.count()) await rollFalt.fill('Truckförare / lagerarbetare');
  const starta = p.getByRole('button', { name: /Starta intervjun/i }).first();
  await starta.click();
  await p.waitForTimeout(2000);
  await h.shot('96-fraga-mottagen');
  h.log('Fråga:', (await p.locator('main').innerText().catch(() => '')).slice(0, 500));

  const svarTextarea = p.locator('textarea').first();
  await svarTextarea.fill(
    'Jag har jobbat 30 år som truckförare och lagerarbetare på samma lager i Jönköping. Det som motiverar mig är att hålla ett jämnt, säkert tempo och att kollegorna litar på att jag levererar rätt gods i tid. Efter varslet vill jag hitta ett liknande jobb, för jag trivs med truckkörning och att ha koll på hela lagret.'
  );
  await h.shot('97-svar-skrivet');

  const t0 = Date.now();
  const nastaFraga = p.getByRole('button', { name: /Nästa fråga/i }).first();
  await nastaFraga.click();
  let text = '';
  let klart = false;
  for (let i = 0; i < 8; i++) {
    await p.waitForTimeout(6000);
    text = await p.locator('main').innerText().catch(() => '');
    const genererar = /betygsätter|analyserar|bedömer|\.\.\.$/i.test(text.slice(-300));
    h.log(`Poll ${i} (${Date.now()-t0}ms) textlängd ${text.length} genererar?`, genererar);
    if (/Fråga 2|Genomsnittligt betyg:\s*\d|poäng|\/10|Feedback/i.test(text) && !genererar) { klart = true; break; }
  }
  await h.shot('98-efter-svar-feedback');
  h.log('SLUTTEXT:', text.slice(0, 3000));
};
