/**
 * Lighthouse CI — HELA konfigurationen bor här, inte i `ci.yml`.
 *
 * ## Varför allt flyttades hit 2026-08-22 (ROADMAP DR4)
 *
 * Workflowen skickade tio CLI-flaggor som dubblerade och skuggade den här
 * filen. Följden var att ingen kunde läsa ut vad som faktiskt gällde, och
 * `CLAUDE.md` bar en diagnos som visade sig vara fel: att
 * `--collect.staticDistDir` som CLI-flagga skulle få lhci att ignorera
 * `url:`-listan nedan och bara auditera `index.html`.
 *
 * Uppmätt 2026-08-22 genom att köra exakt CI:s flaggsats lokalt:
 *
 *     ✅ .lighthouseci/ directory writable
 *     ✅ Configuration file found
 *     ✅ Chrome installation found
 *     Running Lighthouse 1 time(s) on http://localhost:65061/index.html
 *
 * Filen LÄSES alltså, och `url:`-listan gäller — körningen startade på
 * listans första post, inte på `guider/a-kassa.../index.html` som
 * autodiscovery i bokstavsordning hade gett. Argumentparsningen är också
 * frisk: healthcheck passerade innan Chrome startade. Den gamla diagnosen är
 * struken.
 *
 * ## Vad som faktiskt är fel — ärligt läge
 *
 * Jobbet har aldrig varit grönt sedan 2 april, och felet syns bara som
 * "No files were found with the provided path: .lighthouseci", alltså att
 * `collect` dog innan något skrevs. Det gick INTE att reproducera lokalt:
 * på Windows faller körningen på ett `EPERM` när chrome-launcher städar sin
 * temp-katalog — ett plattformsfel som inte finns på Ubuntu. Rapporten som
 * ändå producerades hade `runtimeError: false` och inga `runWarnings`, så
 * själva mätningen fungerar.
 *
 * `@lhci/cli` saknar try/catch i sin collect-loop: vilken som helst
 * nollskild exitkod från lighthouse-barnprocessen — även ett städningsfel
 * EFTER en lyckad mätning — avbryter hela körningen och lämnar
 * `.lighthouseci/` tom. Symptomet är alltså detsamma oavsett orsak, vilket
 * är varför det tagit fem månader.
 *
 * `chromeFlags` nedan är den mest sannolika Ubuntu-orsaken: GitHub-runnerns
 * `/dev/shm` är 64 MB, och Chrome kraschar under minnestryck utan
 * `--disable-dev-shm-usage`. Det är en hypotes, inte en mätning — nästa
 * körning avgör. Steget i `ci.yml` skriver numera ut innehållet i
 * `.lighthouseci/` när det faller, så nästa gång finns det något att läsa.
 *
 * ## URL:erna
 *
 * De fyra täcker sajtens fyra malltyper: appskalet, guideindexet, en
 * ämnessida och verktygsindexet. Utan listan autodiscoverar lhci samtliga
 * 180 HTML-filer i `dist/` — 540 mätningar med numberOfRuns=3.
 *
 * Historik: `404.html` (GitHub Pages-kvarleva som klientredirectade till en
 * sökväg som inte fanns) och `landing.html` är raderade sedan K19.
 */
module.exports = {
  ci: {
    collect: {
      staticDistDir: './client/dist',
      numberOfRuns: 3,
      url: [
        'http://localhost/index.html',
        'http://localhost/guider/index.html',
        'http://localhost/guider/kategori/soka-jobb/index.html',
        'http://localhost/verktyg/index.html',
      ],
      settings: {
        // --no-sandbox: standard på CI-runners.
        // --disable-dev-shm-usage: /dev/shm är 64 MB på GitHub-runners och
        //   Chrome kraschar under minnestryck utan den. Se resonemanget ovan.
        chromeFlags: '--no-sandbox --disable-dev-shm-usage --disable-gpu',
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // D6 (2026-07-10): LCP-budget 2500 ms som warn. Baseline mot prod
        // 2026-07-10: landning ~340 ms, inloggad översikt ~1400 ms (median,
        // e2e/lcp-baseline.cjs). Skärp till error när CI-variansen är känd —
        // och det går inte att veta förrän jobbet varit grönt några gånger.
        'categories:performance': 'off',
        'categories:accessibility': 'warn',
        'categories:best-practices': 'warn',
        'categories:seo': 'warn',
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
