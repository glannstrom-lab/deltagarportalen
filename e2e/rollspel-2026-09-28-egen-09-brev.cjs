// Bengt, dator: skriver ett personligt brev med AI utifrån det sparade jobbet.
module.exports = async (p, h) => {
  if (p.url() === 'about:blank') await h.go('/cover-letter');
  else await h.go('/cover-letter');
  await p.waitForTimeout(1500);
  await h.shot('70-brev-start');
  h.log((await p.locator('main').innerText().catch(() => '')).slice(0, 1500));
};
