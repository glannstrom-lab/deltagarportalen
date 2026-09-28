module.exports = async (p, h) => {
  await h.go('/settings');
  await p.waitForTimeout(1500);
  const integritetFlik = p.getByRole('button', { name: /^Integritet$/i }).first();
  const integritetLank = p.getByRole('link', { name: /^Integritet$/i }).first();
  if (await integritetFlik.count()) { await integritetFlik.click(); }
  else if (await integritetLank.count()) { await integritetLank.click(); }
  await p.waitForTimeout(1200);
  await h.shot('112-integritet-flik');
  h.log((await p.locator('main').innerText().catch(() => '')).slice(-2500));
};
