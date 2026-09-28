module.exports = async (p, h) => {
  await h.go('/interview-simulator');
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
  await h.shot('10-intervju-forst');

  // Om ett utkast redan finns från tidigare körning: börja om för en ren körning.
  const börjaOm = p.getByRole('button', { name: /Börja om/ });
  if (await börjaOm.count()) {
    await börjaOm.click();
    await p.waitForTimeout(500);
  }

  await p.getByPlaceholder(/Projektledare, Säljare, Utvecklare/).fill('Ekonomiassistent');
  await p.getByRole('button', { name: /Starta intervjun/ }).click();
  await p.waitForTimeout(15000); // AI-anrop 1: genererar fråga
  await h.shot('11-fraga-genererad');

  const svarFalt = p.getByPlaceholder(/Skriv ditt svar här eller använd mikrofonen/);
  await svarFalt.fill('Jag löste en gång en konflikt i teamet genom att lyssna på båda sidor och föreslå en kompromiss som alla kunde acceptera. Resultatet blev bättre samarbete.');
  await h.shot('12-svar-ifyllt');
  await p.getByRole('button', { name: /Nästa fråga/ }).click();
  await p.waitForTimeout(18000); // AI-anrop 2: betyg + feedback + nästa fråga
  await h.shot('13-efter-svar-betyg');
  const text13 = await h.text();
  h.log('INNEHALLER_BETYG', /\/\s*5|betyg|AI:s bedömning|feedback/i.test(text13));

  // Ladda om mitt i intervjun — ska kunna återupptas
  await p.reload();
  await p.waitForTimeout(3000);
  await h.shot('14-efter-omladdning');
  const text14 = await h.text();
  h.log('DRAFT_BANNER_SYNS', /inte blev klar|Fortsätt/i.test(text14));
  const fortsattKnapp = p.getByRole('button', { name: /^Fortsätt$/ });
  if (await fortsattKnapp.count()) {
    await fortsattKnapp.click();
    await p.waitForTimeout(1500);
    await h.shot('15-efter-fortsatt');
    const text15 = await h.text();
    h.log('HISTORIK_KVAR_EFTER_FORTSATT', /Jag löste en gång en konflikt/.test(text15));
  } else {
    h.log('INGEN FORTSATT-KNAPP HITTADES');
  }

  // Avsluta intervjun och kolla historiken ("Dina tidigare övningar")
  const avslutaKnapp = p.getByRole('button', { name: /Avsluta/ });
  if (await avslutaKnapp.count()) {
    await avslutaKnapp.first().click();
    await p.waitForTimeout(1000);
    const jaAvsluta = p.getByRole('button', { name: /Ja, avsluta/ });
    if (await jaAvsluta.count()) {
      await jaAvsluta.click();
      await p.waitForTimeout(4000); // AI-sammanfattning kan anropas
    }
    await h.shot('16-efter-avslutad');
  }

  await h.go('/interview-simulator');
  await h.shot('17-historik-lista');
  const text17 = await h.text();
  h.log('HISTORIK_LISTA_INNEHALLER_OVNING', /Dina tidigare övningar/.test(text17));
  h.log('KLART sk-02-intervju');
};
