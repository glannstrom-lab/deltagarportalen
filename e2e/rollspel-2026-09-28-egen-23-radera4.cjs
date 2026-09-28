module.exports = async (p, h) => {
  await h.go('/settings?section=privacy');
  await p.waitForTimeout(1500);
  const begarKnapp = p.getByRole('button', { name: /Begär radering av konto/i }).first();
  await begarKnapp.scrollIntoViewIfNeeded();
  await begarKnapp.click();
  await p.waitForTimeout(1000);
  await h.shot('114-bekrafta-dialog');
  h.log((await p.locator('body').innerText().catch(() => '')).slice(-2000));
};
