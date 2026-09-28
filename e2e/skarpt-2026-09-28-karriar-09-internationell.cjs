module.exports = async (p, h) => {
  const flikar = [
    ['/international', '90-internationell-validering'],
    ['/international/integration', '91-internationell-integration'],
    ['/international/language', '92-internationell-sprak'],
  ];
  for (const [vag, namn] of flikar) {
    await h.go(vag);
    await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
    await h.shot(namn);
  }
  const t = await h.text();
  h.log('NAMNER_BELOPP', /\d[\s ]?\d{3}\s?kr|kronor/i.test(t));
  h.log('KLART sk-09');
};
