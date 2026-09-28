module.exports = async (p, h) => {
  await h.go('/interview-simulator');
  await p.waitForTimeout(2000);
  await h.shot('93-vid-ateranslutning');
  let text = await p.locator('main').innerText().catch(() => '');
  h.log('Läge vid återanslutning:', text.slice(0, 400));

  const svarFalt = p.getByPlaceholder(/svar|skriv/i).first();
  const svarTextarea = (await svarFalt.count()) ? svarFalt : p.locator('textarea').first();
  if (await svarTextarea.count()) {
    await svarTextarea.fill(
      'Jag har jobbat 30 år som truckförare och lagerarbetare på samma lager i Jönköping. Det som motiverar mig är att hålla ett jämnt, säkert tempo och att laget litar på att jag levererar rätt gods i tid. När jag blev varslad ville jag hitta något liknande igen, för jag trivs med truckkörning och att ha koll på hela lagret.'
    );
  }
  await h.shot('94-svar-ifyllt');
  const t0 = Date.now();
  const nastaFraga = p.getByRole('button', { name: /Nästa fråga/i }).first();
  if (await nastaFraga.count()) {
    await nastaFraga.click();
  }
  for (let i = 0; i < 6; i++) {
    await p.waitForTimeout(6000);
    text = await p.locator('main').innerText().catch(() => '');
    h.log(`Poll ${i} (${Date.now()-t0}ms) textlängd ${text.length}`);
  }
  await h.shot('95-efter-svar-skickat');
  h.log('TEXT:', text.slice(0, 3000));
};
