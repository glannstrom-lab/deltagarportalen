// AIX8 (2026-10-30): deterministisk kontroll av rensad talad text.
// Egen fil med understreck (som _rattstavning.js): index.js kräver att varje
// export i en domänfil är en promptfunktion.
//
// Modellen får bara ta bort upprepningar och utfyllnadsord och sätta
// skiljetecken och stor bokstav. Ingen ny fakta. Kontrollen sker i kod:
//   1. SIFFROR: samma siffergrupper, i samma mängd, före och efter.
//   2. NYA ORD: varje ord i den rensade texten ska finnas i originalet, vara en
//      böjning/stavningsvariant av ett ord där (liten redigeringsdistans, bara
//      för ord med minst fyra bokstäver), vara hopslaget av två intilliggande
//      ord, eller vara ett av få funktionsord (TILLATNA_NYA).
//   3. BORTTAGET: varje innehållsord i originalet ska finnas kvar (eller vara
//      ett utfyllnadsord). Att ta bort en upprepning är tillåtet eftersom ordet
//      finns kvar en gång.
//   4. NEJ: negationerna (inte, ej, aldrig, ingen …) ska vara samma mängd.
//   5. LÄNGD: högst marginellt längre än originalet.

const { ordLista, siffror, lika, avstand, tolerans, medHopslagna } = require('./_rattstavning');

const TEXT_MAX = 3000;
/** Rensningen får vara högst så här mycket längre: 10 % + 10 tecken (skiljetecken). */
const LANGD_FAKTOR = 1.1;
const LANGD_MARGINAL = 10;

/** Ord som får tillkomma utan att vara en variant av ett ord i originalet. */
const TILLATNA_NYA = new Set([
  'en', 'ett', 'att', 'och', 'som', 'av', 'på', 'i', 'med', 'för', 'till', 'har', 'hade', 'är', 'var', 'så',
]);

/** Utfyllnad som får tas bort helt. */
const UTFYLLNAD = new Set([
  'eh', 'öh', 'ehm', 'em', 'öhm', 'hm', 'hmm', 'mm', 'liksom', 'alltså', 'typ', 'asså', 'ba', 'ju', 'väl',
  'ungefär', 'så', 'ja', 'okej', 'ok', 'nä', 'jaha', 'ah', 'aa', 'tja', 'eller', 'va',
]);

/** Små ord som inte bär innehåll nog att kräva att de finns kvar. */
const SMA_ORD = new Set([
  'en', 'ett', 'de', 'dem', 'den', 'det', 'att', 'och', 'som', 'av', 'på', 'i', 'å', 'om', 'med', 'för',
  'från', 'till', 'hos', 'vid', 'har', 'ha', 'hade', 'är', 'var', 'vara', 'blir', 'bli', 'då', 'än', 'nu',
  'där', 'här', 'men', 'sig', 'mig', 'dig', 'vi', 'ni', 'du', 'jag', 'han', 'hon', 'hen', 'man',
]);

const NEGATIONER = ['inte', 'ej', 'aldrig', 'ingen', 'inget', 'inga', 'nej', 'icke', 'utan'];

function narTillOrd(ord, kallor) {
  if (kallor.includes(ord)) return true;
  // Böjning/stavning går bara att bedöma på ord med minst fyra bokstäver:
  // "ja" → "nej" eller "bil" → "bal" är ett annat ord, inte en variant.
  if (ord.length < 4) return false;
  return kallor.some((k) => k.length >= 4 && avstand(ord, k) <= tolerans(ord, k));
}

/**
 * Är `rensad` en rensning av `original` utan nytt innehåll?
 * @returns {{ ok: true } | { ok: false, skal: string }}
 */
function arRensning(original, rensad) {
  if (typeof original !== 'string' || typeof rensad !== 'string') return { ok: false, skal: 'ej text' };
  if (!rensad.trim()) return { ok: false, skal: 'tom rensning' };
  if (rensad.length > original.length * LANGD_FAKTOR + LANGD_MARGINAL) return { ok: false, skal: 'längre än originalet' };
  if (!lika(siffror(original), siffror(rensad))) return { ok: false, skal: 'siffror ändrade' };

  const o = ordLista(original);
  const r = ordLista(rensad);
  const oMed = medHopslagna(o);
  const oSet = new Set(oMed);

  for (const ord of r) {
    if (oSet.has(ord) || TILLATNA_NYA.has(ord)) continue;
    if (narTillOrd(ord, oMed)) continue;
    return { ok: false, skal: 'nytt ord: ' + ord };
  }

  const rMed = medHopslagna(r);
  const rSet = new Set(rMed);
  for (const ord of o) {
    if (rSet.has(ord) || UTFYLLNAD.has(ord) || SMA_ORD.has(ord) || ord.length <= 2) continue;
    if (narTillOrd(ord, rMed)) continue;
    // Ordet kan ha slagits ihop med ett grannord ("hem sida" → "hemsida").
    if (r.some((k) => k.length > ord.length && (k.startsWith(ord) || k.endsWith(ord)))) continue;
    return { ok: false, skal: 'ord borttaget: ' + ord };
  }

  const negO = new Set(o.filter((w) => NEGATIONER.includes(w)));
  const negR = new Set(r.filter((w) => NEGATIONER.includes(w)));
  if (negO.size !== negR.size || [...negO].some((w) => !negR.has(w))) return { ok: false, skal: 'nekande ändrat' };
  return { ok: true };
}

/**
 * Validerar modellens svar mot texten som skickades.
 * @param {any} value  { rensad: "…" } (eller en bar sträng)
 * @param {string} text
 * @returns {{ ok: true, value: { rensad: string } } | { ok: false, error: string }}
 */
function validera(value, text) {
  if (typeof value === 'string') value = { rensad: value };
  if (!value || typeof value !== 'object') return { ok: false, error: 'rensningen var inte ett JSON-objekt' };
  const rensad = typeof value.rensad === 'string' ? value.rensad.trim() : '';
  if (!rensad) return { ok: false, error: 'rensningen saknade text' };
  const bas = String(text ?? '').slice(0, TEXT_MAX).trim();
  const res = arRensning(bas, rensad);
  if (!res.ok) return { ok: false, error: 'rensningen släpptes inte igenom: ' + ('skal' in res ? res.skal : '') };
  return { ok: true, value: { rensad } };
}

module.exports = { arRensning, validera, TEXT_MAX, TILLATNA_NYA, UTFYLLNAD };
