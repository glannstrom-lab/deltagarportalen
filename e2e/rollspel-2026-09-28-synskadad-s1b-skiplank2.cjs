const fs = require('fs');
const path = require('path');
module.exports = async (p, h) => {
  await h.go('/oversikt');
  await p.keyboard.press('Tab'); // 1: Hoppa till huvudinnehåll
  await p.keyboard.press('Tab'); // 2: Hoppa till navigation
  const fokusForeEnter = await p.evaluate(() => (document.activeElement ? { tag: document.activeElement.tagName, text: (document.activeElement.textContent || '').trim() } : null));
  await p.keyboard.press('Enter');
  await p.waitForTimeout(400);
  const fokusEfterEnter = await p.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    return { tag: el.tagName, id: el.id, ariaLabel: el.getAttribute('aria-label'), roleAttr: el.getAttribute('role'), text: (el.textContent || '').trim().slice(0, 80) };
  });
  const ut = { fokusForeEnter, fokusEfterEnter };
  fs.writeFileSync(path.join(h.UT, 'txt', 'skiplank2-hoppa-till-navigation.json'), JSON.stringify(ut, null, 2), 'utf8');
  h.log('SKIPLÄNK 2 (Hoppa till navigation)', JSON.stringify(ut));
};
