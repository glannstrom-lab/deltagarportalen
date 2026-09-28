const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/calendar');
  await stangOnboardingOmSynlig(p, h, 'calendar');
  const dagBtn = p.getByRole('button', { name: /^Dag$/i }).first();
  if (await dagBtn.isVisible().catch(() => false)) { await dagBtn.click(); await p.waitForTimeout(1000); }

  const evBtn = p.getByRole('button', { name: /Skarpt test/i }).first();
  await evBtn.focus();
  await p.waitForTimeout(300);
  await p.keyboard.press('Enter');
  await p.waitForTimeout(1200);
  const titelFalt = p.locator('#eventmodal-f1');
  h.log('MODAL_OPPEN_EFTER_ENTER', await titelFalt.isVisible().catch(() => false));
  await h.shot('c0-efter-enter');

  // Prova med dispatchEvent direkt i DOM som en sista kontroll
  const klickatViaJs = await evBtn.evaluate((el) => {
    el.click();
    return true;
  }).catch((e) => e.message);
  h.log('JS_CLICK', klickatViaJs);
  await p.waitForTimeout(1200);
  h.log('MODAL_OPPEN_EFTER_JS_CLICK', await titelFalt.isVisible().catch(() => false));
  await h.shot('c1-efter-js-click');

  // Läs ut React-eventhanterarens existens via testid/aria
  const info = await evBtn.evaluate((el) => ({
    tag: el.tagName,
    disabled: el.disabled,
    outerHTMLStart: el.outerHTML.slice(0, 200),
  }));
  h.log('ELEMENT_INFO', JSON.stringify(info));
};
