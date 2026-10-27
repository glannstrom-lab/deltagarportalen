// AIX1 (2026-10-27): hjälpare för "Förklara annonsen". Ligger i en egen fil med
// understreck (inte i ansokan.js) eftersom index.js kräver att varje export i en
// domänfil är en promptfunktion i ORDNING.

/** Annonstexten kapas här — samma tak som O9-länken (`buildCvAdaptUrl`) skickar. */
const ANNONS_MAX = 3000;

/**
 * Normaliserar för jämförelse: gemener, gemensamt blanksteg, ensade citattecken
 * och tankstreck. Modellen citerar ofta med "smarta" tecken eller kapar
 * radbrytningar; en annan bokstav eller ett annat ord ska däremot fortfarande
 * ge träff = false.
 */
function normalisera(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finns `citat` ordagrant i `annons`? Ellipser ("…" / "...") i citatet tillåts
 * som skarvar mellan delar, men varje del måste finnas var för sig, i ordning.
 * Ett citat under 4 tecken räknas inte — "ska" finns i alla annonser.
 */
function citatFinnsIAnnons(citat, annons) {
  const bas = normalisera(String(annons ?? '').slice(0, ANNONS_MAX));
  const delar = normalisera(citat)
    .split(/\s*(?:…|\.\.\.)\s*/)
    .map((d) => d.replace(/^["'\s]+|["'\s]+$/g, ''))
    .filter(Boolean);
  if (delar.length === 0) return false;
  let pos = 0;
  for (const del of delar) {
    if (del.length < 4) return false;
    const i = bas.indexOf(del, pos);
    if (i === -1) return false;
    pos = i + del.length;
  }
  return true;
}

module.exports = { ANNONS_MAX, normalisera, citatFinnsIAnnons };
