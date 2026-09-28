// Fatima 02 — språklägen: Lätt svenska, English, Google-översätt till arabiska.
module.exports = async (p, h) => {
  const oppnaSprakmeny = async () => {
    const knapp = p.getByRole('button', { name: /Välj språk/ }).first();
    await knapp.click({ timeout: 5000 }).catch(async () => {
      // Fallback: sista knappen i toppnaven med flagga (aria-label saknas ev).
      await p.locator('header button').last().click({ timeout: 5000 }).catch(() => {});
    });
    await p.waitForTimeout(400);
  };

  // 1) Lätt svenska på Ny i Sverige (internationell guide)
  await h.go('/international');
  await h.shot('10-international-svenska');
  await oppnaSprakmeny();
  await h.shot('11-sprakmeny-oppen');
  const lattKnapp = p.getByText('Lätt svenska', { exact: true }).first();
  if (await lattKnapp.count()) {
    await lattKnapp.click().catch(() => {});
    await p.waitForTimeout(1500);
  }
  await h.shot('12-international-latt-svenska');

  // 2) Samma test på Min vecka och Översikt i Lätt svenska
  await h.go('/min-vecka');
  await h.shot('13-min-vecka-latt-svenska');
  await h.go('/');
  await h.shot('14-oversikt-latt-svenska');

  // 3) English
  await oppnaSprakmeny();
  const enKnapp = p.getByText('English', { exact: true }).first();
  if (await enKnapp.count()) {
    await enKnapp.click().catch(() => {});
    await p.waitForTimeout(1500);
  }
  await h.shot('15-oversikt-english');
  await h.go('/international');
  await h.shot('16-international-english');
  await h.go('/min-vecka');
  await h.shot('17-min-vecka-english');
  await h.go('/cv');
  await h.shot('18-cv-english');

  // Knowledge base-artikel på engelska
  await h.go('/knowledge-base');
  await h.shot('19-kunskapsbank-english');
  const forstaArtikel = p.locator('a[href*="knowledge-base/article"]').first();
  if (await forstaArtikel.count()) {
    await forstaArtikel.click().catch(() => {});
    await p.waitForTimeout(1500);
    await h.shot('20-artikel-english');
  }

  // 4) Tillbaka till svenska, sedan Google-översätt till arabiska
  await oppnaSprakmeny();
  const svKnapp = p.getByText('Svenska', { exact: true }).first();
  if (await svKnapp.count()) {
    await svKnapp.click().catch(() => {});
    await p.waitForTimeout(1000);
  }
  await h.go('/international');
  await oppnaSprakmeny();
  const oversattKnapp = p.getByText(/Översätt sidan till fler språk|Översatt till/).first();
  if (await oversattKnapp.count()) {
    await oversattKnapp.click().catch(() => {});
    await p.waitForTimeout(400);
    await h.shot('21-oversatt-lista-oppen');
    const arabiska = p.getByText('العربية').first();
    if (await arabiska.count()) {
      await arabiska.click().catch(() => {});
      await p.waitForTimeout(3000);
    }
  }
  await h.shot('22-international-arabiska');
  await h.go('/min-vecka');
  await p.waitForTimeout(2000);
  await h.shot('23-min-vecka-arabiska');
  await h.go('/my-consultant');
  await p.waitForTimeout(2000);
  await h.shot('24-min-konsulent-arabiska');

  // Städa: visa originalsidan igen (Google), och sätt tillbaka i18n till svenska
  await oppnaSprakmeny();
  const visaOriginal = p.getByText(/Svenska \(utan översättning\)/).first();
  if (await visaOriginal.count()) {
    await visaOriginal.click().catch(() => {});
    await p.waitForTimeout(1500);
  }
};
