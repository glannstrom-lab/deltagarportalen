// Tillgänglighet: Större text — testa och återställ.
module.exports = async (p, h) => {
  await h.go('/settings');
  await p.waitForTimeout(1200);
  const tillg = p.getByRole('button', { name: /Tillgänglighet/i }).first();
  await tillg.click();
  await p.waitForTimeout(1000);
  await h.shot('36-tillganglighet-fore');
  const t0 = await p.locator('main').innerText().catch(() => '');
  h.log('TILLGANGLIGHET INNAN:', t0.slice(0, 2000));

  const storreTextVaxel = p.getByRole('checkbox', { name: /Större text/i });
  h.log('STORRE TEXT VAXEL FINNS:', await storreTextVaxel.count());
  await storreTextVaxel.click({ force: true });
  await p.waitForTimeout(1000);
  await h.shot('37-storre-text-pa');

  // Återställ
  await storreTextVaxel.click({ force: true });
  await p.waitForTimeout(1000);
  await h.shot('38-storre-text-av-igen');
};
