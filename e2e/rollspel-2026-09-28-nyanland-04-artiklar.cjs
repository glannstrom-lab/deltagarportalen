// Fatima 04 — direkt till aktivitetskravs-/försörjningsstödsartiklarna, sv/en, plus mörkt läge check.
module.exports = async (p, h) => {
  // Säkerställ svenska (sessionen kan ha legat kvar på engelska från tidigare körning).
  const knapp = p.getByRole('button', { name: /Välj språk|Select language/ }).first();
  await h.go('/oversikt');
  if (await knapp.count()) {
    await knapp.click().catch(() => {});
    await p.waitForTimeout(300);
    const sv = p.getByText('Svenska', { exact: true }).first();
    if (await sv.count()) { await sv.click().catch(() => {}); await p.waitForTimeout(1200); }
  }

  await h.go('/knowledge-base/article/aktivitetskrav-forsorjningsstod');
  await h.shot('40-aktivitetskrav-svenska');

  await h.go('/knowledge-base/article/lattsvenska-forsorjningsstod');
  await h.shot('41-lattsvenska-forsorjningsstod-svenska');

  await h.go('/knowledge-base/article/sjuklon-karens-och-vab');
  await h.shot('42-vab-svenska');

  // Byt till English och läs samma tre
  const knapp2 = p.getByRole('button', { name: /Välj språk|Select language/ }).first();
  if (await knapp2.count()) {
    await knapp2.click().catch(() => {});
    await p.waitForTimeout(300);
    const en = p.getByText('English', { exact: true }).first();
    if (await en.count()) { await en.click().catch(() => {}); await p.waitForTimeout(1200); }
  }
  await h.go('/knowledge-base/article/aktivitetskrav-forsorjningsstod');
  await h.shot('43-aktivitetskrav-english');
  await h.go('/knowledge-base/article/lattsvenska-forsorjningsstod');
  await h.shot('44-lattsvenska-forsorjningsstod-english');
  await h.go('/knowledge-base/article/sjuklon-karens-och-vab');
  await h.shot('45-vab-english');

  // Tillbaka till svenska för nästa körning (mörkt läge)
  const knapp3 = p.getByRole('button', { name: /Välj språk|Select language/ }).first();
  if (await knapp3.count()) {
    await knapp3.click().catch(() => {});
    await p.waitForTimeout(300);
    const sv2 = p.getByText('Svenska', { exact: true }).first();
    if (await sv2.count()) { await sv2.click().catch(() => {}); await p.waitForTimeout(1200); }
  }
};
