// Prestanda pa mobil med natverksstrypning (Fast 3G) via CDP, LCP-matning.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BAS = 'https://www.jobin.se';
const UT = path.join(__dirname, '..', 'docs', 'review-2026-09-28-rollspel', 'skarpt-publikt');
fs.mkdirSync(UT, { recursive: true });

// Fast 3G-profil (samma varden som Chrome DevTools "Fast 3G")
const FAST_3G = {
  offline: false,
  downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
  uploadThroughput: (750 * 1024) / 8, // 750 Kbps
  latency: 150,
};

async function matLCP(url, namn) {
  const b = await chromium.launch();
  const ctx = await b.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    locale: 'sv-SE',
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', FAST_3G);
  // CPU-strypning x4 (mobil-liknande)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  await page.addInitScript(() => {
    window.__lcp = 0;
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) window.__lcp = last.renderTime || last.loadTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {}
  });

  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 60000 }).catch((e) => console.log('GOTO-FEL', namn, e.message));
  const domLoadTid = Date.now() - t0;
  await page.waitForTimeout(3000); // lat LCP-observern hinna registrera
  const lcp = await page.evaluate(() => window.__lcp).catch(() => null);
  console.log(`${namn}: DOM-load=${domLoadTid}ms LCP(observer)=${lcp ? Math.round(lcp) + 'ms' : 'okänt'}`);

  await page.screenshot({ path: path.join(UT, `perf-${namn}.png`) }).catch(() => {});
  await b.close();
  return { url, namn, domLoadTid, lcp };
}

(async () => {
  const resultat = [];
  resultat.push(await matLCP(`${BAS}/`, 'start'));
  resultat.push(await matLCP(`${BAS}/guider/a-kassa-sa-fungerar-det/`, 'guide'));
  resultat.push(await matLCP(`${BAS}/#/login`, 'login'));
  fs.writeFileSync(path.join(UT, 'perf-resultat.json'), JSON.stringify(resultat, null, 2));
  console.log('KLART PERF');
})();
