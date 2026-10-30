// AIX2 (2026-10-30): hjälpare för "Vad har jag med mig?". Egen fil med
// understreck (som _annons.js / _berattelse.js): index.js kräver att varje
// export i en domänfil är en promptfunktion i ORDNING.
//
// Regeln som bär hela funktionen: ett CV-förslag får bara bygga på det personen
// själv har SKRIVIT. "Hjälpte grannen med trädgården" får aldrig bli
// "trädgårdsansvarig". Prompten ber om det, men prompten är en bön — det som
// gör regeln sann är att servern kontrollerar varje förslag mot personens egen
// text (se `validera`). Vad som kontrolleras deterministiskt och vad som bara
// vilar på prompten står i ROADMAP (AIX2).

const { normalisera } = require('./_annons');
const { citatFinnsIText, harStodITexten } = require('./_berattelse');
const { sifforFinns } = require('./_sprak');

const SVAR_ANTAL = 5;
const SVAR_MAX = 600;
const FRAGA_MAX = 200;
const FORSLAG_MAX = 6;

/** Hälsoord (GDPR art. 9). Porterad från HALSOORD i utkastGranskare.ts — håll i synk. */
const HALSOORD = [
  'diagnos\\p{L}*', 'sjuk\\p{L}*', 'ohälsa\\p{L}*', 'hälsotillstånd\\p{L}*', 'funktionsnedsättning\\p{L}*', 'handikapp\\p{L}*',
  'depression\\p{L}*', 'deprimerad\\p{L}*', 'ångest\\p{L}*', 'panik\\p{L}*', 'utbränd\\p{L}*', 'utmattning\\p{L}*',
  'bipolär\\p{L}*', 'schizofreni\\p{L}*', 'psykos\\p{L}*', 'psykisk\\p{L}*', 'psykiatri\\p{L}*', 'psykiatrisk\\p{L}*', 'adhd', 'add', 'autism\\p{L}*',
  'autistisk\\p{L}*', 'npf', 'neuropsykiatrisk\\p{L}*', 'ptsd', 'trauma\\p{L}*', 'dyslexi\\p{L}*', 'epilepsi\\p{L}*', 'diabetes',
  'cancer', 'smärt\\p{L}*', 'värk', 'sömnproblem\\p{L}*', 'självmord\\p{L}*', 'suicid\\p{L}*', 'självskad\\p{L}*',
  'missbruk\\p{L}*', 'beroendeproblem\\p{L}*', 'beroendesjukdom\\p{L}*', 'beroendevård\\p{L}*', 'alkohol\\p{L}*', 'narkotika\\p{L}*', 'droger', 'medicin\\p{L}*', 'läkemedel\\p{L}*',
  'läkare\\p{L}*', 'läkarintyg\\p{L}*', 'vårdcentral\\p{L}*', 'rehab\\p{L}*', 'terapi\\p{L}*', 'terapeut\\p{L}*', 'kurator\\p{L}*',
  'mår\\s+(?:dåligt|sämre|bättre|bra)',
];
const HALSO_RE = new RegExp(`(?<![\\p{L}\\p{N}])(?:${HALSOORD.join('|')})(?![\\p{L}\\p{N}])`, 'iu');

/** Nämner texten hälsa? Heuristik — ett ordval kan alltid slinka förbi. */
function namnerHalsa(text) {
  return HALSO_RE.test(String(text ?? ''));
}

/**
 * Ord som uppgraderar det personen sagt: titlar, ledarskap och omfattning. Ett
 * sådant ord i ett förslag måste ha en motsvarighet i personens egen text,
 * annars stryks förslaget. "Hjälpte grannen" blir aldrig "projektledare" och
 * "trädgården" blir aldrig "trädgårdsansvarig".
 *
 * DELAR: kan sitta sist i ett sammansatt ord (trädgårdsansvarig, butikschef) och
 * letas därför var som helst i ett ord. HELA: korta ord som bara räknas som
 * hela ord eller i början av ett ord. Jämförelsen mot personens text sker på
 * själva stammen (inte ordets första fem tecken: "trädgårdsansvarig" och
 * "trädgården" delar början men inte ansvaret).
 */
