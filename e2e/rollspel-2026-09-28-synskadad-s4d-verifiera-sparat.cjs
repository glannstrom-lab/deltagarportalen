module.exports = async (p, h) => {
  await h.go('/cv');
  await p.waitForTimeout(1000);
  const fullstandig = p.getByRole('link', { name: /fullständiga CV-byggaren/i }).or(p.getByRole('button', { name: /fullständiga CV-byggaren/i })).first();
  if (await fullstandig.count().then((c) => c > 0).catch(() => false)) {
    await fullstandig.click();
    await p.waitForTimeout(1500);
  }
  await p.keyboard.press('Escape').catch(() => {}); // stäng ev. tour
  const erfFlik = p.getByRole('button', { name: /^erfarenhet$/i }).first();
  if (await erfFlik.count().then((c) => c > 0).catch(() => false)) {
    await erfFlik.click().catch(() => {});
    await p.waitForTimeout(1000);
  }
  const txt = await h.shot('17-cv-verifiera-erfarenhet');
  console.log(txt.slice(0, 3000));

  // Exportknappen — klicka utan tangentbordsfokus-omväg, ren mus-klick för att
  // isolera om FEL FÖRRA GÅNGEN berodde på fokusövergången eller på servern.
  const exportBtn = p.getByRole('button', { name: /exportera pdf/i }).first();
  if (await exportBtn.count().then((c) => c > 0).catch(() => false)) {
    await exportBtn.scrollIntoViewIfNeeded().catch(() => {});
    const [download] = await Promise.all([
      p.waitForEvent('download', { timeout: 20000 }).catch((e) => ({ fel: String(e.message || e) })),
      exportBtn.click(),
    ]);
    const info = download && download.suggestedFilename ? { nedladdad: true, filnamn: download.suggestedFilename() } : { nedladdad: false, fel: download?.fel };
    h.log('VERIFIERA EXPORT-RESULTAT', JSON.stringify(info));
  }
  await p.waitForTimeout(1500);
  await h.shot('18-cv-verifiera-efter-export');
};
