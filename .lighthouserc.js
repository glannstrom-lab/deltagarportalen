/**
 * Lighthouse CI — explicita URL:er, inte autodiscovery.
 *
 * Bakgrund (ROADMAP D29): `lhci` autodiscoverar HTML i `client/dist` och tog
 * `404.html` först i bokstavsordning — en GitHub Pages-kvarleva som
 * klientredirectar till en sökväg som inte finns. `@lhci/cli` saknar try/catch
 * i sin collect-loop, så HELA körningen avbröts på första URL:en och
 * `.lighthouseci/` förblev tom. Därav "No files were found with the provided
 * path". Deterministiskt, inte flakigt — vilket förklarar varför jobbet aldrig
 * gått grönt sedan 2 april.
 *
 * 2026-08-12 (K19): `404.html` och `landing.html` är raderade. `landing.html`
 * stod i listan nedan och byts mot en ämnessida (K15) — de är 11 av sajtens
 * viktigaste nya sidor och representerar en helt egen malltyp.
 *
 * De fyra URL:erna täcker sajtens fyra malltyper: appskalet, guideindexet,
 * en ämnessida och verktygsindexet.
 */
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost/index.html',
        'http://localhost/guider/index.html',
        'http://localhost/guider/kategori/soka-jobb/index.html',
        'http://localhost/verktyg/index.html',
      ],
    },
  },
};
