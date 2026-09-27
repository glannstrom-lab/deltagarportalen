module.exports = async (p, h) => {
  await h.go('/oversikt');
  console.log((await h.text()).slice(0, 1500).replace(/\n+/g,' | '));
  await h.shot('01-oversikt');
  const flagga = p.locator('header button').filter({ has: p.locator('img, svg') });
  const kandidater = await p.locator('header button, header a').evaluateAll(els => els.map(e => (e.getAttribute('aria-label')||'') + ' / ' + e.innerText.trim()));
  console.log('HEADER', kandidater);
  await p.getByRole('button', { name: /språk|language/i }).first().click();
  await p.waitForTimeout(1000);
  await h.shot('02-sprakval', false);
  console.log('MENY', await p.locator('[role=menu], [role=listbox], [role=dialog]').allInnerTexts());
};
