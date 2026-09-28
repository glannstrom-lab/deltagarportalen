const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  let dialogText = null;
  p.on('dialog', async (d) => {
    dialogText = `${d.type()}: ${d.message()}`;
    h.log('NATIV_DIALOG', dialogText);
    await d.accept();
  });

  await h.go('/diary');
  await stangOnboardingOmSynlig(p, h, 'diary');
  const raderaBtn = p.getByRole('button', { name: /Radera dagboksinlägget/i }).first();
  await raderaBtn.scrollIntoViewIfNeeded().catch(() => {});
  await raderaBtn.click({ timeout: 8000, force: true });
  await p.waitForTimeout(2000);
  h.log('DIALOG_TEXT', dialogText);
  await h.shot('60-efter-klick-med-dialoghantering');
  h.log('TEXT', (await h.text()).slice(0, 700));

  await h.go('/diary');
  await stangOnboardingOmSynlig(p, h, 'diary-reload');
  await h.shot('61-reload');
  h.log('RELOAD_TEXT', (await h.text()).slice(0, 700));
};
