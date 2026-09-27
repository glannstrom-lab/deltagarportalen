const V = [['cv','/cv'],['jobbsok','/job-search'],['ansokningar','/applications'],['sparade','/resources'],['dagbok','/diary'],['halsa','/wellness'],['profil','/profile'],['installningar','/settings'],['jobb-hub','/jobb'],['vardag-hub','/min-vardag'],['historik','/oversikt/historik'],['brev','/cover-letter'],['ai-team','/ai-team'],['hjalp','/help']];
module.exports = async (p, h) => {
  for (const [n, v] of V) {
    await h.go(v);
    const t = await h.shot('20-' + n);
    const m = await h.text();
    console.log('=====', n, '\n', m.slice(0, 1400).replace(/\n+/g, ' | '));
  }
  // notiser
  await h.go('/oversikt');
  await p.getByRole('button', { name: /notis|Notifikation/i }).first().click().catch(()=>{});
  await p.waitForTimeout(1500);
  const t = await h.shot('21-notiser', false);
};
