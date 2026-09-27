module.exports = async (p, h) => {
  p.on('response', async (r) => { if (r.status() >= 400) { let b=''; try { b = (await r.text()).slice(0,300);} catch{}; console.log('HTTP', r.status(), r.request().method(), r.url().slice(0,140), b); } });
  await h.go('/my-consultant');
  const f = p.getByPlaceholder(/Skriv ett meddelande/);
  await f.scrollIntoViewIfNeeded();
  await f.fill('Hej! Jag är sjuk i morgon förmiddag. Gäller vårt möte kl 12 ändå?');
  await h.shot('15-meddelande-skrivet', false);
  await f.press('Enter');
  await p.waitForTimeout(3500);
  const sek = p.locator('section, div').filter({ hasText: /^Meddelanden/ }).first();
  await h.shot('16-meddelande-skickat', false);
  const t = await h.text();
  console.log(t.slice(t.indexOf('Meddelanden'), t.indexOf('Meddelanden') + 600));
};
