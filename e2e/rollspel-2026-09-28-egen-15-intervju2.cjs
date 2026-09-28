module.exports = async (p, h) => {
  await h.go('/interview-simulator');
  await p.waitForTimeout(1500);
  const rollFalt = p.getByLabel(/Vilken roll ska du intervjua för/i).first();
  if (await rollFalt.count()) await rollFalt.fill('Truckförare / lagerarbetare');
  await h.shot('91-roll-ifylld');
  const starta = p.getByRole('button', { name: /Starta intervjun/i }).first();
  const t0 = Date.now();
  await starta.click();
  let text = '';
  for (let i = 0; i < 6; i++) {
    await p.waitForTimeout(6000);
    text = await p.locator('main').innerText().catch(() => '');
    const laddar = /Laddar|Förbereder|Genererar|\.\.\.\s*$/i.test(text.slice(-200));
    h.log(`Poll ${i} (${Date.now()-t0}ms), text-längd ${text.length}`);
  }
  await h.shot('92-intervju-fraga1');
  h.log('TEXT:', text.slice(0, 2000));
};
