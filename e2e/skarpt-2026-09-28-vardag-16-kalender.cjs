const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/calendar');
  await stangOnboardingOmSynlig(p, h, 'calendar');
  await h.shot('80-calendar-start');
  h.log('START', (await h.text()).slice(0, 400));

  // Skapa händelse
  const nyBtn = p.getByRole('button', { name: /Ny händelse|Lägg till|\+/i }).first();
  const harNyBtn = await nyBtn.isVisible().catch(() => false);
  h.log('NY_HANDELSE_KNAPP_SYNLIG', harNyBtn);
  if (harNyBtn) {
    await nyBtn.click().catch((e) => h.log('NY_KLICK_FEL', e.message));
    await p.waitForTimeout(1200);
  }
  await stangOnboardingOmSynlig(p, h, 'ny-handelse-modal');
  await h.shot('81-modal-oppen');

  const titelFalt = p.locator('#eventmodal-f1');
  if (await titelFalt.isVisible().catch(() => false)) {
    await titelFalt.fill('Skarpt test — provhändelse');
  }
  // Datum: idag
  const idag = new Date();
  const datumStr = idag.toISOString().slice(0, 10);
  const datumFalt = p.locator('#eventmodal-f2');
  if (await datumFalt.isVisible().catch(() => false)) {
    await datumFalt.fill(datumStr);
  }
  const startFalt = p.locator('#eventmodal-f3');
  if (await startFalt.isVisible().catch(() => false)) {
    await startFalt.fill('14:00');
  }
  const slutFalt = p.locator('#eventmodal-f4');
  if (await slutFalt.isVisible().catch(() => false)) {
    await slutFalt.fill('15:00');
  }
  await h.shot('82-formular-ifyllt');

  const sparaBtn = p.getByRole('button', { name: /Skapa|Spara/i }).first();
  if (await sparaBtn.isVisible().catch(() => false)) {
    await sparaBtn.click().catch((e) => h.log('SPARA_FEL', e.message));
    await p.waitForTimeout(2000);
  }
  await h.shot('83-efter-spara');
  h.log('EFTER_SPARA', (await h.text()).slice(0, 700));

  // Ladda om — finns kvar?
  await h.go('/calendar');
  await stangOnboardingOmSynlig(p, h, 'reload');
  await h.shot('84-reload');
  h.log('RELOAD', (await h.text()).slice(0, 700));
};
