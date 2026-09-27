const { AxeBuilder } = require('@axe-core/playwright');
const V = [['min-vecka','/min-vecka'],['konsulent','/my-consultant'],['oversikt','/oversikt'],['cv','/cv'],['halsa','/wellness'],['dagbok','/diary']];
module.exports = async (p, h) => {
  for (const [n, v] of V) {
    await h.go(v);
    await h.shot('30-' + n);
    const r = await new AxeBuilder({ page: p }).withTags(['wcag2a','wcag2aa']).analyze();
    for (const x of r.violations) console.log(n, x.id, x.impact, x.nodes.length, x.nodes.slice(0,3).map(q => q.target.join(' ') + ' :: ' + (q.any[0]?.message||'').slice(0,120)).join(' || '));
  }
};
