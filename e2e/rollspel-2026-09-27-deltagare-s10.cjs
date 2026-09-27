module.exports = async (p, h) => {
  await h.go('/min-vecka');
  await h.shot('40-min-vecka');
  // tangentbord: första 25 tabbar
  await p.locator('body').click({ position: { x: 5, y: 400 } });
  const spar = [];
  for (let i = 0; i < 25; i++) {
    await p.keyboard.press('Tab');
    spar.push(await p.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); return (e.tagName + ' ' + (e.getAttribute('aria-label') || e.innerText || '').slice(0, 40).replace(/\n/g,' ') + ' | outline=' + cs.outlineStyle + ' ' + cs.outlineWidth + ' shadow=' + (cs.boxShadow !== 'none')); }));
  }
  console.log(spar.join('\n'));
  await h.shot('41-fokus', false);
  await h.go('/settings');
  console.log('SETTINGS', (await h.text()).slice(0, 1500).replace(/\n+/g, ' | '));
  await h.shot('42-installningar');
  const flikar = await p.getByRole('tab').allInnerTexts().catch(() => []);
  console.log('FLIKAR', flikar);
  for (const f of ['Tillgänglighet', 'Utseende', 'Integritet']) {
    const b = p.getByRole('tab', { name: new RegExp(f) }).or(p.getByRole('button', { name: new RegExp('^' + f) })).or(p.getByRole('link', { name: new RegExp('^' + f) }));
    if (await b.count()) { await b.first().click(); await p.waitForTimeout(1500); console.log('==', f, (await h.text()).slice(0, 1800).replace(/\n+/g, ' | ')); await h.shot('43-' + f); }
  }
  await h.go('/ai-team');
  const ta = p.locator('textarea').first();
  await ta.fill('Hur gör jag om jag är sjuk på ett pass?');
  await ta.press('Enter');
  await p.waitForTimeout(6000);
  await h.shot('44-ai-team-svar');
  const t = await h.text(); console.log('AI', t.slice(t.indexOf('Hur gör jag'), t.indexOf('Hur gör jag') + 700).replace(/\n+/g, ' | '));
  await h.go('/oversikt');
  await p.getByRole('button', { name: /Öppna stöd och hjälp/ }).click();
  await p.waitForTimeout(1500);
  await h.shot('45-krisstod', false);
  console.log('KRIS', (await p.locator('[role=dialog]').allInnerTexts()).join('\n').slice(0, 1500));
};
