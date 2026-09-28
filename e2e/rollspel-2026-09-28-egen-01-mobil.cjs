// Bengt, mobil: inlogg, samtycke, onboarding-turné, Översikt, start på CV (personuppgifter + en erfarenhet).
module.exports = async (p, h) => {
  const t = {};
  const mark = (namn) => { t[namn] = Date.now(); };
  mark('start');

  // Om sessionen återanvänds (< 50 min) navigerar köraren INTE automatiskt —
  // gå dit själv så steget fungerar oavsett om sessionen är färsk eller gammal.
  if (p.url() === 'about:blank') await h.go('/oversikt');
  await p.waitForTimeout(1500);
  await h.shot('01-forsta-sidan');

  // Samtyckessteg (obligatoriskt, DP1)
  const samtycke = p.locator('[data-testid="samtyckessteg"]');
  if (await samtycke.count()) {
    h.log('Samtyckessteg synligt');
    await p.locator('#samtycke-villkor').check();
    await p.locator('#samtycke-integritet').check();
    const aiRuta = p.locator('#samtycke-ai');
    if (await aiRuta.count()) await aiRuta.check(); // Bengt ger AI-samtycke (uppdraget)
    await h.shot('02-samtycke-ifyllt');
    mark('samtycke-klick');
    await p.getByRole('button', { name: /Godkänn och fortsätt/ }).click();
    await p.waitForTimeout(2000);
    mark('samtycke-klar');
    h.log('samtycke sparat på ms', t['samtycke-klar'] - t['samtycke-klick']);
  } else {
    h.log('INGET samtyckessteg synligt — oväntat för nyskapat konto');
  }
  await h.shot('03-efter-samtycke');

  // Onboarding-tur (global modal)
  const onboardingTitel = p.getByRole('heading', { name: /Välkommen till Jobin/ });
  if (await onboardingTitel.count()) {
    h.log('Onboarding-tur synlig');
    await h.shot('04-onboarding-steg1');
    for (let i = 0; i < 4; i++) {
      const nasta = p.getByRole('button', { name: /^Nästa$/ });
      if (await nasta.count()) {
        await nasta.click();
        await p.waitForTimeout(500);
        await h.shot(`04-onboarding-steg${i + 2}`);
      }
    }
    // Sista steget: primär knapp "Till min vy"
    const klarKnapp = p.getByRole('button', { name: /Till min vy/ });
    if (await klarKnapp.count()) {
      await klarKnapp.click();
      await p.waitForTimeout(1500);
    }
  } else {
    h.log('INGEN onboarding-tur synlig (onboarding_completed redan true?)');
  }
  mark('onboarding-klar');
  await h.shot('05-oversikt-efter-onboarding');
  h.log('Översikt-text:', (await h.text()).slice(0, 500));

  // Bengt letar efter "nästa steg"
  await p.waitForTimeout(1000);
  await h.shot('06-oversikt-nastasteg');

  // Klicka på CV-byggaren från Översikt (leta länk/knapp)
  mark('cv-start-sok');
  const cvLank = p.getByRole('link', { name: /Skapa ditt CV/i }).first();
  if (await cvLank.count()) {
    await cvLank.click();
  } else {
    await h.go('/cv');
  }
  await p.waitForTimeout(2000);
  mark('cv-sida-laddad');
  h.log('CV-sida laddad efter ms', mark && (t['cv-sida-laddad'] - t['cv-start-sok']));
  await h.shot('07-cv-start');

  // Bengt ser "Snabb-CV — 30 sekunder" och väljer den (låg digital vana, vill bli klar snabbt)
  async function fyll(label, varde) {
    const falt = p.getByLabel(label, { exact: false }).first();
    if (await falt.count()) {
      await falt.fill(varde);
      return true;
    }
    return false;
  }
  mark('snabbcv-start');
  const namnFalt = p.getByLabel(/Ditt namn/i).first();
  if (await namnFalt.count()) {
    await namnFalt.fill('Bengt Karlsson');
    await h.shot('08-snabbcv-namn-ifyllt');
    await p.getByRole('button', { name: /^Nästa$/ }).click();
    await p.waitForTimeout(1000);
    await h.shot('09-snabbcv-steg2');
    h.log('Snabb-CV steg2-text:', (await h.text()).slice(0, 600));
  } else {
    h.log('Snabb-CV-namnfält hittades inte — skriver skärmdump av läget');
    await h.shot('08-snabbcv-namnfalt-saknas');
  }
  mark('snabbcv-steg2-klar');

  // Försök fylla resten av snabb-CV-steg 2/3 generiskt (yrkestitel, ort osv)
  const forsok = [
    [/vad jobbar du som|yrkes ?titel|titel/i, 'Truckförare och lagerarbetare'],
    [/ort|stad/i, 'Jönköping'],
    [/telefon/i, '070-123 45 67'],
  ];
  const resultat2 = {};
  for (const [regex, varde] of forsok) {
    const falt = p.getByLabel(regex).first();
    if (await falt.count()) {
      await falt.fill(varde).catch(() => {});
      resultat2[regex.source] = true;
    } else {
      resultat2[regex.source] = false;
    }
  }
  h.log('Ifyllnadsresultat steg2:', JSON.stringify(resultat2));
  await h.shot('10-snabbcv-steg2-ifyllt');

  const nastaKnapp = p.getByRole('button', { name: /^Nästa$/ });
  if (await nastaKnapp.count()) {
    await nastaKnapp.click();
    await p.waitForTimeout(1000);
    await h.shot('11-snabbcv-steg3');
    h.log('Snabb-CV steg3-text:', (await h.text()).slice(0, 800));
  }
  mark('snabbcv-klar');

  // Steg 3: kontaktuppgifter (e-post krävs, telefon valfritt)
  const epostFalt = p.getByPlaceholder(/din\.email/i).first();
  if (await epostFalt.count()) {
    await epostFalt.fill('rollspel-bengt-2026-09-28@jobin.test');
  }
  const telFalt = p.getByPlaceholder(/valfritt/i).first();
  if (await telFalt.count()) {
    await telFalt.fill('070-123 45 67');
  }
  await h.shot('12-snabbcv-kontakt-ifyllt');
  mark('skapa-cv-klick');
  const skapaKnapp = p.getByRole('button', { name: /Skapa mitt CV/i });
  if (await skapaKnapp.count()) {
    await skapaKnapp.click();
    await p.waitForTimeout(3000);
  }
  mark('cv-skapat');
  h.log('Snabb-CV klart på ms', t['cv-skapat'] - t['snabbcv-start']);
  await h.shot('13-cv-skapat');
  h.log('Efter-skapat-text:', (await h.text()).slice(0, 1200));

  mark('slut');
  h.log('TIDER (ms):', JSON.stringify(Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v - t.start]))));
};
