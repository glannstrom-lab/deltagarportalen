module.exports = async (p, h) => {
  await h.go('/oversikt');
  await p.waitForTimeout(2000);
  await h.shot('99-oversikt-efter-allt');
  h.log((await p.locator('main').innerText().catch(() => '')).slice(0, 2000));
};
