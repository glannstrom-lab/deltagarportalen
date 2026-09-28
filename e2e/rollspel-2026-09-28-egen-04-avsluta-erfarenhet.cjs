module.exports = async (p, h) => {
  if (p.url() === 'about:blank') await h.go('/cv');
  await p.waitForTimeout(1200);
  const stegCirkel4 = p.getByRole('button', { name: /steg 4/i }).first();
  if (await stegCirkel4.count()) { await stegCirkel4.click(); await p.waitForTimeout(1000); }
  await h.shot('40-erfarenhet-status');
  const klarKnapp = p.getByRole('button', { name: /^Klar$/i }).first();
  if (await klarKnapp.count()) {
    await klarKnapp.click();
    await p.waitForTimeout(1200);
    h.log('Klickade Klar på erfarenhetskortet');
  } else {
    h.log('Ingen "Klar"-knapp hittad — formuläret kanske redan var stängt');
  }
  await h.shot('41-efter-klar');
  h.log('Status-text:', (await p.locator('main').innerText().catch(() => '')).slice(0, 200));

  // Exportera PDF på nytt, nu när posten är stängd/sparad
  const tPdf = Date.now();
  const exportKnapp = p.getByRole('button', { name: /Exportera PDF/i }).first();
  if (await exportKnapp.count()) {
    const nedladdning = p.waitForEvent('download', { timeout: 20000 }).catch(() => null);
    await exportKnapp.click();
    const dl = await nedladdning;
    if (dl) {
      await dl.saveAs(`${h.UT}/bengt-cv-mobil-2.pdf`);
      h.log('PDF #2 nedladdad på ms', Date.now() - tPdf);
    } else {
      h.log('INGEN nedladdning #2 triggades.');
    }
  }
  await p.waitForTimeout(1000);
  await h.shot('42-efter-pdf-export-2');
};
