module.exports = async (p, h) => {
  await h.go('/settings?section=privacy');
  await p.waitForTimeout(1500);
  const raderaNuKnapp = p.getByRole('button', { name: /Radera nu istället/i }).first();
  await raderaNuKnapp.scrollIntoViewIfNeeded();
  await raderaNuKnapp.click();
  await p.waitForTimeout(1000);
  await h.shot('116-radera-nu-dialog');
  h.log((await p.locator('body').innerText().catch(() => '')).slice(-1500));

  const bekraftaFalt = p.locator('input[type="text"]').last();
  if (await bekraftaFalt.count()) {
    await bekraftaFalt.fill('RADERA');
  }
  await h.shot('117-radera-ord-ifyllt');
  const sluttKnapp = p.getByRole('button', { name: /Radera för alltid/i }).first();
  h.log('Radera för alltid-knapp finns:', await sluttKnapp.count());
  await sluttKnapp.click();
  await p.waitForTimeout(3000);
  await h.shot('118-efter-radering');
  h.log('SLUTTEXT:', (await p.locator('body').innerText().catch(() => '')).slice(0, 1000));
};
