// AIX9 (2026-10-30): hjälpare för "Varför passar annonsen mig?". Egen fil med
// understreck (index.js kräver att varje export i en domänfil är en promptfunktion).
//
// Svaret är skäl rad för rad, med ordagranna citat ur annonsen och (för det som
// stämmer) ur personens CV. Aldrig ett procenttal: ett tal som ser exakt ut är
// förbjudet (lärdomen från intresseguiden).

const { normalisera } = require('./_annons');

/** Annons och CV kapas här — samma tak i prompten och i validatorn. */
const ANNONS_TAK = 3000;
const CV_TAK = 6000;
const MAX_SKAL = 8;

/**
 * Finns `citat` ordagrant i `text` (kapad vid `tak`)? Samma regler som
 * citatFinnsIAnnons: normaliserat, ellips tillåten mellan delar, minst 4 tecken
 * per del. Allmän variant eftersom CV-underlaget har ett annat tak än annonsen.
 */
function citatFinnsI(citat, text, tak) {
  const bas = normalisera(String(text ?? '').slice(0, tak));
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

/** Ett tal som ser ut som en träffprocent, i en rad som annars klarat citatkontrollen. */
const PROCENT = /\d\s*(?:%|procent)|procent|\d+\s*(?:\/|av)\s*100\b/i;

/**
 * Validerar modellens svar mot de två texterna. En rad utan belägg stryks.
 *  - typ "traffar": annonscitat OCH cv-citat måste stå ordagrant.
 *  - typ "saknas": bara annonscitat (det finns inget i CV:t att citera). En rad
 *    vars annonscitat också står ordagrant i CV:t är en självmotsägelse och stryks.
 * Allt annat i svaret (matchScore, procent, extra fält) släpps aldrig igenom.
 * @param {unknown} value
 * @param {string} annons
 * @param {string} cv
 */
function valideraSkal(value, annons, cv) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'matchningen var inte ett JSON-objekt' };
  }
  const v = /** @type {Record<string, any>} */ (value);
  const text = (x, tak) => (typeof x === 'string' ? x.trim().slice(0, tak) : '');
  const ra = Array.isArray(v.skal) ? v.skal.slice(0, MAX_SKAL * 3) : [];
  const skal = [];
  for (const rad of ra) {
    if (!rad || typeof rad !== 'object' || Array.isArray(rad)) continue;
    const typ = text(rad.typ, 20).toLowerCase();
    const punkt = text(rad.punkt, 200);
    const annonsCitat = text(rad.annons, 300);
    const cvCitat = text(rad.cv, 300);
    if (typ !== 'traffar' && typ !== 'saknas') continue;
    if (!punkt || PROCENT.test(punkt)) continue;
    if (!annonsCitat || !citatFinnsI(annonsCitat, annons, ANNONS_TAK)) continue;
    if (typ === 'traffar') {
      if (!cvCitat || !citatFinnsI(cvCitat, cv, CV_TAK)) continue;
      skal.push({ typ, punkt, annons: annonsCitat, cv: cvCitat });
    } else {
      if (citatFinnsI(annonsCitat, cv, CV_TAK)) continue;
      skal.push({ typ, punkt, annons: annonsCitat });
    }
    if (skal.length >= MAX_SKAL) break;
  }
  return { ok: true, value: { skal } };
}

module.exports = { ANNONS_TAK, CV_TAK, MAX_SKAL, citatFinnsI, valideraSkal };
