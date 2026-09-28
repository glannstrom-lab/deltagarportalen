// demo-leverantor@jobin.se — registrerar en placering för Sara Exempel med
// utfall/omfattning/nivå (RR7) och backdaterat startdatum så 3-månaderspunkten
// redan passerat, registrerar 3-månadersuppföljningen med datum/utfall/underlag
// (RR5) och sätter betalstatus (RR25/resultatklockan). Dator.
module.exports = async (p, h) => {
  await h.go('/consultant/participants');
  await h.shot('01-deltagarlista');
  await p.getByText('Sara Exempel', { exact: false }).first().click();
  await p.waitForTimeout(1200);
  await h.shot('02-sara-detaljsida');

  const registreraKnapp = p.getByRole('button', { name: /Registrera placering/i }).first();
  await registreraKnapp.click();
  await p.waitForTimeout(800);
  await h.shot('03-placering-dialog');

  await p.locator('#placement-employer').fill('SL-skarpt Kontor AB');
  await p.locator('#placement-title').fill('Kontorsassistent');

  // Startdatum ~100 dagar tillbaka så 3-månaderspunkten (90 dagar) redan passerat.
  const startDatum = new Date();
  startDatum.setDate(startDatum.getDate() - 100);
  const startIso = startDatum.toISOString().slice(0, 10);
  await p.locator('#placement-start').fill(startIso);

  await p.locator('#placement-type').selectOption('permanent').catch(() => {});
  await p.locator('#placement-omfattning').fill('30');
  await p.locator('#placement-niva').selectOption('B').catch(() => {});
  await h.shot('04-placering-ifylld');

  const spara = p.getByRole('button', { name: /Spara placering/i });
  await spara.click();
  await p.waitForTimeout(2000);
  await h.shot('05-efter-spara-placering');

  // -- 3-månadersuppföljning --
  await h.go('/consultant/participants');
  await p.getByText('Sara Exempel', { exact: false }).first().click();
  await p.waitForTimeout(1200);
  await h.shot('06-sara-efter-placering');

  const registrera3man = p.getByRole('button', { name: /Registrera 3-mån/i }).first();
  if (await registrera3man.count()) {
    await registrera3man.click();
    await p.waitForTimeout(700);
    await h.shot('07-uppfoljning-dialog');
    await p.locator('#uppf-datum').fill(new Date().toISOString().slice(0, 10));
    await p.locator('#uppf-utfall').selectOption({ index: 1 }).catch(() => {});
    await p.locator('#uppf-underlag').selectOption({ index: 1 }).catch(() => {});
    const anteckning = p.locator('#uppf-anteckning');
    if (await anteckning.count()) await anteckning.fill('Skarpt funktionstest 2026-09-28 — Sara trivs, fortsätter.');
    await h.shot('08-uppfoljning-ifylld');
    const sparaUppf = p.getByRole('button', { name: /^(Spara|Registrera)/i }).last();
    await sparaUppf.click();
    await p.waitForTimeout(2000);
    await h.shot('09-efter-uppfoljning');
  } else {
    h.log('INGEN-REGISTRERA-3MAN-KNAPP — kanske gates på annat sätt än förväntat');
  }

  // -- Betalstatus / resultatklockan --
  const efterText = await h.text();
  h.log('ERSATTNING-SYNS', /Ersättning:/i.test(efterText));
  const markeraVerifierad = p.getByRole('button', { name: /Markera verifierad/i }).first();
  if (await markeraVerifierad.count()) {
    await markeraVerifierad.click();
    await p.waitForTimeout(1500);
    await h.shot('10-efter-markera-verifierad');
  } else {
    h.log('INGEN-MARKERA-VERIFIERAD-KNAPP');
  }

  h.log('KLART: placering + uppföljning + betalstatus för Sara.');
};
