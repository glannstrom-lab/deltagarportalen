module.exports = async (p, h) => {
  if (p.url() === 'about:blank') await h.go('/cv');
  await p.waitForTimeout(1500);
  // Gå till steg 2
  const stegCirkel2 = p.getByRole('button', { name: /steg 2/i }).first();
  if (await stegCirkel2.count()) { await stegCirkel2.click(); await p.waitForTimeout(1000); }
  const info = await p.evaluate(() => {
    const inputs = [...document.querySelectorAll('input, label')];
    return inputs.map(el => ({
      tag: el.tagName,
      id: el.id,
      forAttr: el.getAttribute('for'),
      name: el.getAttribute('name'),
      value: el.tagName === 'INPUT' ? el.value : el.textContent?.trim().slice(0,40),
      ariaLabel: el.getAttribute('aria-label'),
    }));
  });
  h.log(JSON.stringify(info, null, 2));
};
