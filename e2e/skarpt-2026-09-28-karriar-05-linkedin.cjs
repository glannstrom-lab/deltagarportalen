module.exports = async (p, h) => {
  await h.go('/linkedin-optimizer');
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
  await p.getByRole('button', { name: /Hoppa över/ }).click({ timeout: 2000 }).catch(() => {});
  await h.shot('50-linkedin-forst');

  // Rubrikgeneratorn — AI-förslag
  const jobbtitel = p.getByPlaceholder(/undersköterska, lagerarbetare, butikssäljare/);
  if (await jobbtitel.count()) {
    const varde = await jobbtitel.inputValue();
    if (!varde) await jobbtitel.fill('Ekonomiassistent');
  }
  const specialisering = p.getByPlaceholder(/demensvård, truckkort/);
  if (await specialisering.count()) await specialisering.fill('bokföring och Excel');

  await h.shot('51-rubrik-ifylld');
  const aiKnapp = p.getByRole('button', { name: /Skriv ett förslag med AI/ }).first();
  await aiKnapp.click();
  await p.waitForTimeout(15000);
  await h.shot('52-ai-forslag-rubrik');
  const t1 = await h.text();
  h.log('AI_FORSLAG_VISAS', /förslag|Ekonomiassistent/i.test(t1));

  // Checklistan — kryssa i två punkter och kolla att det sparas
  const checklistFlik = p.getByRole('button', { name: /Checklista/ });
  if (await checklistFlik.count()) {
    await checklistFlik.first().click();
    await p.waitForTimeout(500);
  }
  const forstaDel = p.getByRole('button', { name: /aria-expanded/ }); // no-op, placeholder
  await h.shot('53-checklista-forst');
  const forstaExpander = p.locator('button[aria-expanded]').first();
  if (await forstaExpander.count()) {
    await forstaExpander.click();
    await p.waitForTimeout(300);
    const forstaKryss = p.locator('button[role="checkbox"]').first();
    if (await forstaKryss.count()) {
      await forstaKryss.click();
      await p.waitForTimeout(1000);
    }
  }
  await h.shot('54-checklista-ikryssad');

  await p.reload();
  await p.waitForTimeout(2000);
  const expanderEfter = p.locator('button[aria-expanded]').first();
  if (await expanderEfter.count()) await expanderEfter.click();
  await p.waitForTimeout(300);
  await h.shot('55-checklista-efter-omladdning');
  const kryss2 = p.locator('button[role="checkbox"][aria-checked="true"]');
  h.log('CHECKLISTA_SPARAD', await kryss2.count());
  h.log('KLART sk-05-linkedin');
};
