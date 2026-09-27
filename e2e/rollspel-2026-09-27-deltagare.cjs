// Rollspel deltagare 2026-09-27 — Anna (aktivitetskrav) och Sara (R&M).
// Körning: node e2e/rollspel-2026-09-27-deltagare.cjs <anna|sara> <m|d> <stegfil.cjs> [dark]
// Stegfilen exporterar async (p, h) => {}. Sessionen sparas i scratchpad (storageState)
// så att en engångslänk räcker per konto och timme.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const S = process.env.RS_SCRATCH;
const UT = path.join(__dirname, '..', 'docs', 'review-2026-09-27-rollspel', 'deltagare');
const EPOST = { anna: 'anna.exempel@example.com', sara: 'sara.exempel@example.com' };

async function hash(epost) {
  const sr = fs.readFileSync(path.join(S, 'sr.txt'), 'utf8').trim();
  const url = fs.readFileSync(path.join(S, 'url.txt'), 'utf8').trim();
  const r = await fetch(`${url}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: { apikey: sr, Authorization: `Bearer ${sr}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', email: epost }),
  });
  const d = await r.json();
  return d.hashed_token || d.properties.hashed_token;
}

(async () => {
  const [vem, vy, stegfil, tema] = process.argv.slice(2);
  const epost = EPOST[vem];
  const statefil = path.join(S, `state-${vem}.json`);
  const viewport = vy === 'm' ? { width: 390, height: 844 } : { width: 1366, height: 900 };
  const b = await chromium.launch();
  const opts = { viewport, locale: 'sv-SE', timezoneId: 'Europe/Stockholm', colorScheme: tema === 'dark' ? 'dark' : 'light', acceptDownloads: true };
  if (vy === 'm') Object.assign(opts, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  let ctx;
  if (fs.existsSync(statefil) && Date.now() - fs.statSync(statefil).mtimeMs < 50 * 60 * 1000) {
    ctx = await b.newContext({ ...opts, storageState: statefil });
  } else {
    ctx = await b.newContext(opts);
  }
  const p = await ctx.newPage();
  const konsol = [];
  p.on('console', (m) => { if (m.type() === 'error') konsol.push(m.text().slice(0, 200)); });
  if (!fs.existsSync(statefil) || Date.now() - fs.statSync(statefil).mtimeMs >= 50 * 60 * 1000) {
    const th = await hash(epost);
    await p.goto(`https://www.jobin.se/#/visa-som?t=${th}&e=${encodeURIComponent(epost)}&till=%2F`);
    await p.waitForTimeout(8000);
    await p.getByRole('button', { name: /Endast nödvändiga/ }).click().catch(() => {});
    await p.waitForTimeout(1000);
    await ctx.storageState({ path: statefil });
  }
  const pref = `${vem}-${vy}${tema === 'dark' ? '-dark' : ''}`;
  const h = {
    UT,
    async go(vag) {
      await p.goto(`https://www.jobin.se/#${vag}`);
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
  fs.mkdirSync(path.join(UT, 'txt'), { recursive: true });
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
