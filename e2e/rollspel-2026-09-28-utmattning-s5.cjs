// Amina slår på delning av välmåendedata med sin konsulent, sparar, laddar om.
module.exports = async (p, h) => {
  await h.go('/settings');
  await p.waitForTimeout(1200);
  const integritet = p.getByRole('button', { name: /Integritet/i }).first();
  await integritet.click();
  await p.waitForTimeout(1200);
  await h.shot('15-integritet-fore-delning');

  const vaxlar = p.locator('main').locator('[role="switch"]');
  const antal = await vaxlar.count();
  h.log('ANTAL VAXLAR PA SIDAN:', antal);
  // Andra växeln = "Dela välmåendedata" (hälsodata är först)
  const vaxel = vaxlar.nth(1);
  await vaxel.scrollIntoViewIfNeeded();
  const innanChecked = await vaxel.getAttribute('aria-checked');
  h.log('FORE KLICK aria-checked:', innanChecked);
  await vaxel.click();
  const klickad = true;
  h.log('VAXEL KLICKAD:', klickad);
  await p.waitForTimeout(800);
  await h.shot('16-efter-vaxel-klick');

  const sparaBtn = p.getByRole('button', { name: /^Spara$/ });
  if (await sparaBtn.count()) {
    await sparaBtn.click();
    await p.waitForTimeout(2000);
    await h.shot('17-efter-spara-delning');
  } else {
    h.log('INGEN SPARA-KNAPP HITTAD FOR DELNING');
  }

  // Ladda om och kolla om det höll
  await p.reload();
  await p.waitForTimeout(2500);
  const integritet2 = p.getByRole('button', { name: /Integritet/i }).first();
  await integritet2.click();
  await p.waitForTimeout(1200);
  await h.shot('18-efter-reload-delning');
  const t = await p.locator('main').innerText().catch(() => '');
  h.log('EFTER RELOAD TEXT (delning):', t.slice(t.indexOf('Vad din konsulent'), t.indexOf('Vad din konsulent') + 900));
};
