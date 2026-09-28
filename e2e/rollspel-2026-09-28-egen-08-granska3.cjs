module.exports = async (p, h) => {
  if (p.url() === 'about:blank') await h.go('/cv');
  await p.waitForTimeout(1200);
  // "Exempeldata"-badge — undersök
  const badge = p.getByText(/Exempeldata/i).first();
  if (await badge.count()) {
    await badge.hover().catch(() => {});
    await p.waitForTimeout(600);
    await h.shot('63-exempeldata-hover');
    await badge.click().catch(() => {});
    await p.waitForTimeout(800);
    await h.shot('64-exempeldata-klick');
  }
  const granskaLank = p.getByRole('link', { name: /^Granska$/i }).first();
  const granskaKnapp = p.getByRole('button', { name: /^Granska$/i }).first();
  if (await granskaLank.count()) { await granskaLank.click(); }
  else if (await granskaKnapp.count()) { await granskaKnapp.click(); }
  else { h.log('Ingen Granska-länk/knapp hittad'); }
  await p.waitForTimeout(1200);
  await h.shot('65-granska-slutlig');
  h.log((await p.locator('main').innerText().catch(() => '')).slice(0, 2500));
};
