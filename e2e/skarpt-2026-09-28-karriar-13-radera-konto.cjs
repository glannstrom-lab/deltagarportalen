module.exports = async (p, h) => {
  await h.go('/settings?section=privacy');
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
  await p.waitForTimeout(500);
  await h.shot('120-installningar-fore-radering');

  await p.getByRole('button', { name: /Begär radering av konto/ }).click();
  await p.waitForTimeout(500);
  await h.shot('121-bekrafta-dialog');
  await p.getByRole('button', { name: /^Begär radering$/ }).click();
  await p.waitForTimeout(2000);
  await h.shot('122-radering-begard-pending');
  const t1 = await h.text();
  h.log('PENDING_STATUS_VISAS', /Radering begärd|schemalagt för radering/i.test(t1));

  const raderaNuKnapp = p.getByRole('button', { name: /Radera nu istället/ });
  if (await raderaNuKnapp.count()) {
    await raderaNuKnapp.click();
    await p.waitForTimeout(500);
    await h.shot('123-omedelbar-dialog');
    await p.locator('#deleteaccountsection-f2').fill('RADERA');
    await h.shot('124-radera-ord-ifyllt');
    await p.getByRole('button', { name: /Radera för alltid/ }).click();
    await p.waitForTimeout(4000);
    await h.shot('125-efter-radering');
    const t2 = await h.text();
    h.log('RADERAT_MEDDELANDE_VISAS', /Ditt konto har raderats/i.test(t2));
  } else {
    h.log('INGEN RADERA NU-KNAPP HITTADES — kollar sidan');
    await h.shot('123b-ingen-radera-nu-knapp');
  }
  h.log('KLART sk-13-radera');
};
