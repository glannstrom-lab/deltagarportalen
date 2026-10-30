// AIX24/AIX29 (2026-10-30): hjälpare för "Förklara myndighetsbrevet" och "Gör det mindre".
// Egen fil med understreck: index.js kräver att varje export i en domänfil är en
// promptfunktion i ORDNING. Allt här är rena funktioner som delas av prompten
// (sprak.js), validatorerna i ai.js och vitest-grinden.

const { normalisera } = require('./_annons');

/** Brevet kapas här — det som prompten får är det som kontrollen jämför mot. */
const BREV_MAX = 4000;
/** Uppgiften i "Gör det mindre" är en mening eller två. */
const UPPGIFT_MAX = 300;

/**
 * Ser texten ut som ett läkarintyg, en journaltext eller ett annat vårddokument?
 * Sådan text är hälsouppgifter (GDPR art. 9) och ska inte till modellen: den här
 * funktionen har ingen art. 9-grind, och vi vill inte bygga en bakväg runt den.
 * Avsiktligt snäv — ett Försäkringskassan-beslut om sjukpenning är ett
 * myndighetsbrev och ska kunna förklaras. Det som avvisas är vårdens egna dokument.
 * @param {unknown} text
 * @returns {boolean}
 */
function serUtSomHalsotext(text) {
  const t = String(text ?? '').toLowerCase();
  const tecken = [
    /läkarintyg/, /läkarutlåtande/, /sjukintyg/, /medicinskt\s+underlag/,
    /journalanteckning|journaltext|patientjournal/, /\bpatient(en)?\b/,
    /\bdiagnos(kod)?\s*[:=]/, /\bicd-?10\b/, /\bf\d{2}\.\d\b/i,
    /ordinerad|ordination|läkemedelslista|medicinering/, /remiss(en)?\s+(till|från)/,
    /provsvar|provtagning|röntgensvar|undersökningsfynd/,
    /vårdkontakt|vårdgivare\s*:/,
  ];
  return tecken.some((re) => re.test(t));
}

/** Siffergrupper i en text, normaliserade så att "1 500", "1500" och "1.500" blir lika. */
function siffergrupper(text) {
  const rent = String(text ?? '');
  const grupper = rent.match(/\d+(?:[ .,:/-]\d+)*/g) || [];
  return grupper.map((g) => g.replace(/\D/g, '')).filter(Boolean);
}

/**
 * Står varje siffra i `svar` också i `kalla`? Jämför grupp för grupp (siffror som
 * hör ihop med mellanrum, punkt, kolon, snedstreck eller bindestreck räknas som en
 * grupp), på siffernivå: "1 500", "1500" och "1.500" är samma grupp, "09:30" och
 * "09.30" likaså. Medvetet snålt: "2026-11-12" går INTE att belägga mot "12
 * november 2026" och faller, och en grupp som bara består av delar som råkar finnas
 * var för sig i källan ("10:00" mot "10 november" + "klockan 09:00") godkänns inte.
 * Prompten ber därför modellen skriva datum och tider som de står i brevet.
 * @param {string} svar
 * @param {string} kalla
 * @returns {boolean}
 */
function sifforFinns(svar, kalla) {
  const kallGrupper = new Set(siffergrupper(kalla));
  for (const grupp of String(svar ?? '').match(/\d+(?:[ .,:/-]\d+)*/g) || []) {
    if (!kallGrupper.has(grupp.replace(/\D/g, ''))) return false;
  }
  return true;
}

/** Står `delen` (normaliserad) ordagrant i `kalla`? Kortare än 3 tecken räknas inte. */
function finnsOrdagrant(del, kalla, max) {
  const d = normalisera(del);
  if (d.length < 3) return false;
  return normalisera(String(kalla ?? '').slice(0, max)).includes(d);
}

/**
 * Citat med "…" som skarv mellan delar, som i AIX1 men mot en egen längdgräns.
 * @param {string} citat
 * @param {string} kalla
 * @param {number} max
 */
function citatFinnsI(citat, kalla, max) {
  const bas = normalisera(String(kalla ?? '').slice(0, max));
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

module.exports = { BREV_MAX, UPPGIFT_MAX, serUtSomHalsotext, sifforFinns, finnsOrdagrant, citatFinnsI };
