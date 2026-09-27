module.exports = async (p, h) => {
  await h.go('/min-vecka');
  await p.getByRole('button', { name: /Nästa vecka/ }).click();
  await p.waitForTimeout(2500);
  await p.getByRole('button', { name: /Jag kan inte komma/ }).click();
  await p.waitForTimeout(800);
  const kort = p.locator('section').filter({ hasText: 'Måndag 28' });
  await kort.scrollIntoViewIfNeeded();
  console.log(await kort.innerText());
  await h.shot('06-franvaro-form', false);
  const radio = p.getByRole('radio', { name: /barn/i });
  if (await radio.count()) await radio.first().check({ force: true }); else await p.getByText(/barn/i).first().click();
  const ta = kort.locator('textarea, input[type=text]');
  if (await ta.count()) await ta.first().fill('Min dotter har feber, vi är hemma.');
  await h.shot('07-franvaro-ifylld', false);
  const skicka = kort.getByRole('button', { name: /Skicka|Anmäl|Spara/ });
  console.log('knappar', await kort.getByRole('button').allInnerTexts());
  await skicka.first().click();
  await p.waitForTimeout(2500);
  console.log(await kort.innerText());
  await h.shot('08-franvaro-klar', false);
  // fråga om passet
  await kort.getByRole('button', { name: /Fråga om passet/ }).click().catch(async () => { await kort.getByText('Fråga om passet').click(); });
  await p.waitForTimeout(1000);
  console.log('FRAGA', await kort.innerText());
  await h.shot('09-fraga-om-passet', false);
  const ta2 = kort.locator('textarea');
  if (await ta2.count()) {
    await ta2.last().fill('Behöver jag ta med något på måndag?');
    console.log('knappar2', await kort.getByRole('button').allInnerTexts());
    await kort.getByRole('button', { name: /Skicka/ }).last().click();
    await p.waitForTimeout(2500);
    console.log('EFTER', await kort.innerText());
    await h.shot('10-fraga-skickad', false);
  }
  // förra veckan x2
  await p.getByRole('button', { name: /Förra veckan/ }).click(); await p.waitForTimeout(1500);
  await p.getByRole('button', { name: /Förra veckan/ }).click(); await p.waitForTimeout(2500);
  const t = await h.shot('11-vecka-38');
  console.log(t.split('Vecka måndag').slice(-1)[0].slice(0, 1500));
};
