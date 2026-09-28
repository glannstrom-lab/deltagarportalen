module.exports = async (p, h) => {
  await h.go('/settings?section=privacy');
  await p.waitForTimeout(1500);
  const begarKnapp = p.getByRole('button', { name: /Begär radering av konto/i }).first();
  await begarKnapp.scrollIntoViewIfNeeded();
  await begarKnapp.click();
  await p.waitForTimeout(1000);
  const bekraftaKnapp = p.getByRole('button', { name: /^Begär radering$/i }).first();
  await bekraftaKnapp.click();
  await p.waitForTimeout(1500);
  await h.shot('115-radering-begard');
  h.log((await p.locator('main').innerText().catch(() => '')).slice(-1800));
};
