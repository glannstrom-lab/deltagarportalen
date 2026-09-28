const AGENTER = [
  { id: 'arbetskonsulent', namn: 'Arbetskonsulent', fraga: 'Ge mig tre korta tips för att förbättra mitt CV.' },
  { id: 'arbetsterapeut', namn: 'Arbetsterapeut', fraga: 'Hur mycket får jag i a-kassa om jag blir sjukskriven?' },
  { id: 'studievagledare', namn: 'Studievägledare', fraga: 'Vilka utbildningar passar en ekonomiassistent som vill bli redovisningsekonom?' },
  { id: 'motivationscoach', namn: 'Motivationscoach', fraga: 'Jag känner mig omotiverad i jobbsökandet, vad kan jag göra?' },
  { id: 'digitalcoach', namn: 'Digital Coach', fraga: 'Hur skriver jag ett bra LinkedIn-inlägg?' },
];

module.exports = async (p, h) => {
  await h.go('/ai-team');
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
  await h.shot('90-aiteam-forst');

  for (const a of AGENTER) {
    const radio = p.getByRole('radio', { name: new RegExp(`^${a.namn}:`) });
    if (await radio.count()) {
      await radio.click();
      await p.waitForTimeout(500);
    } else {
      h.log('HITTADE INTE AGENT-RADIO för', a.namn);
      continue;
    }
    const faltet = p.getByPlaceholder(/Skriv meddelande/);
    await faltet.fill(a.fraga);
    await p.getByRole('button', { name: /^Skicka$/ }).click();
    // Vänta ut streamingen (kan ta upp till 60s)
    await p.waitForTimeout(20000);
    await h.shot(`91-${a.id}-svar`);
    const t = await h.text();
    const harBelopp = a.id === 'arbetsterapeut' && /\d[\s ]?\d{3}\s?kr|\d+\s?%|kronor/i.test(t.split(a.fraga).pop() || '');
    h.log(`AGENT_${a.id}_SVARADE`, t.length > 200);
    if (a.id === 'arbetsterapeut') {
      h.log('AKASSA_NAMNER_BELOPP_UR_MINNET', harBelopp);
    }
  }
  h.log('KLART sk-10-aiteam');
};
