module.exports = async (p, h) => {
  await h.go('/linkedin-optimizer');
  const checklistFlik = p.getByRole('button', { name: /Checklista/ });
  await checklistFlik.first().click();
  await p.waitForTimeout(800);
  await h.shot('56-checklista-flik');

  const forstaKryss = p.locator('button[role="checkbox"]').first();
  await forstaKryss.scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  await forstaKryss.click({ force: true, timeout: 5000 });
  await p.waitForTimeout(1200);
  await h.shot('57-efter-krysskklick');
  const forstaChecked = await forstaKryss.getAttribute('aria-checked');
  h.log('FORSTA_KRYSS_IKRYSSAD', forstaChecked);

  await p.reload();
  await p.waitForTimeout(2000);
  const checklistFlik2 = p.getByRole('button', { name: /Checklista/ });
  if (await checklistFlik2.count()) await checklistFlik2.first().click();
  await p.waitForTimeout(800);
  await h.shot('58-checklista-efter-omladdning');
  const forstaKryss2 = p.locator('button[role="checkbox"]').first();
  const checkedEfter = await forstaKryss2.getAttribute('aria-checked').catch(() => 'okänt');
  h.log('KRYSS_SPARAT_EFTER_OMLADDNING', checkedEfter);
  h.log('KLART sk-05b');
};
