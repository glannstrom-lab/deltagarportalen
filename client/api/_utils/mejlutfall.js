/**
 * DR2 (2026-09-20) — hur en mejl-cron ska svara på sitt eget utfall.
 *
 * `pass-paminnelse.js` och `aktivitet-mejl.js` fångar varje enskilt
 * Resend-fel i sin loop och svarade ändå HTTP 200. Vercel Cron läser inte
 * svarskroppen — den ser bara statuskoden — så en hel natt där Resend var nere,
 * API-nyckeln gått ut eller domänen avregistrerats gav noll påminnelser till
 * någon deltagare, en grön cron-körning och ingenting som larmade.
 *
 * Regeln här skiljer tre lägen:
 *
 * - **Inget att göra** (inga kandidater): 200. En tyst natt är inte ett fel.
 * - **Delvis fel** (något gick ut, något inte): 200, men ett larm. Körningen
 *   gjorde sitt jobb för de flesta; en enskild mottagare med skräpadress ska
 *   inte få cron-schemat att se trasigt ut.
 * - **Allt föll** (minst ett försök, noll lyckade): 500. Då är det inte
 *   mottagarna det är fel på — det är vägen ut. Statuskoden är det enda
 *   schemaläggaren och `medFelrapport()` faktiskt tittar på.
 *
 * Delad modul med flit: samma regel bodde nyss i två filer som råkade vara
 * lika, och det är precis så en av dem driver iväg (jämför GG2, där en av fyra
 * kopior av närvarodefinitionen sa något annat).
 */

/**
 * `ejMarkerade` (2026-09-22): utskick som gick iväg men vars `data.mail_sent`
 * inte gick att skriva. De skickas igen nästa körning — ett dubbelmejl, inte
 * ett förlorat — så det är ett larm, aldrig ett 500.
 *
 * @typedef {{ skickade: number, fel: number, ejMarkerade?: number }} Utfall
 */

/**
 * @param {Utfall} utfall
 * @returns {{ status: number, larm: string | null }} status att svara med, och
 *   ett larmmeddelande när något bör rapporteras (annars `null`).
 */
function avgorSvar(utfall) {
  const skickade = Number(utfall && utfall.skickade) || 0;
  const fel = Number(utfall && utfall.fel) || 0;
  const ejMarkerade = Number(utfall && utfall.ejMarkerade) || 0;
  const forsok = skickade + fel;
  const dubbelrisk = ejMarkerade > 0
    ? ` ${ejMarkerade} skickade mejl kunde inte markeras och skickas igen nästa körning.`
    : '';

  if (forsok === 0) return { status: 200, larm: null };
  if (skickade === 0) {
    return {
      status: 500,
      larm: `Samtliga ${fel} mejlutskick misslyckades — ingen mottagare nåddes.`,
    };
  }
  if (fel > 0) {
    return { status: 200, larm: `${fel} av ${forsok} mejlutskick misslyckades.${dubbelrisk}` };
  }
  if (dubbelrisk) return { status: 200, larm: dubbelrisk.trim() };
  return { status: 200, larm: null };
}

module.exports = { avgorSvar };
