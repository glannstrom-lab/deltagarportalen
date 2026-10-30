// AIX24/AIX29 (2026-10-30): svarskontrollerna för "Förklara myndighetsbrevet" och
// "Gör det mindre". Ligger utanför ai.js (som redan är över 1 600 rader) och körs
// därifrån via RESPONSE_VALIDATORS. Samma kontrakt som AIX1: en validator får
// ta bort enskilda rader som inte går att belägga, men fäller hela svaret när det
// som blir kvar inte går att använda. Ett belopp, ett datum eller ett telefonnummer
// som inte står i inmatningen visas aldrig.

const { BREV_MAX, UPPGIFT_MAX, serUtSomHalsotext, sifforFinns, finnsOrdagrant, citatFinnsI } = require('./_sprak');

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
const text = (v, tak) => (typeof v === 'string' ? v.trim().slice(0, tak) : '');
const rader = (v, tak) => (Array.isArray(v) ? v.slice(0, tak * 3) : []);
// Positionell rad ELLER objektform — ett svar vi kan läsa fälls inte för formen.
const kol = (rad, i, namn) => (Array.isArray(rad) ? rad[i] : isPlainObject(rad) ? rad[namn] : undefined);

function myndighetsbrev(value, indata) {
  const brev = typeof indata?.brev === 'string' ? indata.brev.trim().slice(0, BREV_MAX) : '';
  // Vårddokument avvisas av koden, aldrig av modellen — samma test som prompten
  // använde för att inte skicka texten vidare.
  if (serUtSomHalsotext(brev)) return { ok: true, value: { avvisad: 'halsa' } };
  if (!isPlainObject(value)) return { ok: false, error: 'brevförklaringen var inte ett JSON-objekt' };
  if (!brev) return { ok: false, error: 'brevet var tomt' };

  const vad = text(value.vad, 400);
  if (!vad) return { ok: false, error: 'brevförklaringen saknade "vad"' };
  // En påhittad siffra i sammanfattningen går inte att plocka bort ur en mening.
  if (!sifforFinns(vad, brev)) return { ok: false, error: 'sammanfattningen innehöll en siffra som inte står i brevet' };

  const avsRaw = text(value.avsandare, 120);
  const avsandare = avsRaw && finnsOrdagrant(avsRaw, brev, BREV_MAX) ? avsRaw : '';

  const gor = [];
  for (const rad of rader(value.gor, 4)) {
    const steg = text(kol(rad, 0, 'steg'), 200);
    const citat = text(kol(rad, 1, 'citat'), 300);
    if (steg && citat && citatFinnsI(citat, brev, BREV_MAX) && sifforFinns(steg, brev)) gor.push({ steg, citat });
    if (gor.length >= 4) break;
  }
  const senast = [];
  for (const rad of rader(value.senast, 3)) {
    const sak = text(kol(rad, 0, 'sak'), 200);
    const datum = text(kol(rad, 1, 'datum'), 60);
    const citat = text(kol(rad, 2, 'citat'), 300);
    // Datumet ska stå som det är skrivet i brevet — räknar modellen ut det är det ett påhitt.
    if (sak && datum && citat && citatFinnsI(citat, brev, BREV_MAX) && finnsOrdagrant(datum, brev, BREV_MAX) && sifforFinns(sak, brev)) {
      senast.push({ sak, datum, citat });
    }
    if (senast.length >= 3) break;
  }
  const vem = [];
  for (const rad of rader(value.vem, 3)) {
    const kontakt = text(kol(rad, 1, 'kontakt'), 120);
    // Mätt i prod 2026-10-30: modellen lämnar ibland namnet tomt men ger ett
    // belagt nummer. Avsändaren (som själv är belagd i brevet) får då stå som
    // namn i stället för att numret försvinner med raden.
    const namn = text(kol(rad, 0, 'namn'), 120) || (kontakt ? avsandare : '');
    const citat = text(kol(rad, 2, 'citat'), 300);
    if (!namn || !citat || !citatFinnsI(citat, brev, BREV_MAX) || !sifforFinns(namn, brev)) continue;
    // En kontaktuppgift som inte står i brevet tar hela raden med sig.
    if (kontakt && !finnsOrdagrant(kontakt, brev, BREV_MAX)) continue;
    vem.push({ namn, kontakt, citat });
    if (vem.length >= 3) break;
  }
  return { ok: true, value: { avsandare, vad, gor, senast, vem } };
}

function gorMindre(value, indata) {
  const uppgift = typeof indata?.uppgift === 'string' ? indata.uppgift.trim().slice(0, UPPGIFT_MAX) : '';
  if (!uppgift) return { ok: false, error: 'uppgiften var tom' };
  if (!isPlainObject(value)) return { ok: false, error: 'stegen var inte ett JSON-objekt' };
  const kallor = uppgift.toLowerCase();
  const steg = [];
  for (const rad of Array.isArray(value.steg) ? value.steg : []) {
    const s = text(Array.isArray(rad) ? rad[0] : rad, 140);
    if (!s) continue;
    // Inga telefonnummer, tider eller belopp som inte personen själv skrev.
    if (!sifforFinns(s, uppgift)) continue;
    // Inga påhittade webbadresser eller e-postadresser.
    const lankar = s.toLowerCase().match(/https?:\/\/\S+|www\.\S+|\S+@\S+\.\S+/g) || [];
    if (lankar.some((l) => !kallor.includes(l))) continue;
    steg.push(s);
    if (steg.length >= 5) break;
  }
  if (steg.length < 2) return { ok: false, error: 'för få användbara steg' };
  return { ok: true, value: { steg } };
}

const VALIDATORER = { myndighetsbrev, 'gor-mindre': gorMindre };

/**
 * @param {'myndighetsbrev' | 'gor-mindre'} namn
 * @param {unknown} value
 * @param {any} indata
 * @returns {{ ok: boolean, value?: any, error?: string }}
 */
function validera(namn, value, indata) {
  return VALIDATORER[namn](value, indata);
}

module.exports = { validera, myndighetsbrev, gorMindre };
