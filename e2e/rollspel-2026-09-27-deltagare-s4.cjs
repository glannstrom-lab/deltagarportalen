module.exports = async (p, h) => {
  await h.go('/min-vecka');
  await p.getByRole('button', { name: /Nästa vecka/ }).click();
  await p.waitForTimeout(2500);
  const kort = p.locator('section').filter({ hasText: 'Måndag 28' });
  await kort.getByText('Fråga om passet').click();
  await p.waitForTimeout(800);
  const ta = kort.locator('textarea').last();
  console.log('FÖRIFYLLT:', await ta.inputValue());
  await ta.press('End'); await ta.type('Behöver jag ta med något?');
  await kort.getByRole('button', { name: /^Skicka$/ }).click();
  await p.waitForTimeout(3000);
  console.log('EFTER', await kort.innerText());
  await kort.scrollIntoViewIfNeeded();
  await h.shot('12-fraga-skickad-ok', false);
  // ångra och anmäl sjuk
  await kort.getByRole('button', { name: /Ångra anmälan/ }).click();
  await p.waitForTimeout(2500);
  await kort.getByRole('button', { name: /Jag kan inte komma/ }).click();
  await kort.getByText('Jag är sjuk').click();
  await kort.getByRole('button', { name: /Skicka till min konsulent/ }).click();
  await p.waitForTimeout(2500);
  console.log('SJUK', await kort.innerText());
  await h.shot('13-sjuk-anmald', false);
  await h.go('/my-consultant');
  console.log((await h.shot('14-min-konsulent')).split('Min profil').slice(-1)[0].slice(0, 6000));
};
