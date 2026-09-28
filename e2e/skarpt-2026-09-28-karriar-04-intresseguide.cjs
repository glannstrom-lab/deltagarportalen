module.exports = async (p, h) => {
  await h.go('/interest-guide?tab=test');
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
  await h.shot('40-intresseguide-forst');

  const fortsattKnapp = p.getByRole('button', { name: /Fortsätt där du slutade/ });
  const startaKnapp = p.getByRole('button', { name: /Starta intresseguiden/ });
  if (await fortsattKnapp.count()) {
    await fortsattKnapp.click();
    await p.waitForTimeout(800);
  } else if (await startaKnapp.count()) {
    await startaKnapp.click();
    await p.waitForTimeout(800);
  }
  await h.shot('41-forsta-fragan');

  let svarade = 0;
  for (let i = 0; i < 40; i++) {
    // Rangeslidern ligger ovanpå de visuella prickarna (z-20) — fokusera och
    // sätt värdet med tangentbordet, precis som en riktig tangentbordsanvändare.
    const slider = p.locator('main input[type="range"]');
    if (await slider.count()) {
      await slider.first().focus();
      await p.keyboard.press('ArrowRight');
    } else {
      h.log('INGEN SLIDER HITTADES på fråga', i);
      break;
    }
    // Vänta ut "Sparar…"-läget (upp till 5 s) innan vi läser knappens skick.
    for (let w = 0; w < 25; w++) {
      const sparar = await p.getByRole('button', { name: /Sparar/ }).count();
      if (!sparar) break;
      await p.waitForTimeout(200);
    }

    const nastaKnapp = p.getByRole('button', { name: /Nästa fråga/ });
    const seResultat = p.getByRole('button', { name: /Se mitt resultat/ });
    if (await seResultat.count()) {
      await seResultat.click();
      svarade++;
      break;
    } else if (await nastaKnapp.count() && await nastaKnapp.isEnabled()) {
      await nastaKnapp.click();
      svarade++;
      await p.waitForTimeout(300);
    } else {
      h.log('FASTNADE på fråga', i, '— varken Nästa eller Se resultat gick att klicka');
      await h.shot(`42-fastnade-${i}`);
      break;
    }
  }
  h.log('ANTAL_FRAGOR_BESVARADE', svarade);
  await p.waitForTimeout(3000);
  await h.shot('43-efter-alla-fragor');
  const t = await h.text();
  h.log('VISAR_RESULTAT_SIDA', /RIASEC|personlighetsprofil|Ditt resultat|intresseprofil/i.test(t));

  // Reload — resultatet ska finnas kvar (sparat)
  await h.go('/interest-guide?tab=results');
  await p.waitForTimeout(1500);
  await h.shot('44-resultat-flik');
  const t2 = await h.text();
  h.log('RESULTAT_SPARAT', !/inget resultat|Gör testet/i.test(t2) || /Uppdaterades|klart/i.test(t2));

  // Yrken som matchar profilen
  await h.go('/interest-guide?tab=occupations');
  await p.waitForTimeout(1500);
  await h.shot('45-yrken-flik');
  const t3 = await h.text();
  h.log('VISAR_YRKEN', /Rekommenderade yrken|Matchning|passar dig/i.test(t3));

  h.log('KLART sk-04-intresseguide');
};
