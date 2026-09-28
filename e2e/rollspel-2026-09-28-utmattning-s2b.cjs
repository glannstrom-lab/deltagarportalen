// Efterföljer s2: kolla om mående-loggningen bara var långsam eller fastnat.
module.exports = async (p, h) => {
  await h.go('/wellness');
  await p.waitForTimeout(1000);
  const samtyckBtn = p.getByRole('button', { name: /^Jag samtycker$/ });
  if (await samtyckBtn.count()) {
    await samtyckBtn.click();
  }
  h.log('Väntar 8s för att se om spinnern löser sig...');
  await p.waitForTimeout(8000);
  await h.shot('05b-halsa-efter-8s');
  h.log('Väntar ytterligare 8s...');
  await p.waitForTimeout(8000);
  await h.shot('05c-halsa-efter-16s');
  const huvudtext = await p.locator('main').innerText().catch(() => '');
  h.log('HUVUDTEXT:', huvudtext.slice(0, 2000));
  // Ladda om sidan en gång till för att se om det är en engångsglitch
  await p.reload();
  await p.waitForTimeout(4000);
  await h.shot('05d-halsa-efter-reload');
  const huvudtext2 = await p.locator('main').innerText().catch(() => '');
  h.log('HUVUDTEXT EFTER RELOAD:', huvudtext2.slice(0, 2000));
};
