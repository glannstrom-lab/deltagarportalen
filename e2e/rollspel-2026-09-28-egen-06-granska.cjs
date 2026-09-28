module.exports = async (p, h) => {
  if (p.url() === 'about:blank') await h.go('/cv');
  await p.waitForTimeout(1200);
  const stegCirkel6 = p.getByRole('button', { name: /steg 6/i }).first();
  if (await stegCirkel6.count()) { await stegCirkel6.click(); await p.waitForTimeout(1200); }
  await h.shot('60-granska-dator');
  h.log((await p.locator('main').innerText().catch(() => '')).slice(0, 1500));
};
