// AIX16 (2026-10-30): text till nämnd och verksamhetsberättelse.
// Ligger i en egen fil med understreck (som _rattstavning.js): index.js kräver att
// varje export i en domänfil är en promptfunktion.
//
// Modellen får BARA aggregerade tal ur nämndrapporten, aldrig deltagarrader.
// Celler under 5 undertrycks i klienten (services/namndTextApi.ts) och en gång till
// här (`cell`), så att ett tal 1–4 aldrig når modellen även om en anropare skulle
// glömma det. Texten blir ett tillägg som chefen redigerar, aldrig en ersättning
// för tabellerna.
//
// Validatorn är binding: varje mening där ett tal saknas i underlaget, där en
// orsak förklaras eller där en utveckling över tid påstås stryks. Underlaget har
// ingen tidigare period, så ett "ökade" eller "jämfört med" kan aldrig stå på
// något. Det som stryks syns i `struket`.

const CELLGRANS = 5;
const UNDERTRYCKT = 'undertryckt (färre än 5)';

/** Ett tal ur underlaget som text: 0 och ≥5 visas, 1–4 och null undertrycks. */
function cell(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return UNDERTRYCKT;
  if (n > 0 && n < CELLGRANS) return UNDERTRYCKT;
  return String(n);
}

/** Närvarograd i procent, eller streck när den inte kan redovisas. */
function procent(grad, bedomda) {
  if (typeof grad !== 'number' || !Number.isFinite(grad)) return '—';
  if (typeof bedomda === 'number' && bedomda > 0 && bedomda < CELLGRANS) return '—';
  return `${grad} %`;
}

function radText(namn, r) {
  const g = r && typeof r === 'object' ? r : {};
  return `- ${String(namn || 'okänd grupp').slice(0, 80)}: deltagare med plan ${cell(g.deltagare)}; bedömda pass ${cell(g.bedomdaPass)}; närvarograd ${procent(g.narvarograd, g.bedomdaPass)}; anmäld frånvaro ${cell(g.anmaldFranvaro)}; oanmäld frånvaro ${cell(g.oanmaldFranvaro)}; sjuk utan intyg ${cell(g.sjukUtanIntyg)}; underlag lämnat ${cell(g.underlagLamnat)}`;
}

/** Underlaget som text. Prompten och validatorn läser SAMMA text. */
function underlagText(u) {
  const o = u && typeof u === 'object' ? u : {};
  const grupper = (Array.isArray(o.grupper) ? o.grupper : []).slice(0, 12);
  const rader = grupper.map((g) => radText(g?.namn, g));
  const summa = o.summa && typeof o.summa === 'object' ? radText('Summa för redovisade grupper', o.summa) : 'Ingen summa kan redovisas.';
  return [
    `Kvartal ${Number.isInteger(o.kvartal) ? o.kvartal : 'okänt'} ${Number.isInteger(o.ar) ? o.ar : ''}`.trim(),
    'GRUPPER (försörjningshinder):',
    rader.join('\n') || 'Inga grupper kan redovisas.',
    o.ovrigaUndertryckta ? 'Fler grupper finns men är så små att de inte redovisas.' : '',
    'SUMMA:',
    summa,
  ].filter(Boolean).join('\n');
}

const TALORD = {
  två: 2, tre: 3, fyra: 4, fem: 5, sex: 6, sju: 7, åtta: 8, nio: 9, tio: 10, elva: 11, tolv: 12,
  tjugo: 20, trettio: 30, fyrtio: 40, femtio: 50, hundra: 100,
};
// Härledda mängder utan siffra i underlaget: "hälften" är ett påstående om en kvot som ingen räknat fram.
const HARLEDDA_ORD = /\b(hälften|halva|tredjedel|fjärdedel|dubbelt|fördubbl\w*|halverad\w*|majoriteten|merparten|flertalet)\b/i;

const ORSAK = /(på grund av|p\.g\.a\.?|eftersom|beror (?:på|av)|berodde (?:på|av)|tack vare|till följd av|följd av|därför att|därför|orsak\w*|förklaras|förklaring\w*|bidrog till|bidrar till|ledde till|leder till|resulterade|som ett resultat|vilket tyder på|vilket visar att|vilket innebär att)/i;
const UTVECKLING = /(jämfört med|jämförelse med|föregående (?:kvartal|period|år)|tidigare kvartal|förra (?:kvartalet|året)|ökade|ökat|ökning|minskade|minskat|minskning|förbättr\w*|försämr\w*|stigit|sjunkit|högre än|lägre än|trend\w*|utvecklingen)/i;

function normTal(s) {
  const t = String(s).replace(',', '.').replace(/^0+(?=\d)/, '');
  return t;
}

/** Alla tal i en text, normaliserade (inledande nollor bort, komma som punkt). */
function talI(text) {
  return (String(text ?? '').match(/\d+(?:[.,]\d+)?/g) || []).map(normTal);
}

function meningar(stycke) {
  return String(stycke).split(/(?<=[.!?])\s+(?=[A-ZÅÄÖ"(])/).map((s) => s.trim()).filter(Boolean);
}

/** Skälet till att en mening inte får stå, eller null. */
function skalAttStryka(mening, tillatna) {
  if (ORSAK.test(mening)) return 'orsak';
  if (UTVECKLING.test(mening)) return 'utveckling';
  if (HARLEDDA_ORD.test(mening)) return 'härlett';
  for (const t of talI(mening)) {
    if (!tillatna.has(t)) return 'tal: ' + t;
  }
  for (const ord of (mening.toLowerCase().match(/\p{L}+/gu) || [])) {
    if (Object.prototype.hasOwnProperty.call(TALORD, ord) && !tillatna.has(String(TALORD[ord]))) return 'talord: ' + ord;
  }
  return null;
}

/**
 * Validerar modellens svar mot underlaget som prompten fick.
 * @param {any} value  { text: "…" }
 * @param {{ underlag?: any }} indata
 * @returns {{ ok: true, value: { text: string, struket: number } } | { ok: false, error: string }}
 */
function validera(value, indata) {
  const rå = typeof value === 'string' ? value : value && typeof value === 'object' ? value.text : undefined;
  if (typeof rå !== 'string' || !rå.trim()) return { ok: false, error: 'nämndtexten saknade text' };
  const tillatna = new Set(talI(underlagText(indata?.underlag)));
  let struket = 0;
  const stycken = rå.trim().split(/\n{2,}/).slice(0, 4).map((stycke) => {
    const kvar = [];
    for (const m of meningar(stycke.replace(/\s*\n\s*/g, ' '))) {
      if (skalAttStryka(m, tillatna)) struket++;
      else kvar.push(m);
    }
    return kvar.join(' ');
  }).filter(Boolean);
  const text = stycken.join('\n\n').slice(0, 1800);
  if (!text) return { ok: false, error: 'ingen mening i nämndtexten höll sig till underlaget' };
  return { ok: true, value: { text, struket } };
}

module.exports = { validera, underlagText, skalAttStryka, cell, CELLGRANS };
