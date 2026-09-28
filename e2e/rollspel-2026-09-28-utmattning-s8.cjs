// Lugnare läge: fokusläge + pauspåminnelse i praktiken.
module.exports = async (p, h) => {
  await h.go('/my-consultant');
  await p.waitForTimeout(1500);
  const lugnareKnapp = p.getByRole('button', { name: /Lugnare läge/i }).first();
  await lugnareKnapp.scrollIntoViewIfNeeded();
  await lugnareKnapp.click();
  await p.waitForTimeout(800);
  await h.shot('32-lugnare-panel-oppen');

  const vaxlar = p.locator('main').locator('[role="switch"]');
  h.log('ANTAL VAXLAR I LUGNARE:', await vaxlar.count());
  // Slå på fokusläge
  await vaxlar.nth(0).click();
  await p.waitForTimeout(1500);
  await h.shot('33-efter-fokuslage-pa');
  const t1 = await p.locator('body').innerText().catch(() => '');
  h.log('EFTER FOKUSLAGE PA:', t1.slice(0, 1500));

  // Slå av igen (återställ)
  const lugnareKnapp2 = p.getByRole('button', { name: /Lugnare läge|Fokusläget är på/i }).first();
  if (await lugnareKnapp2.count()) {
    await lugnareKnapp2.click().catch(() => {});
    await p.waitForTimeout(600);
  }
  const vaxlar2 = p.locator('main').locator('[role="switch"]');
  if (await vaxlar2.count()) {
    await vaxlar2.nth(0).click().catch(() => {});
  }
  await p.waitForTimeout(1200);
  await h.shot('34-efter-aterstallt-fokuslage');
};
