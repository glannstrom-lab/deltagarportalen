// AI-teamet: arbetsterapeuten, med AI avstängt av organisationen (demo).
module.exports = async (p, h) => {
  await h.go('/ai-team');
  await p.waitForTimeout(1500);
  await h.shot('19-ai-team-forst');
  const t1 = await p.locator('main').innerText().catch(() => '');
  h.log('AI-TEAM FORST:', t1.slice(0, 2500));

  // Försök välja arbetsterapeut-agenten om den syns i en lista
  const arbTerapeut = p.getByText(/Arbetsterapeut/i).first();
  if (await arbTerapeut.count()) {
    await arbTerapeut.click();
    await p.waitForTimeout(1200);
    await h.shot('20-ai-team-arbetsterapeut-vald');
    const t2 = await p.locator('main').innerText().catch(() => '');
    h.log('EFTER VAL:', t2.slice(0, 2000));
  }

  // Försök skriva ett meddelande om ekonomi/regelverk och se vad som händer
  const inputFalt = p.locator('textarea, input[type="text"]').last();
  if (await inputFalt.count()) {
    await inputFalt.click();
    await inputFalt.type('Jag orkar inte idag, vad ska jag göra?');
    await h.shot('21-ai-team-fraga-skriven');
    const skickaBtn = p.getByRole('button', { name: /Skicka/i }).last();
    if (await skickaBtn.count()) {
      await skickaBtn.click();
      await p.waitForTimeout(2500);
      await h.shot('22-ai-team-efter-skicka');
      const t3 = await p.locator('main').innerText().catch(() => '');
      h.log('EFTER SKICKA:', t3.slice(-2000));
    }
  } else {
    h.log('INGET INPUTFALT HITTADES');
  }
};
