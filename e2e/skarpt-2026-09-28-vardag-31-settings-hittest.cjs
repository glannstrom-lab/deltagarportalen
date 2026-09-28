const { stangOnboardingOmSynlig } = require('./skarpt-2026-09-28-vardag-hjalp.cjs');

module.exports = async (p, h) => {
  await h.go('/settings');
  await stangOnboardingOmSynlig(p, h, 'settings');
  const notisBtn = p.getByRole('button', { name: /^Notifikationer$/i }).first();
  await notisBtn.scrollIntoViewIfNeeded().catch(() => {});
  await p.waitForTimeout(500);
  const box = await notisBtn.boundingBox();
  h.log('BOX', JSON.stringify(box));
  if (box) {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const stack = await p.evaluate(({ cx, cy }) => {
      return document.elementsFromPoint(cx, cy).slice(0, 5).map(el => ({
        tag: el.tagName, cls: (el.className || '').toString().slice(0, 90), text: el.textContent?.slice(0,40)
      }));
    }, { cx, cy });
    h.log('STACK', JSON.stringify(stack, null, 1));
  }
  await h.shot('m0-fore-diag-klick');
  await notisBtn.click({ timeout: 6000 }).catch((e) => h.log('KLICK_FEL', e.message.slice(0,200)));
  await p.waitForTimeout(1000);
  h.log('TEXT_EFTER', (await h.text()).slice(0, 200));

  // JS-klick som referens
  await notisBtn.evaluate(el => el.click());
  await p.waitForTimeout(1000);
  h.log('TEXT_EFTER_JS_KLICK', (await h.text()).slice(0, 200));
  await h.shot('m1-efter-js-klick');
};
