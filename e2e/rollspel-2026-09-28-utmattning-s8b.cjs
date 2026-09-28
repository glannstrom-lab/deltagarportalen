// Stäng av fokusläget (återställning) och kontrollera att det faktiskt gick av.
module.exports = async (p, h) => {
  await h.go('/my-consultant');
  await p.waitForTimeout(1200);
  const avsluta = p.getByRole('button', { name: /Avsluta fokusläge/i }).first();
  h.log('AVSLUTA-KNAPP FINNS:', await avsluta.count());
  if (await avsluta.count()) {
    await avsluta.click();
    await p.waitForTimeout(1200);
  }
  await h.shot('35-fokuslage-avstangt');
  const t = await p.locator('body').innerText().catch(() => '');
  h.log('EFTER AVSLUTA:', t.includes('Steg 1 av 2') ? 'FORTFARANDE I FOKUSLAGE' : 'TILLBAKA I NORMALLAGE');
};
