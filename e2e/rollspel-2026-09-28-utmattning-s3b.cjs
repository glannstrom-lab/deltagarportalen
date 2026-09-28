module.exports = async (p, h) => {
  await h.go('/wellness');
  await p.waitForTimeout(9000);
  await h.shot('12-halsa-efter-reload-kolla-tufft');
  const text = await p.locator('main').innerText().catch(() => '');
  h.log('SPARAT HUMOR KVARSTAR?', text.slice(0, 800));
};
