module.exports = async (p, h) => {
  await h.go('/interview-simulator');
  await p.waitForTimeout(1500);
  await h.shot('90-intervju-start');
  h.log((await p.locator('main').innerText().catch(() => '')).slice(0, 1800));
};
