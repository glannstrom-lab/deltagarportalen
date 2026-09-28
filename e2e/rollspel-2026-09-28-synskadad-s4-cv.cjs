const { tabTrace, axeKor, landmarkOchRubriker } = require('./rollspel-2026-09-28-synskadad-helpers.cjs');
const fs = require('fs');
const path = require('path');

module.exports = async (p, h) => {
  await h.go('/cv');
  await h.shot('08-cv-start');
  await landmarkOchRubriker(p, h, 'cv-start');

  // Peter vill ha "mer kontroll" — den fullständiga CV-byggaren, inte snabb-CV.
  const fullstandig = p.getByRole('link', { name: /fullständiga CV-byggaren/i }).or(p.getByRole('button', { name: /fullständiga CV-byggaren/i })).first();
  const harLank = await fullstandig.count().then((c) => c > 0).catch(() => false);
  h.log('FULLSTÄNDIGA CV-BYGGAREN-LÄNK HITTAD', harLank);
  if (harLank) {
    await fullstandig.click();
    await p.waitForTimeout(2000);
  }
  const txt1 = await h.shot('09-cv-fullstandig');
  console.log(txt1.slice(0, 2500));
  await landmarkOchRubriker(p, h, 'cv-fullstandig');
  await axeKor(p, h, 'cv-fullstandig');

  // Leta upp en flik/sektion för "Erfarenhet"/"Arbetslivserfarenhet"
  const erfFlik = p.getByRole('tab', { name: /erfarenhet/i }).or(p.getByRole('button', { name: /erfarenhet/i })).or(p.getByRole('link', { name: /erfarenhet/i })).first();
  const harErfFlik = await erfFlik.count().then((c) => c > 0).catch(() => false);
  h.log('ERFARENHET-FLIK/KNAPP HITTAD', harErfFlik);
  if (harErfFlik) {
    await erfFlik.scrollIntoViewIfNeeded().catch(() => {});
    await erfFlik.focus();
    await p.keyboard.press('Enter');
    await p.waitForTimeout(1500);
  }
  const txt2 = await h.shot('10-cv-erfarenhet-sektion');
  console.log(txt2.slice(0, 2500));

  // Hitta "Lägg till erfarenhet"-knapp
  const laggTill = p.getByRole('button', { name: /lägg till (en )?(erfarenhet|arbetslivserfarenhet|jobb)/i }).first();
  const harLaggTill = await laggTill.count().then((c) => c > 0).catch(() => false);
  h.log('LÄGG TILL ERFARENHET-KNAPP HITTAD', harLaggTill);
  if (harLaggTill) {
    await laggTill.scrollIntoViewIfNeeded().catch(() => {});
    await laggTill.focus();
    await p.keyboard.press('Enter');
    await p.waitForTimeout(1000);
  }
  const txt3 = await h.shot('11-cv-erfarenhet-formular');
  console.log(txt3.slice(0, 2500));
  await tabTrace(p, h, 'cv-erfarenhet-formular', 20);
};
