const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/exercises');
  await stangOnboardingOmSynlig(p, h, 'exercises');
  await h.shot('e0-ovningar-lista');
  h.log('LISTA', (await h.text()).slice(0, 500));

  // Klicka på första övningskortet (heading-nivå för att träffa kortet, inte "Lås"-ikonen)
  const forstaOvning = p.locator('h3').first();
  const namn = await forstaOvning.innerText().catch(() => '?');
  h.log('FORSTA_OVNING', namn);
  await forstaOvning.click({ timeout: 8000 }).catch((e) => h.log('KLICK_FEL', e.message));
  await p.waitForTimeout(1500);
  await stangOnboardingOmSynlig(p, h, 'ovning-oppnad');
  await h.shot('e1-ovning-oppnad');
  h.log('OPPNAD', (await h.text()).slice(0, 700));

  // Fyll i ev. textfält och gå vidare
  const ta = p.locator('textarea').first();
  if (await ta.isVisible().catch(() => false)) {
    await ta.fill('Skarpt test — provsvar på övningsfråga.');
  }
  const input = p.locator('input[type=text]').first();
  if (!(await ta.isVisible().catch(() => false)) && await input.isVisible().catch(() => false)) {
    await input.fill('Skarpt test — provsvar.');
  }
  await h.shot('e2-svar-ifyllt');

  const nastaBtn = p.getByRole('button', { name: /Nästa|Fortsätt/i }).first();
  if (await nastaBtn.isVisible().catch(() => false)) {
    await nastaBtn.click().catch((e) => h.log('NASTA_FEL', e.message));
    await p.waitForTimeout(1500);
  }
  await h.shot('e3-efter-nasta');
  h.log('EFTER_NASTA', (await h.text()).slice(0, 600));

  // Tillbaka till listan
  const tillbakaBtn = p.getByRole('button', { name: /Tillbaka|Avsluta|Alla övningar/i }).first();
  if (await tillbakaBtn.isVisible().catch(() => false)) {
    await tillbakaBtn.click().catch(() => {});
    await p.waitForTimeout(1000);
  } else {
    await h.go('/exercises');
  }
  await stangOnboardingOmSynlig(p, h, 'tillbaka-till-lista');
  await h.shot('e4-tillbaka-lista');
  h.log('TILLBAKA_LISTA', (await h.text()).slice(0, 500));

  // Reload — sparades framstegen?
  await h.go('/exercises');
  await stangOnboardingOmSynlig(p, h, 'reload');
  await h.shot('e5-reload');
  h.log('RELOAD', (await h.text()).slice(0, 500));
};
