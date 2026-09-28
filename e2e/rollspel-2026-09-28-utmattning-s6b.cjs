module.exports = async (p, h) => {
  await h.go('/ai-team');
  await p.waitForTimeout(1200);
  await p.getByText('Arbetsterapeut', { exact: true }).first().click();
  await p.waitForTimeout(1000);
  const knapp = p.getByRole('button', { name: /Hantera stress/i }).first();
  h.log('SNABBFUNKTION FINNS:', await knapp.count());
  if (await knapp.count()) {
    await knapp.click();
    await p.waitForTimeout(1200);
    await h.shot('23-efter-snabbfunktion-klick');
    const t = await p.locator('main').innerText().catch(() => '');
    h.log('EFTER KLICK PA SNABBFUNKTION:', t.slice(0, 1500));
  }
};
