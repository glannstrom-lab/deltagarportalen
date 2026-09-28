module.exports = async (p, h) => {
  if (p.url() === 'about:blank') await h.go('/cv');
  await p.waitForTimeout(1200);
  await h.shot('61-cv-vid-ankomst-dator');
  const knapp = p.getByRole('button', { name: 'Gå till steg 6: Granska' });
  h.log('Antal matchande knappar:', await knapp.count());
  await knapp.click();
  await p.waitForTimeout(1500);
  await h.shot('62-granska-steg');
  h.log((await p.locator('main').innerText().catch(() => '')).slice(0, 2000));
};
