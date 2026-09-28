module.exports = async (p, h) => {
  await h.go('/settings');
  await p.waitForTimeout(1500);
  await h.shot('110-installningar');
  // Scrolla till "Ditt konto" / Radera konto
  const raderaKnapp = p.getByRole('button', { name: /^Radera konto$/i }).first();
  const raderaRubrik = p.getByText(/^Radera konto$/i).first();
  if (await raderaRubrik.count()) {
    await raderaRubrik.scrollIntoViewIfNeeded().catch(() => {});
  }
  await h.shot('111-radera-sektion');
  h.log((await p.locator('main').innerText().catch(() => '')).slice(-2000));
};
