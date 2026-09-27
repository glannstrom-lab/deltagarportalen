const V = [['oversikt','/oversikt'],['min-vecka','/min-vecka'],['konsulent','/my-consultant'],['vardag','/min-vardag'],['cv','/cv'],['jobbsok','/job-search'],['installningar','/settings'],['profil','/profile'],['hjalp','/help']];
module.exports = async (p, h) => {
  p.on('response', async (r) => { if (r.status() >= 500) { let b=''; try{b=(await r.text()).slice(0,250)}catch{}; console.log('HTTP', r.status(), r.url().slice(0,200), b); } });
  const sprak = process.env.RS_SPRAK || 'Lätt svenska';
  await h.go('/oversikt');
  await p.getByRole('button', { name: /Välj språk|Choose language|language/i }).first().click();
  await p.waitForTimeout(600);
  await p.getByRole('menuitem', { name: sprak }).or(p.getByRole('menuitemradio', { name: sprak })).or(p.getByRole('option', { name: sprak })).or(p.getByRole('button', { name: sprak })).first().click();
  await p.waitForTimeout(2500);
  const tag = sprak === 'English' ? 'en' : 'latt';
  for (const [n, v] of V) {
    await h.go(v);
    await h.shot(`${tag}-${n}`);
    console.log('=====', n, '\n', (await h.text()).slice(0, 1600).replace(/\n+/g, ' | '));
  }
};
