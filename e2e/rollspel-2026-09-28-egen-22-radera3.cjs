module.exports = async (p, h) => {
  await h.go('/settings?section=privacy');
  await p.waitForTimeout(1500);
  await h.shot('113-integritet-sektion');
  h.log((await p.locator('main').innerText().catch(() => '')).slice(-2500));
};
