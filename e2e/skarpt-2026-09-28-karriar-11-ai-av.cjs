module.exports = async (p, h) => {
  await h.go('/settings?section=privacy');
  await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
  await h.shot('100-installningar-integritet');

  const pausaKnapp = p.getByRole('button', { name: /Pausa AI/ });
  if (await pausaKnapp.count()) {
    await pausaKnapp.click();
    await p.waitForTimeout(2000);
    await h.shot('101-efter-pausa-ai');
    const t = await h.text();
    h.log('VISAR_PAUSAD_STATUS', /AI-funktioner är pausade/.test(t));
  } else {
    h.log('INGEN PAUSA AI-KNAPP HITTADES');
  }

  // AI-teamssidan: ska visa spärr, inte chattfältet
  await h.go('/ai-team');
  await p.waitForTimeout(1500);
  await h.shot('102-aiteam-med-ai-av');
  const t2 = await h.text();
  h.log('AITEAM_VISAR_SPARR', /pausat|Slå på AI|inte tillgänglig|AI är av/i.test(t2));
  h.log('AITEAM_VISAR_CHATTFALT', await p.getByPlaceholder(/Skriv meddelande/).count() > 0);

  // Sidopanelen (rådgivarna) på en annan sida — ska den vara klickbar men
  // göra ingenting (UT3), eller vara borttagen/inaktiverad helt?
  await h.go('/skills-gap-analysis');
  await p.waitForTimeout(1500);
  await h.shot('103-radgivarpanel-med-ai-av');
  const fragaDjupare = p.getByText(/Fråga djupare i AI-team/);
  if (await fragaDjupare.count()) {
    h.log('RADGIVARLANK_FRAGA_DJUPARE_SYNS_TROTS_AI_AV', true);
    await fragaDjupare.first().click();
    await p.waitForTimeout(1500);
    await h.shot('104-efter-klick-fraga-djupare');
    const t3 = await h.text();
    h.log('EFTER_KLICK_VISAR_SPARR', /pausat|Slå på AI|inte tillgänglig/i.test(t3));
    h.log('EFTER_KLICK_VISAR_CHATTFALT', await p.getByPlaceholder(/Skriv meddelande/).count() > 0);
  } else {
    h.log('RADGIVARLANK_FRAGA_DJUPARE_SYNS_TROTS_AI_AV', false);
  }
  h.log('KLART sk-11-ai-av');
};
