const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/diary');
  await stangOnboardingOmSynlig(p, h, 'diary');
  await h.shot('30-diary');

  // Klicka på inlägget för att öppna det (redigera)
  const inlagg = p.getByText('Skarpt test 2026-09-28', { exact: false }).first();
  const harInlagg = await inlagg.isVisible().catch(() => false);
  h.log('INLAGG_SYNLIGT', harInlagg);
  if (harInlagg) {
    await inlagg.click().catch((e) => h.log('KLICK_FEL', e.message));
    await p.waitForTimeout(1500);
  }
  await h.shot('31-inlagg-oppnat');
  h.log('OPPNAT', (await h.text()).slice(0, 600));

  // Försök hitta redigera-knapp
  const redigeraBtn = p.getByRole('button', { name: /Redigera/i }).first();
  if (await redigeraBtn.isVisible().catch(() => false)) {
    await redigeraBtn.click();
    await p.waitForTimeout(1000);
    const ta = p.locator('textarea').first();
    if (await ta.isVisible().catch(() => false)) {
      await ta.fill('Skarpt test 2026-09-28: REDIGERAT provinlägg.');
    }
    const sparaBtn = p.getByRole('button', { name: /Spara/i }).first();
    if (await sparaBtn.isVisible().catch(() => false)) {
      await sparaBtn.click().catch((e) => h.log('SPARA_REDIGERING_FEL', e.message));
      await p.waitForTimeout(1500);
    }
  }
  await h.shot('32-efter-redigering');
  h.log('EFTER_REDIGERING', (await h.text()).slice(0, 700));

  // Radera
  const raderaBtn = p.getByRole('button', { name: /Radera|Ta bort/i }).first();
  const harRadera = await raderaBtn.isVisible().catch(() => false);
  h.log('RADERA_SYNLIG', harRadera);
  if (harRadera) {
    await raderaBtn.click().catch((e) => h.log('RADERA_KLICK_FEL', e.message));
    await p.waitForTimeout(1000);
    // Bekräfta i ev. dialogruta
    const bekraftaBtn = p.getByRole('button', { name: /Radera|Ta bort|Bekräfta|Ja/i }).last();
    if (await bekraftaBtn.isVisible().catch(() => false)) {
      await bekraftaBtn.click().catch(() => {});
      await p.waitForTimeout(1500);
    }
  }
  await h.shot('33-efter-radering');
  h.log('EFTER_RADERING', (await h.text()).slice(0, 700));

  await h.go('/diary');
  await stangOnboardingOmSynlig(p, h, 'diary-efter-radering-reload');
  await h.shot('34-reload-efter-radering');
  h.log('RELOAD_EFTER_RADERING', (await h.text()).slice(0, 700));

  // --- Tacksamhet: skriv och spara ---
  await h.go('/diary');
  const tacksamTab = p.getByRole('button', { name: /Tacksamhet/i }).first();
  if (await tacksamTab.isVisible().catch(() => false)) {
    await tacksamTab.click().catch(() => {});
    await p.waitForTimeout(1200);
  }
  const falt1 = p.locator('input[type=text], textarea').first();
  if (await falt1.isVisible().catch(() => false)) {
    await falt1.fill('Skarpt test — tacksam 1');
  }
  await h.shot('35-tacksamhet-ifylld');
  const sparaTacksamBtn = p.getByRole('button', { name: /Spara tacksamhet/i }).first();
  if (await sparaTacksamBtn.isVisible().catch(() => false)) {
    await sparaTacksamBtn.click().catch((e) => h.log('SPARA_TACKSAM_FEL', e.message));
    await p.waitForTimeout(1500);
  }
  await h.shot('36-efter-spara-tacksamhet');
  h.log('EFTER_TACKSAMHET', (await h.text()).slice(0, 700));
};
