const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');
const fs = require('fs');
const path = require('path');

module.exports = async (p, h) => {
  await h.go('/calendar');
  await stangOnboardingOmSynlig(p, h, 'calendar');
  const dagBtn = p.getByRole('button', { name: /^Dag$/i }).first();
  if (await dagBtn.isVisible().catch(() => false)) { await dagBtn.click(); await p.waitForTimeout(1000); }

  const ev = p.getByText('Skarpt test — provhändelse').first();
  await ev.scrollIntoViewIfNeeded().catch(() => {});
  await p.waitForTimeout(500);
  const box = await ev.boundingBox();
  h.log('BOX', JSON.stringify(box));
  await ev.click({ timeout: 8000 });
  await p.waitForTimeout(1000);

  // Viewport-skärmdump (INTE fullPage) för att undvika fixed-header-artefakter
  const f = path.join(h.UT, 'm-diag-viewport.png');
  await p.screenshot({ path: f, fullPage: false });
  h.log('VIEWPORT_SHOT', f);

  const dialogAntal = await p.getByRole('dialog').count();
  h.log('DIALOG_ANTAL', dialogAntal);
  const modalTitelInput = await p.locator('#eventmodal-f1').count();
  h.log('MODAL_TITEL_INPUT_ANTAL', modalTitelInput);
  h.log('URL', p.url());
};
