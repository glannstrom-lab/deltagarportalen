// Rollspel 2026-09-28 — gemensam körare för alla roller (konsulent, chef, handläggare, företag, deltagare).
// Körning: RS_SCRATCH=<dir> node e2e/rollspel-2026-09-28.cjs <roll> <epost> <m|d> <stegfil.cjs> [dark] [start-sökväg]
// <roll> blir mapp och filprefix under docs/review-2026-09-28-rollspel/<roll>/.
// Stegfilen exporterar async (p, h) => {}. Sessionen sparas per e-post i RS_SCRATCH (50 min),
// så att en engångslänk (admin generate_link, service role i RS_SCRATCH/sr.txt) räcker per konto och timme.
// Nätverksfel (>=400) mot supabase/api loggas i <roll>/natverk.txt.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const S = process.env.RS_SCRATCH;
const BAS = process.env.BAS || 'https://www.jobin.se';

async function hash(epost) {
  const sr = fs.readFileSync(path.join(S, 'sr.txt'), 'utf8').trim();
  const url = fs.readFileSync(path.join(S, 'url.txt'), 'utf8').trim();
  const r = await fetch(`${url}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: { apikey: sr, Authorization: `Bearer ${sr}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', email: epost }),
  });
  const d = await r.json();
  return d.hashed_token || d.properties?.hashed_token;
}

(async () => {
  const [roll, epost, vy, stegfil, tema, start] = process.argv.slice(2);
  const UT = path.join(__dirname, '..', 'docs', 'review-2026-09-28-rollspel', roll);
  fs.mkdirSync(path.join(UT, 'txt'), { recursive: true });
  const statefil = path.join(S, `state-${epost.replace(/[^a-z0-9]/gi, '_')}.json`);
  const farsk = fs.existsSync(statefil) && Date.now() - fs.statSync(statefil).mtimeMs < 50 * 60 * 1000;
  const viewport = vy === 'm' ? { width: 390, height: 844 } : { width: 1366, height: 900 };
  const b = await chromium.launch();
  const opts = { viewport, locale: 'sv-SE', timezoneId: 'Europe/Stockholm', colorScheme: tema === 'dark' ? 'dark' : 'light', acceptDownloads: true };
  if (vy === 'm') Object.assign(opts, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const ctx = await b.newContext(farsk ? { ...opts, storageState: statefil } : opts);
  const p = await ctx.newPage();
  const konsol = [];
  p.on('console', (m) => { if (m.type() === 'error') konsol.push(m.text().slice(0, 200)); });
  p.on('response', (r) => {
    if (r.status() >= 400 && /supabase\.co|\/api\//.test(r.url())) {
      fs.appendFileSync(path.join(UT, 'natverk.txt'), `${new Date().toISOString()} ${r.request().method()} ${r.status()} ${r.url().slice(0, 200)}\n`);
    }
  });
  if (!farsk) {
    const th = await hash(epost);
    await p.goto(`${BAS}/#/visa-som?t=${th}&e=${encodeURIComponent(epost)}&till=${encodeURIComponent(start || '/')}`);
    await p.waitForTimeout(8000);
    await p.getByRole('button', { name: /Endast nödvändiga/ }).click().catch(() => {});
    await p.waitForTimeout(1000);
    await ctx.storageState({ path: statefil });
  }
  const pref = `${vy}${tema === 'dark' ? '-dark' : ''}`;
  const h = {
    UT, BAS,
    async go(vag) {
      await p.goto(`${BAS}/#${vag}`);
      await p.waitForFunction(() => !/Laddar/.test(document.querySelector('main')?.innerText || 'Laddar'), null, { timeout: 30000 }).catch(() => {});
      await p.getByRole('button', { name: /Endast nödvändiga/ }).click({ timeout: 1500 }).catch(() => {});
      await p.waitForTimeout(2000);
    },
    async shot(namn, full = true) {
      const f = path.join(UT, `${pref}-${namn}.png`);
      await p.screenshot({ path: f, fullPage: full });
      const txt = await p.locator('body').innerText().catch(() => '');
      fs.writeFileSync(path.join(UT, 'txt', `${pref}-${namn}.txt`), txt);
      console.log('SHOT', `${pref}-${namn}`, txt.length);
      return txt;
    },
    async text() { return p.locator('main').innerText().catch(() => ''); },
    log: (...a) => console.log(...a),
  };
  try {
    await require(path.resolve(stegfil))(p, h);
  } catch (e) {
    console.log('FEL', e.message.slice(0, 500));
    await p.screenshot({ path: path.join(UT, `${pref}-FEL.png`) }).catch(() => {});
  }
  if (konsol.length) console.log('KONSOLFEL', [...new Set(konsol)].slice(0, 10).join('\n'));
  await ctx.storageState({ path: statefil }).catch(() => {});
  await b.close();
})();
