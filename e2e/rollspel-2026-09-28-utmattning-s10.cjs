// Bra dag: dator, ljust läge. Bredare koll: Översikt, Min konsulent, historik.
module.exports = async (p, h) => {
  await h.go('/oversikt');
  await p.waitForTimeout(1200);
  await h.shot('39-oversikt-dator');

  await h.go('/my-consultant');
  await p.waitForTimeout(1200);
  await h.shot('40-konsulent-dator');
  const t = await p.locator('main').innerText().catch(() => '');
  h.log('KONSULENT DATOR:', t.slice(0, 2500));

  const historik = p.getByText('Se allt du har gjort', { exact: false }).first();
  if (await historik.count()) {
    await historik.click();
    await p.waitForTimeout(1500);
    await h.shot('41-historik');
    const t2 = await p.locator('main').innerText().catch(() => '');
    h.log('HISTORIK:', t2.slice(0, 2000));
  }
};
