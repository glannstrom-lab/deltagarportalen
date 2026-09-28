// demo-leverantor@jobin.se — markerar en avvikelse som underrättad till AF
// på Jonas Demos Aktivitet-flik (RR28), och kontrollerar att det sparas och
// står kvar efter omladdning. Dator.
module.exports = async (p, h) => {
  await h.go('/consultant/participants');
  await p.getByText('Jonas Demo', { exact: false }).first().click();
  await p.waitForTimeout(1500);
  const aktivitetFlik = p.getByRole('tab', { name: /Aktivitet/i }).first();
  await aktivitetFlik.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  await aktivitetFlik.click();
  await p.waitForTimeout(1200);
  await h.shot('01-jonas-aktivitet');

  // Välj en tidigare månad där Jonas ogiltiga frånvaro finns (september 2026 = nuvarande)
  const manadSelect = p.locator('#avvikelse-manad');
  if (await manadSelect.count()) {
    const opts = await manadSelect.locator('option').allTextContents();
    h.log('AVVIKELSE-MANADER', JSON.stringify(opts));
  }
  const text = await h.text();
  h.log('AVVIKELSER-RADER-SYNS', /AF (inte )?underrättad/i.test(text));
  h.log('INGA-AVVIKELSER-TEXT', /Inga avvikelser registrerade/i.test(text));

  const markeraKnapp = p.getByRole('button', { name: /Markera som underrättad/i }).first();
  if (await markeraKnapp.count()) {
    await markeraKnapp.click();
    await p.waitForTimeout(1500);
    await h.shot('02-efter-markera-underrattad');
    // Ladda om och kontrollera att det sitter kvar
    await h.go('/consultant/participants');
    await p.getByText('Jonas Demo', { exact: false }).first().click();
    await p.waitForTimeout(1500);
    const aktivitetFlik2 = p.getByRole('tab', { name: /Aktivitet/i }).first();
    await aktivitetFlik2.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await aktivitetFlik2.click();
    await p.waitForTimeout(1200);
    const textEfterOmladdning = await h.shot('03-efter-omladdning');
    h.log('MARKERINGEN-SITTER-KVAR-EFTER-OMLADDNING', /AF underrättad \d/i.test(textEfterOmladdning));
  } else {
    h.log('INGEN-MARKERA-SOM-UNDERRATTAD-KNAPP — inga avvikelser i vald månad, eller kolumnerFinns=false');
  }

  h.log('KLART: avvikelserapport-kontroll.');
};
