module.exports = async (p, h) => {
  await h.go('/job-search');
  await p.waitForTimeout(2000);
  await h.shot('50-jobbsok-start');
  h.log((await p.locator('main').innerText().catch(() => '')).slice(0, 1500));
};