const UPPGRADERING_DELAR = [
  'projektled', 'chef', 'ledare', 'ledarskap', 'ledning', 'koordin', 'samordn', 'föreståndar', 'manager',
  'ansvarig', 'ansvarade', 'ansvarat', 'ansvarsfull', 'organisera', 'arrangera', 'initiativtag', 'expert', 'specialist',
  'strategisk', 'optimera', 'effektivisera', 'budget',
];
const UPPGRADERING_HELA = [
  'ledde', 'leda', 'leder', 'vd', 'grundade', 'startade', 'senior', 'erfaren', 'dagligen', 'regelbundet', 'regelbunden',
  'årligen', 'veckovis', 'flera', 'många', 'ständigt', 'driv', 'drev', 'utveckl',
];

/** Uppgraderingsord i `forslag` som personen inte själv skrivit. */
function uppgraderingar(forslag, text) {
  const fs = normalisera(forslag);
  const tx = normalisera(text);
  const funna = [];
  for (const d of UPPGRADERING_DELAR) {
    if (fs.includes(d) && !tx.includes(d)) funna.push(d);
  }
  for (const h of UPPGRADERING_HELA) {
    const re = new RegExp(`(?<![a-zåäöéü])${h}`, 'u');
    if (re.test(fs) && !re.test(tx)) funna.push(h);
  }
  return funna;
}

/** Rensar indata till det prompten och validatorn båda utgår från. */
function rensaIndata(data) {
  const lista = Array.isArray(data?.svar) ? data.svar : [];
  return lista.slice(0, SVAR_ANTAL).map((s) => ({
    fraga: typeof s?.fraga === 'string' ? s.fraga.trim().slice(0, FRAGA_MAX) : '',
    text: typeof s?.text === 'string' ? s.text.trim().slice(0, SVAR_MAX) : '',
  })).filter((s) => s.text);
}

/** Allt personen själv har skrivit, som en text. Frågorna ingår inte — de är inte hennes. */
function anvandarText(data) {
  return rensaIndata(data).map((s) => s.text).join('\n');
}

/**
 * Validator för `vad-har-jag-med-mig`. `indata` är det prompten fick (efter
 * sanering). Returnerar { forslag } eller { avvisad: 'halsa' }.
 */
function validera(value, indata) {
  const text = anvandarText(indata);
  if (namnerHalsa(text)) return { ok: true, value: { avvisad: 'halsa', forslag: [] } };
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'förslagen var inte ett JSON-objekt' };
  }
  const rader = Array.isArray(value.forslag) ? value.forslag.slice(0, FORSLAG_MAX * 3) : [];
  const str = (v, tak) => (typeof v === 'string' ? v.trim().slice(0, tak) : '');
  const kol = (rad, i, namn) => (Array.isArray(rad) ? rad[i] : rad && typeof rad === 'object' ? rad[namn] : undefined);
  const normText = normalisera(text);

  const forslag = [];
  const sedda = new Set();
  for (const rad of rader) {
    const titel = str(kol(rad, 0, 'titel'), 80);
    let organisation = str(kol(rad, 1, 'organisation'), 80);
    const beskrivning = str(kol(rad, 2, 'beskrivning'), 240);
    const citat = str(kol(rad, 3, 'citat'), 300);
    if (!titel || !beskrivning || !citat) continue;
    // 1. Personens egen mening: citatet ska stå ordagrant i det hon skrev.
    if (!citatFinnsIText(citat, text)) continue;
    const nyckel = normalisera(citat);
    if (sedda.has(nyckel)) continue;
    // 2. Inga siffror som inte står i texten.
    const helaForslaget = `${titel} ${organisation} ${beskrivning}`;
    if (!sifforFinns(helaForslaget, text)) continue;
    // 3. Ingen uppgradering: titlar, ledarskap och omfattning måste vara hennes egna ord.
    if (uppgraderingar(`${titel} ${beskrivning}`, text).length > 0) continue;
    // 4. Ingen hälsa i förslaget, hur indatan än såg ut.
    if (namnerHalsa(helaForslaget)) continue;
    // 5. Beskrivningens ord ska ha stöd i texten (samma mått som AIX4).
    if (!harStodITexten(beskrivning, text)) continue;
    // 6. Organisationen: står den inte i texten har modellen hittat på den. Förslaget
    //    behålls, men platsen lämnas tom så att personen fyller i den själv.
    if (organisation && !normText.includes(normalisera(organisation))) organisation = '';
    sedda.add(nyckel);
    forslag.push({ titel, organisation, beskrivning, citat });
    if (forslag.length >= FORSLAG_MAX) break;
  }
  return { ok: true, value: { forslag } };
}

module.exports = { SVAR_ANTAL, SVAR_MAX, FORSLAG_MAX, namnerHalsa, rensaIndata, anvandarText, uppgraderingar, validera };
