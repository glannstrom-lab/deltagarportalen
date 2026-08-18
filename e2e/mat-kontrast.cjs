/**
 * Kontrastmätning mot WCAG 2.1 AA — med alfa-komposition.
 *
 *   node e2e/mat-kontrast.cjs /job-search /job-search/daily
 *   node e2e/mat-kontrast.cjs                 # sex flikar i Söka jobb
 *
 * Kräver dev-servern på :3000 och e2e/.auth/state.json.
 *
 * **Varför alfa-kompositionen finns:** första versionen läste
 * `getComputedStyle().backgroundColor` rakt av och behandlade
 * `rgba(42,26,10,0.3)` som ogenomskinlig. Följden var falska fel på varje yta
 * som använder `dark:bg-[var(--c-bg)]/30` — Dagens jobb rapporterade sju fel
 * som inte fanns, och fixlistan såg helt annorlunda ut än verkligheten. Nu
 * komponeras hela bakgrundsstacken ner till en ogenomskinlig färg först.
 *
 * Två fällor till, båda inbyggda i filtret nedan:
 *   · element utan synlig text (dekorativa prickar på 1,5 × 1,5 px) mättes och
 *     rapporterades som fel — därav minsta storlek och kravet på textinnehåll
 *   · 18 px fetstil är INTE "stor text" enligt WCAG (gränsen går vid 18,66 px),
 *     så kravet är 4,5:1 där, inte 3:1
 */
const { chromium } = require('@playwright/test')

const MAT = `
(() => {
  const parse = (f) => {
    const m = f.match(/[\\d.]+/g);
    if (!m) return [255, 255, 255, 1];
    const [r, g, b, a] = m.map(Number);
    return [r, g, b, a === undefined ? 1 : a];
  };
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const tillRgb = (f) => {
    if (/^rgba?\\(/.test(f)) return parse(f);
    ctx.fillStyle = '#000'; ctx.fillStyle = f;
    ctx.clearRect(0, 0, 1, 1); ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  /** Kompositerar elementets bakgrundsstack ner till en ogenomskinlig färg. */
  const effektivBg = (el) => {
    const lager = [];
    let n = el;
    while (n) { lager.push(tillRgb(getComputedStyle(n).backgroundColor)); n = n.parentElement; }
    lager.push([255, 255, 255, 1]);
    let ut = null;
    for (let i = lager.length - 1; i >= 0; i--) {
      const [r, g, b, a] = lager[i];
      if (a === 0) continue;
      ut = ut === null ? [r, g, b] : [
        r * a + ut[0] * (1 - a), g * a + ut[1] * (1 - a), b * a + ut[2] * (1 - a),
      ];
    }
    return ut || [255, 255, 255];
  };
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const kontrast = (a, b) => { const l1 = lum(a), l2 = lum(b); const [h, l] = l1 > l2 ? [l1, l2] : [l2, l1]; return +((h + 0.05) / (l + 0.05)).toFixed(2); };

  const ut = [];
  for (const el of document.querySelectorAll('main h1, main h2, main h3, main p, main span, main button, main a, main label')) {
    const t = (el.textContent || '').trim();
    if (!t) continue;
    if (el.querySelector('h1,h2,h3,p,span,button,a,label')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const px = parseFloat(cs.fontSize);
    const fet = parseInt(cs.fontWeight, 10) >= 700;
    const krav = px >= 24 || (px >= 18.66 && fet) ? 3 : 4.5;
    const fram = tillRgb(cs.color);
    const k = kontrast([fram[0], fram[1], fram[2]], effektivBg(el));
    if (k < krav) ut.push({ txt: t.slice(0, 24), k, krav, px: Math.round(px), klass: (el.className || '').toString().slice(0, 55) });
  }
  const sett = new Set(); const unika = [];
  for (const r of ut) { const n = r.txt + r.k; if (!sett.has(n)) { sett.add(n); unika.push(r); } }
  return unika;
})()
`

;(async () => {
  const b = await chromium.launch()
  const argv = process.argv.slice(2)
  const flikar = argv.length
    ? argv.map((r) => [r.replace(/^\//, '').replace(/\//g, '-') || 'rot', r.startsWith('/') ? r : '/' + r])
    : [['sok', '/job-search'], ['dagens', '/job-search/daily'], ['slumpjobbet', '/job-search/slumpjobbet'], ['sparade', '/job-search/saved'], ['bevakningar', '/job-search/alerts'], ['matchningar', '/job-search/matches']]
  let fel = 0
  for (const lage of ['light', 'dark']) {
    const c = await b.newContext({ viewport: { width: 1440, height: 900 }, storageState: 'e2e/.auth/state.json', colorScheme: lage })
    const p = await c.newPage()
    console.log('\n══ ' + lage.toUpperCase() + ' ══')
    for (const [namn, rutt] of flikar) {
      await p.goto('http://localhost:3000/#' + rutt, { waitUntil: 'domcontentloaded' })
      await p.waitForTimeout(3000)
      const res = await p.evaluate(MAT)
      fel += res.length
      console.log(namn.padEnd(12), String(res.length).padStart(2) + ' fel',
        res.length ? JSON.stringify(res.slice(0, 4).map((r) => r.txt + '=' + r.k)) : '')
      if (res.length) for (const r of res.slice(0, 4)) console.log('      ', r.k, '|', r.klass)
    }
    await c.close()
  }
  await b.close()
  console.log(`
Summa: ${fel} kontrastfel`)
  process.exitCode = fel > 0 ? 1 : 0
})()
