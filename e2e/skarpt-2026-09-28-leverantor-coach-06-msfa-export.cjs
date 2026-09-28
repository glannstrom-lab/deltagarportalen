// demo-leverantor@jobin.se — markerar "förd över till MSFA" (RR24), laddar
// ner CSV-rapporten (RR8/RK9) och plan-PDF för Jonas (RR2 — ska INTE säga
// socialtjänstlagen). Dator.
const fs = require('fs');
const path = require('path');

module.exports = async (p, h) => {
  // -- MSFA-markering: öppnas via "Underlag för rapporten" per deltagare --
  await h.go('/consultant/analytics');
  await h.shot('01-rapporter');
  const underlagJonas = p.getByRole('button', { name: /Underlag för rapporten.*Jonas Demo|Jonas Demo.*Underlag för rapporten/i }).first();
  const underlagKnapp = (await underlagJonas.count()) ? underlagJonas : p.getByRole('button', { name: /Underlag för rapporten/i }).first();
  if (await underlagKnapp.count()) {
    await underlagKnapp.click();
    await p.waitForTimeout(1200);
    await h.shot('01b-underlag-dialog-jonas');
  } else {
    h.log('INGEN-UNDERLAG-FOR-RAPPORTEN-KNAPP-HITTAD');
  }
  const msfaKnapp = p.getByRole('button', { name: /Markera som förd över till MSFA/i }).first();
  if (await msfaKnapp.count()) {
    await msfaKnapp.click();
    await p.waitForTimeout(1500);
    await h.shot('02-efter-msfa-markering');
  } else {
    h.log('INGEN-MSFA-MARKERA-KNAPP-HITTAD (kanske redan markerad, eller fel flik/period)');
    await h.shot('02b-msfa-knapp-saknas');
  }
  // Stäng ev. dialog innan vi går vidare till CSV-knappen på huvudsidan
  const stangKnapp = p.getByRole('button', { name: /Stäng/i }).first();
  if (await stangKnapp.count()) await stangKnapp.click().catch(() => {});
  await p.waitForTimeout(500);

  // -- CSV-export --
  const csvKnapp = p.getByRole('button', { name: /^CSV$/i }).first();
  if (await csvKnapp.count()) {
    const [download] = await Promise.all([
      p.waitForEvent('download', { timeout: 15000 }).catch(() => null),
      csvKnapp.click(),
    ]);
    if (download) {
      const savePath = path.join(h.UT, 'rapport-export.csv');
      await download.saveAs(savePath);
      const buf = fs.readFileSync(savePath);
      h.log('CSV-NEDLADDAD', savePath, buf.length, 'bytes');
      h.log('CSV-FORSTA-RADEN', buf.toString('utf8', 0, 120).replace(/\n/g, '\\n'));
    } else {
      h.log('CSV-INGEN-NEDLADDNING-HANDELSE');
    }
  } else {
    h.log('INGEN-CSV-KNAPP-HITTAD');
  }

  // -- Plan-PDF för Jonas --
  await h.go('/consultant/participants');
  await p.getByText('Jonas Demo', { exact: false }).first().click();
  await p.waitForTimeout(1500);
  const aktivitetFlik = p.getByRole('tab', { name: /Aktivitet/i }).first();
  await aktivitetFlik.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  if (await aktivitetFlik.count()) {
    await aktivitetFlik.click();
    await p.waitForTimeout(1200);
  } else {
    h.log('INGEN-AKTIVITET-FLIK-HITTAD');
  }
  await h.shot('03-jonas-aktivitet-fore-pdf');
  const planPdfKnapp = p.getByRole('button', { name: /Plan som PDF/i }).first();
  if (await planPdfKnapp.count()) {
    const [download] = await Promise.all([
      p.waitForEvent('download', { timeout: 15000 }).catch(() => null),
      planPdfKnapp.click(),
    ]);
    if (download) {
      const savePath = path.join(h.UT, 'aktivitetsplan-jonas.pdf');
      await download.saveAs(savePath);
      const buf = fs.readFileSync(savePath);
      h.log('PLAN-PDF-NEDLADDAD', savePath, buf.length, 'bytes');
      // jsPDF med standardteckensnitt komprimerar inte texten (ingen /FlateDecode
      // på textströmmarna som standard) — sök rått i bytes efter nyckelfraserna.
      const text = buf.toString('latin1');
      h.log('PDF-INNEHALLER-RUSTA-OCH-MATCHA', text.includes('Rusta och matcha'));
      h.log('PDF-INNEHALLER-SOCIALTJANSTLAGEN-SKA-VARA-FALSE', text.includes('socialtjnstlagen') || text.includes('socialtjänstlagen') || /socialtj.{0,3}nstlagen/.test(text));
      h.log('PDF-INNEHALLER-HANDLEDARE', text.includes('Handledare'));
    } else {
      h.log('PLAN-PDF-INGEN-NEDLADDNING-HANDELSE');
    }
  } else {
    h.log('INGEN-PLAN-SOM-PDF-KNAPP-HITTAD');
  }

  h.log('KLART: MSFA + CSV + plan-PDF.');
};
