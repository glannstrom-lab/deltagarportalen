/**
 * Rena mätfunktioner för språkmätningen (AIX26). Inga nätanrop här — de bor i
 * scripts/sprakmatning.cjs. Utbrutet för att kunna testas (och mutationstestas).
 *
 * Mätningen är en maskinell grind, inget kvalitetsbevis: den fångar tappade
 * siffror, översatta myndighetsnamn, tomma/kraftigt förkortade svar och
 * oöversatta kopior. Den kan inte avgöra om ett språk är *bra*.
 */

const SIFFROR_ARABISK = '٠١٢٣٤٥٦٧٨٩';
const SIFFROR_PERSISK = '۰۱۲۳۴۵۶۷۸۹';

/** Östarabiska/persiska siffror till 0-9. */
function normaliseraSiffror(text) {
  return String(text ?? '').replace(/[٠-٩۰-۹]/g, (c) => {
    const a = SIFFROR_ARABISK.indexOf(c);
    return String(a >= 0 ? a : SIFFROR_PERSISK.indexOf(c));
  });
}

// Små tal som ord (svenska och engelska). Ett "fyra" för "4" är en korrekt
// översättning, inte ett tappat tal. "en"/"ett"/"one" lämnas utanför: för tvetydiga.
const ORDTAL = {
  två: 2, tre: 3, fyra: 4, fem: 5, sex: 6, sju: 7, åtta: 8, nio: 9, tio: 10, elva: 11, tolv: 12,
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

/**
 * Alla tal i en text som en sorterad lista strängar. Tusentalsgrupper
 * ("15 000", "15.000", "15٬000") slås ihop till ett tal; annars är varje
 * siffersvit ett eget tal, så "10:30" och "10.30" ger båda ["10","30"].
 * Små tal skrivna som ord (två..tolv, two..twelve) räknas som siffror.
 */
function hittaTal(text) {
  const t = normaliseraSiffror(text).replace(/[٬٫]/g, ' ');
  const ut = [];
  const re = /\d{1,3}(?:[ \u00a0\u202f.,]\d{3})+(?!\d)|\d+/g;
  let m;
  while ((m = re.exec(t))) ut.push(m[0].replace(/[^\d]/g, ''));
  for (const ord of t.toLowerCase().match(/\p{L}+/gu) || []) {
    if (Object.prototype.hasOwnProperty.call(ORDTAL, ord)) ut.push(String(ORDTAL[ord]));
  }
  return ut.sort();
}

/**
 * Jämför förväntade tal mot en text. Returnerar saknade tal (multimängd) och
 * andelen bevarade. En mening utan tal har andel 1.
 */
function jamforTal(original, text) {
  const forvantat = hittaTal(original);
  const har = hittaTal(text);
  const kvar = [...har];
  const saknade = [];
  for (const tal of forvantat) {
    const i = kvar.indexOf(tal);
    if (i >= 0) kvar.splice(i, 1);
    else saknade.push(tal);
  }
  const andel = forvantat.length === 0 ? 1 : (forvantat.length - saknade.length) / forvantat.length;
  return { forvantat, saknade, andel };
}

const norm = (s) => String(s ?? '').normalize('NFC').toLowerCase();

/** Vilka skyddade namn (ur originalet) som INTE står kvar i texten. */
function jamforNamn(original, text, namn) {
  const o = norm(original);
  const t = norm(text);
  const forvantat = namn.filter((n) => o.includes(norm(n)));
  const saknade = forvantat.filter((n) => !t.includes(norm(n)));
  const andel = forvantat.length === 0 ? 1 : (forvantat.length - saknade.length) / forvantat.length;
  return { forvantat, saknade, andel };
}

/** Teckentrigram-mängd (multimängd som Map) efter att skiljetecken strippats. */
function trigram(text) {
  const t = ` ${norm(text).replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
  const m = new Map();
  for (let i = 0; i + 3 <= t.length; i++) {
    const g = t.slice(i, i + 3);
    m.set(g, (m.get(g) || 0) + 1);
  }
  return m;
}

/** Dice-likhet 0..1 över teckentrigram. Tom text mot tom text = 0 (inget bevisat). */
function likhet(a, b) {
  const x = trigram(a);
  const y = trigram(b);
  let nx = 0;
  let ny = 0;
  let snitt = 0;
  for (const v of x.values()) nx += v;
  for (const v of y.values()) ny += v;
  if (nx === 0 || ny === 0) return 0;
  for (const [g, v] of x) snitt += Math.min(v, y.get(g) || 0);
  return (2 * snitt) / (nx + ny);
}

/** Teckenlängdskvot (tillbakaöversättning / original), ordlängd utan blanksteg. */
function langdkvot(original, tillbaka) {
  const lang = (s) => String(s ?? '').replace(/\s+/g, '').length;
  const o = lang(original);
  return o === 0 ? 0 : lang(tillbaka) / o;
}

const KVOT_MIN = 0.6;
const KVOT_MAX = 1.6;
const LIKHET_MIN = 0.4;
const KOPIA_GRANS = 0.7;

/**
 * Bedömer en mening. `p` = { original, mal, tillbaka }.
 * Poängen är likheten (original mot tillbaka) multiplicerad med tal- och
 * namnandelarna, och 0 om svaret är tomt, orimligt kort/långt eller en
 * oöversatt kopia — annars skulle ett tomt svar aldrig kunna straffas
 * (tillbakaöversättning belönar tomma svar: kvoten är det som fångar dem).
 */
function bedomMening(p, namn, opt = {}) {
  const kvotMin = opt.kvotMin ?? KVOT_MIN;
  const kvotMax = opt.kvotMax ?? KVOT_MAX;
  const { original, mal, tillbaka } = p;
  const talMal = jamforTal(original, mal);
  const talTill = jamforTal(original, tillbaka);
  const namnMal = jamforNamn(original, mal, namn);
  const kvot = langdkvot(original, tillbaka);
  const sim = likhet(original, tillbaka);
  const kopia = likhet(original, mal) >= (opt.kopiaGrans ?? KOPIA_GRANS);
  const tomt = norm(mal).trim() === '' || norm(tillbaka).trim() === '';

  const skal = [];
  if (tomt) skal.push('tomt svar');
  if (!tomt && (kvot < kvotMin || kvot > kvotMax)) skal.push(`längdkvot ${kvot.toFixed(2)}`);
  if (kopia && !tomt) skal.push('oöversatt kopia');
  if (talMal.saknade.length) skal.push(`tal saknas i målspråket: ${talMal.saknade.join(',')}`);
  if (talTill.saknade.length) skal.push(`tal saknas i tillbaka: ${talTill.saknade.join(',')}`);
  if (namnMal.saknade.length) skal.push(`namn borta: ${namnMal.saknade.join(',')}`);
  if (!tomt && sim < (opt.likhetMin ?? LIKHET_MIN)) skal.push(`låg likhet ${sim.toFixed(2)}`);

  const hardFel = tomt || kopia || kvot < kvotMin || kvot > kvotMax;
  const poang = hardFel ? 0 : sim * talMal.andel * talTill.andel * namnMal.andel;
  return { ok: skal.length === 0, skal, poang, likhet: sim, kvot, talMal, talTill, namnMal, kopia, tomt };
}

/** Sammanfattning över bedömda meningar. */
function sammanfatta(bedomda) {
  const n = bedomda.length;
  const snitt = (f) => (n ? bedomda.reduce((s, b) => s + f(b), 0) / n : 0);
  return {
    antal: n,
    godkanda: bedomda.filter((b) => b.ok).length,
    talMal: snitt((b) => b.talMal.andel),
    talTill: snitt((b) => b.talTill.andel),
    namn: snitt((b) => b.namnMal.andel),
    likhet: snitt((b) => b.likhet),
    kvot: snitt((b) => b.kvot),
    poang: snitt((b) => b.poang),
    tomma: bedomda.filter((b) => b.tomt).length,
    kopior: bedomda.filter((b) => b.kopia).length,
    langdfel: bedomda.filter((b) => !b.tomt && (b.kvot < KVOT_MIN || b.kvot > KVOT_MAX)).length,
  };
}

/** De k sämsta (lägst poäng; vid lika poäng flest skäl först). */
function samsta(bedomda, k = 10) {
  return [...bedomda]
    .sort((a, b) => a.poang - b.poang || b.skal.length - a.skal.length)
    .slice(0, k);
}

module.exports = {
  normaliseraSiffror, hittaTal, jamforTal, jamforNamn, likhet, langdkvot,
  bedomMening, sammanfatta, samsta, KVOT_MIN, KVOT_MAX, LIKHET_MIN, KOPIA_GRANS,
};
