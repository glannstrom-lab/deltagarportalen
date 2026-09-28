module.exports = async (p, h) => {
  if (p.url() === 'about:blank') await h.go('/cv');
  await p.waitForTimeout(1200);
  const btns = await p.locator('button[aria-label*="steg" i]').allTextContents();
  const labels = await p.locator('button[aria-label*="steg" i]').evaluateAll(els => els.map(e => e.getAttribute('aria-label')));
  h.log('Knappar:', JSON.stringify(labels));
};
