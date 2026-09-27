module.exports = async (p, h) => {
  await h.go('/settings');
  await p.locator('main button').filter({ hasText: /^s*Profils*$/ }).first().click().catch(()=>{}); await p.waitForTimeout(600); await p.getByRole('button', { name: /Tillgänglighet/ }).first().click();
  await p.waitForTimeout(1000);
  const st = p.getByRole('switch', { name: /Större text/ }).or(p.getByRole('checkbox', { name: /Större text/ }));
  console.log('switchar', await p.getByRole('switch').count());
  if (await st.count()) await st.first().setChecked(!(await st.first().isChecked()), { force: true }); else await p.getByText('Större text').click();
  await p.waitForTimeout(1500);
  await h.shot('50-storre-text-inst', false);
  for (const [n, v] of [['min-vecka','/min-vecka'],['konsulent','/my-consultant'],['oversikt','/oversikt'],['cv','/cv']]) {
    await h.go(v);
    const bred = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, fs: getComputedStyle(document.documentElement).fontSize, over: [...document.querySelectorAll('main *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > window.innerWidth + 1 && r.width > 0 && getComputedStyle(e).position !== 'fixed'; }).slice(0,4).map(e => e.tagName + '.' + (e.className||'').toString().slice(0,50) + ' ' + (e.innerText||'').slice(0,30)) }));
    console.log(n, JSON.stringify(bred));
    await h.shot('51-storre-' + n, false);
  }
  // tillbaka
  await h.go('/settings');
  await p.locator('main button').filter({ hasText: /^s*Profils*$/ }).first().click().catch(()=>{}); await p.waitForTimeout(600); await p.getByRole('button', { name: /Tillgänglighet/ }).first().click();
  await p.waitForTimeout(800);
  if (await st.count()) await st.first().setChecked(!(await st.first().isChecked()), { force: true }); else await p.getByText('Större text').click();
};
