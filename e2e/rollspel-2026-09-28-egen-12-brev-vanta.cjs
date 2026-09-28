module.exports = async (p, h) => {
  if (p.url() === 'about:blank') await h.go('/cover-letter');
  await p.waitForTimeout(2000);
  // Om det finns en "Fortsätt på det"-banner, klicka den
  const fortsatt = p.getByRole('button', { name: /Fortsätt på det/i }).first();
  if (await fortsatt.count()) { await fortsatt.click(); await p.waitForTimeout(1500); }
  await h.shot('75-vantar-pa-ai');
  let text = await p.locator('main').innerText().catch(() => '');
  h.log('Genererar fortfarande?', /Skriver ett utkast/.test(text));
  for (let i = 0; i < 6 && /Skriver ett utkast/.test(text); i++) {
    await p.waitForTimeout(8000);
    text = await p.locator('main').innerText().catch(() => '');
    h.log('Poll', i, 'fortfarande genererar?', /Skriver ett utkast/.test(text));
  }
  await h.shot('76-efter-vantan');
  h.log('SLUTTEXT:', text.slice(0, 3000));
};
