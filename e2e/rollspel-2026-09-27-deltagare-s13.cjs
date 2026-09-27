module.exports = async (p, h) => {
  p.on('response', async (r) => { if (r.url().includes('/profiles') && r.request().method() !== 'GET') { let b=''; try{b=(await r.text()).slice(0,200)}catch{}; console.log('PROF', r.request().method(), r.status(), b); } });
  await h.go('/settings');
  await p.getByLabel('Telefon').first().fill('070-000 00 00');
  await p.getByRole('button', { name: /Spara ändringar/ }).click();
  await p.waitForTimeout(3000);
  await h.shot('52-spara-profil', false);
  const t = await h.text(); console.log(t.slice(0, 600).replace(/\n+/g,' | '));
  const toast = await p.locator('[role=status], [role=alert], [data-sonner-toast]').allInnerTexts(); console.log('TOAST', toast);
};
