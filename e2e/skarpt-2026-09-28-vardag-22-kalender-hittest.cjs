const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/calendar');
  await stangOnboardingOmSynlig(p, h, 'calendar');
  const dagBtn = p.getByRole('button', { name: /^Dag$/i }).first();
  if (await dagBtn.isVisible().catch(() => false)) { await dagBtn.click(); await p.waitForTimeout(1000); }

  const evBtn = p.getByRole('button', { name: /Skarpt test/i }).first();
  await evBtn.scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  const box = await evBtn.boundingBox();
  h.log('BOX', JSON.stringify(box));

  if (box) {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const info = await p.evaluate(({ cx, cy }) => {
      const stack = document.elementsFromPoint(cx, cy);
      return stack.slice(0, 6).map(el => ({
        tag: el.tagName,
        id: el.id,
        cls: (el.className && el.className.toString) ? el.className.toString().slice(0, 100) : String(el.className).slice(0,100),
        zIndex: getComputedStyle(el).zIndex,
        pos: getComputedStyle(el).position,
      }));
    }, { cx, cy });
    h.log('ELEMENT_STACK_PA_KLICKPUNKTEN', JSON.stringify(info, null, 2));

    // Är focused-elementet verkligen knappen efter .focus()?
    await evBtn.focus();
    const aktivt = await p.evaluate(() => ({
      tag: document.activeElement?.tagName,
      cls: document.activeElement?.className?.toString().slice(0, 100),
      text: document.activeElement?.textContent?.slice(0, 60),
    }));
    h.log('AKTIVT_ELEMENT_EFTER_FOCUS', JSON.stringify(aktivt));
  }
};
