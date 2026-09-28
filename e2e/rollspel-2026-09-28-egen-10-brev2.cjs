module.exports = async (p, h) => {
  if (p.url() === 'about:blank') await h.go('/cover-letter');
  await p.waitForTimeout(1500);
  const jobbKort = p.getByText(/Truckförare med erfarenhet av skjutstativtruck/i).first();
  if (await jobbKort.count()) { await jobbKort.click(); await p.waitForTimeout(500); }
  await h.shot('71-jobb-valt');
  const nasta = p.getByRole('button', { name: /^Nästa$/i }).first();
  await nasta.click();
  await p.waitForTimeout(1200);
  await h.shot('72-steg2-skriv-brevet');
  h.log((await p.locator('main').innerText().catch(() => '')).slice(0, 1500));
};
