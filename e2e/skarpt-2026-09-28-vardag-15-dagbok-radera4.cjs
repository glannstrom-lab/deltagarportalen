const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  let dialogText = null;
  p.on('dialog', async (d) => { dialogText = `${d.type()}: ${d.message()}`; await d.accept(); });

  await h.go('/diary');
  await stangOnboardingOmSynlig(p, h, 'diary');
  const raderaBtn = p.getByRole('button', { name: /Radera dagboksinlägget/i }).first();
  await raderaBtn.scrollIntoViewIfNeeded().catch(() => {});
  const box1 = await raderaBtn.boundingBox();
  h.log('BOX_EFTER_SCROLLINTOVIEW', JSON.stringify(box1));

  // Extra scroll ned för att komma under ev. fast header, sedan upp lite för marginal
  await p.mouse.wheel(0, 150);
  await p.waitForTimeout(400);
  const box2 = await raderaBtn.boundingBox();
  h.log('BOX_EFTER_EXTRA_SCROLL', JSON.stringify(box2));
  await h.shot('70-efter-extra-scroll');

  // Vad ligger EGENTLIGEN på den punkten just nu?
  if (box2) {
    const cx = box2.x + box2.width / 2;
    const cy = box2.y + box2.height / 2;
    const info = await p.evaluate(({ cx, cy }) => {
      const el = document.elementFromPoint(cx, cy);
      return el ? { tag: el.tagName, cls: el.className?.toString().slice(0, 120), aria: el.getAttribute('aria-label') } : null;
    }, { cx, cy });
    h.log('ELEMENT_PA_PUNKTEN', JSON.stringify(info));
  }

  await raderaBtn.click({ timeout: 8000 }).catch((e) => h.log('KLICK_FEL', e.message.slice(0, 300)));
  await p.waitForTimeout(1500);
  h.log('DIALOG_TEXT', dialogText);
  await h.shot('71-efter-klick');
  h.log('TEXT', (await h.text()).slice(0, 500));
};
