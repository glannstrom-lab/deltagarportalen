const fs = require('fs');
const path = require('path');
module.exports = async (p, h) => {
  await h.go('/cv');
  await p.waitForTimeout(1500);
  await h.shot('15-cv-retry-start');
  // Stäng ev. onboarding-dialog om den syns
  const stang = p.getByRole('button', { name: /^stäng$|close/i }).first();
  if (await stang.count().then((c) => c > 0).catch(() => false)) {
    await stang.click().catch(() => {});
    await p.waitForTimeout(500);
  }
  await p.keyboard.press('Escape').catch(() => {});
  const exportBtn = p.getByRole('button', { name: /exportera pdf/i }).first();
  const finns = await exportBtn.count().then((c) => c > 0).catch(() => false);
  h.log('EXPORT-KNAPP SYNS PÅ /cv', finns);
  if (finns) {
    await exportBtn.scrollIntoViewIfNeeded().catch(() => {});
    const [download] = await Promise.all([
      p.waitForEvent('download', { timeout: 20000 }).catch((e) => ({ fel: String(e.message || e) })),
      exportBtn.click(),
    ]);
    const info = download && download.suggestedFilename ? { nedladdad: true, filnamn: download.suggestedFilename() } : { nedladdad: false, fel: download?.fel };
    h.log('RETRY EXPORT-RESULTAT', JSON.stringify(info));
    fs.writeFileSync(path.join(h.UT, 'txt', 'cv-export-retry.json'), JSON.stringify(info, null, 2), 'utf8');
  }
  await p.waitForTimeout(1500);
  await h.shot('16-cv-retry-efter');
};
