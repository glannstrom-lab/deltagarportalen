// Rättar mitt eget skriptfel: förra körningen skickade av misstag TVÅ förslag
// för Jonas plats (SL-skarpt Lager) och NOLL för Sara (SL-skarpt Kontor).
// Tar bort ett av Jonas dubbletter och skickar rätt förslag för Sara, skopat
// till respektive platskort den här gången.
module.exports = async (p, h) => {
  await h.go('/consultant/platser');
  await h.shot('01-platser-fore-fix');

  // -- Ta bort en av de två utkasten på Jonas plats --
  // Skopar till wrapper-diven `<div key={p.id} className="space-y-2">` i PlatserTab
  // (space-y-2 används bara där) via texten "· SL-skarpt Lager 2026-09-28".
  const jonasKort = p.locator('text=SL-skarpt Lager 2026-09-28').locator('xpath=ancestor::div[contains(@class,"space-y-2")][1]').first();
  const taBortKnappar = jonasKort.getByRole('button', { name: /Ta bort utkast/i });
  const antal = await taBortKnappar.count();
  h.log('ANTAL-TA-BORT-KNAPPAR-JONAS', antal);
  if (antal > 1) {
    await taBortKnappar.first().click();
    await p.waitForTimeout(500);
    const bekraftaKnapp = p.getByRole('button', { name: /^Ta bort$/i }).last();
    if (await bekraftaKnapp.count()) {
      await bekraftaKnapp.click();
      await p.waitForTimeout(1200);
    }
    await h.shot('02-efter-ta-bort-dublett');
  }

  // -- Skicka rätt förslag för Sara, skopat till hennes eget kort --
  await h.go('/consultant/platser');
  const saraKort = p.locator('text=SL-skarpt Kontor 2026-09-28').locator('xpath=ancestor::div[contains(@class,"space-y-2")][1]').first();
  const foreslaSara = saraKort.getByRole('button', { name: /Föreslå deltagaren för företaget/i }).first();
  if (await foreslaSara.count()) {
    await foreslaSara.click();
    await p.waitForTimeout(800);
    await h.shot('03-foresla-dialog-sara');
    // Bekräfta att dialogen verkligen gäller Sara
    const dialogText = await p.locator('[role="dialog"]').innerText().catch(() => '');
    h.log('DIALOG-NAMNGER-SARA', /Sara/i.test(dialogText));
    h.log('DIALOG-NAMNGER-JONAS', /Jonas/i.test(dialogText));

    const kompetenserBox = p.getByText('Kompetenser', { exact: true }).locator('xpath=ancestor::label//input[@type="checkbox"]').first();
    const erfarenhetBox = p.getByText('Arbetslivserfarenhet', { exact: true }).locator('xpath=ancestor::label//input[@type="checkbox"]').first();
    for (const box of [kompetenserBox, erfarenhetBox]) {
      if (await box.count()) await box.check().catch(() => {});
    }
    const textarea = p.locator('textarea').first();
    if (await textarea.count()) await textarea.fill('Sara är noggrann och van vid administration. Skarpt funktionstest 2026-09-28 (rättad körning).');
    await h.shot('04-foresla-ifylld-sara');

    const skicka = p.getByRole('button', { name: /Skicka frågan/i }).first();
    await skicka.click();
    await p.waitForTimeout(1500);
    await h.shot('05-efter-skicka-sara');
  } else {
    h.log('INGEN-FORESLA-KNAPP-PA-SARAS-KORT');
  }

  await h.go('/consultant/platser');
  await h.shot('06-platser-efter-fix');
  h.log('KLART: rättning av förslagen.');
};
