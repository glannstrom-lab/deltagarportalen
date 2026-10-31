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

// Små tal som ord (svenska, engelska, arabiska, persiska/dari). Ett "fyra" för
// "4" är en korrekt översättning, inte ett tappat tal. "en"/"ett"/"one"/"واحد"/
// "یک" lämnas utanför: för tvetydiga. Arabiska och persiska nycklar står i den
// form normaliseraArabiska ger.
const ORDTAL = {
  två: 2, tre: 3, fyra: 4, fem: 5, sex: 6, sju: 7, åtta: 8, nio: 9, tio: 10, elva: 11, tolv: 12,
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};
const ORDTAL_ARABISKA = {
  // arabiska, inkl. dualformer av tidsenheter ("أسبوعين" = två veckor)
  اثنان: 2, اثنین: 2, اثنتان: 2, اثنتین: 2, اسبوعین: 2, اسبوعان: 2, یومین: 2, یومان: 2,
  شهرین: 2, شهران: 2, سنتین: 2, سنتان: 2, عامین: 2, ساعتین: 2,
  ثلاث: 3, ثلاثه: 3, اربع: 4, اربعه: 4, خمس: 5, خمسه: 5, ست: 6, سته: 6,
  سبع: 7, سبعه: 7, ثمان: 8, ثمانی: 8, ثمانیه: 8, تسع: 9, تسعه: 9, عشر: 10, عشره: 10,
  // persiska och dari
  دو: 2, سه: 3, چهار: 4, چار: 4, پنج: 5, شش: 6, هفت: 7, هشت: 8, نه: 9, ده: 10,
  یازده: 11, دوازده: 12,
};

/**
 * Jämnar ut arabisk skrift så att samma ord stavat arabiskt eller persiskt får
 * samma form: tashkeel/tatweel bort, alef-varianter -> ا, ي/ى -> ی, ك -> ک, ة -> ه.
 */
function normaliseraArabiska(text) {
  return String(text ?? '')
    .normalize('NFC')
    .replace(/[ً-ٰٟۖ-ۭـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه');
}

/**
 * Skriver om 12-timmarsklockslag ("3:00 PM", "9 am") till 24-timmarsform med
 * minuter ("15:00", "9:00"), så att de jämförs som samma klockslag som 15:00.
 */
function tolvTillTjugofyra(text) {
  return text.replace(/(\d{1,2})(?:[:.](\d{2}))?\s*([ap])\.?\s?m\b\.?/gi, (traff, h, min, ap) => {
    let timme = Number(h);
    if (timme > 12) return traff;
    const pm = ap.toLowerCase() === 'p';
    if (pm && timme < 12) timme += 12;
    if (!pm && timme === 12) timme = 0;
    return ` ${timme}:${min ?? '00'} `;
  });
}

/** Kort tal utan inledande nolla ("06" -> "6"); längre (telefonnummer) lämnas. */
function trimmaNolla(tal) {
  return tal.length === 2 && tal[0] === '0' ? tal.slice(1) : tal;
}

/**
 * Alla tal i en text som en sorterad lista strängar. Tusentalsgrupper
 * ("15 000", "15.000", "15٬000") slås ihop till ett tal; annars är varje
 * siffersvit ett eget tal, så "10:30" och "10.30" ger båda ["10","30"].
 * Tvåsiffriga tal med inledande nolla jämförs utan nollan ("08.00" = "8.0").
 * 12-timmarsklockslag räknas om till 24 timmar. Små tal skrivna som ord
 * (två..tolv, two..twelve, arabiska och persiska ordtal) räknas som siffror.
 */
function hittaTal(text) {
  let t = normaliseraArabiska(normaliseraSiffror(text).replace(/[٬٫]/g, ' '));
  t = tolvTillTjugofyra(t);
  // Sammansatta arabiska tal först, så att "عشر" i "أحد عشر" inte blir 10.
  t = t.replace(/(?:احد|احدی)\s+عشر[ه]?/g, ' 11 ').replace(/(?:اثنا|اثنی|اثنتا|اثنتی)\s+عشر[ه]?/g, ' 12 ');
  const ut = [];
  const re = /\d{1,3}(?:[   .,]\d{3})+(?!\d)|\d+/g;
  let m;
  while ((m = re.exec(t))) ut.push(trimmaNolla(m[0].replace(/[^\d]/g, '')));
  const har = (kartan, ord) => Object.prototype.hasOwnProperty.call(kartan, ord);
  for (const ord of t.toLowerCase().match(/\p{L}+/gu) || []) {
    if (har(ORDTAL, ord)) ut.push(String(ORDTAL[ord]));
    else if (har(ORDTAL_ARABISKA, ord)) ut.push(String(ORDTAL_ARABISKA[ord]));
    else if (ord.length > 2 && /^[وبلفک]/.test(ord) && har(ORDTAL_ARABISKA, ord.slice(1))) {
      // Fästa partiklar: "وأربع" = "och fyra".
      ut.push(String(ORDTAL_ARABISKA[ord.slice(1)]));
    }
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

// ---------------------------------------------------------------------------
// Mekaniskt namnskydd. Ren logik, inga beroenden på skriptets I/O — avsedd att
// kunna flyttas till en framtida översättningsfunktion i produkten.
//
// Före översättningen byts varje skyddat namn (inkl. böjningsformer) mot en
// platshållare ⟦N1⟧, ⟦N2⟧ ...; efter svaret sätts det ursprungliga ordet
// tillbaka. Modellen får aldrig chansen att översätta eller fonetisera namnet.
// ---------------------------------------------------------------------------

// Svenska ändelser som kan hänga på ett skyddat ord ("Skatteverkets", "a-kassan").
const BOJNINGSANDELSER = [
  'erna', 'ernas', 'orna', 'ornas', 'ens', 'ets', 'nas', 'ns', 'na',
  'en', 'et', 'er', 'or', 's', 'n', 'a', 't',
];

const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Regexp som hittar skyddade namn och deras böjningar, längsta namn först. */
function namnMonster(namn, bojningar = []) {
  const alla = [...new Set([...namn, ...bojningar].map(String).filter(Boolean))]
    .sort((a, b) => b.length - a.length);
  if (alla.length === 0) return null;
  const andelser = [...BOJNINGSANDELSER].sort((a, b) => b.length - a.length).map(escRe).join('|');
  return new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${alla.map(escRe).join('|')})(?:${andelser})?(?![\\p{L}\\p{N}])`,
    'giu',
  );
}

/**
 * Byter skyddade namn mot platshållare. Returnerar den maskade texten och
 * tabellen som behövs för att sätta tillbaka dem. Varje förekomst får ett eget
 * nummer, så två likadana namn i samma mening hålls isär.
 */
function skyddaNamn(text, namn, bojningar = []) {
  const re = namnMonster(namn, bojningar);
  const platshallare = [];
  if (!re) return { text: String(text ?? ''), platshallare };
  const maskad = String(text ?? '').replace(re, (traff) => {
    const id = platshallare.length + 1;
    const token = `⟦N${id}⟧`;
    platshallare.push({ id, token, original: traff });
    return token;
  });
  return { text: maskad, platshallare };
}

const OSYNLIGT = '[\\s\\u200e\\u200f\\u061c\\u202a-\\u202e\\u2066-\\u2069]*';
// Tål blanksteg/riktningstecken, östarabiska siffror och dubbelhakar i stället för ⟦ ⟧.
const PLATSHALLARE_RE = new RegExp(
  `(?:⟦|\\[\\[)${OSYNLIGT}[Nn]${OSYNLIGT}([0-9٠-٩۰-۹]+)${OSYNLIGT}(?:⟧|\\]\\])`,
  'g',
);

/**
 * Sätter tillbaka namnen. Rapporterar:
 *  - saknade: namn vars platshållare inte finns i svaret (modellen tappade den)
 *  - forvanskade: platshållarlika bitar som inte går att koppla till ett namn
 *    (okänt nummer, kvarglömda ⟦ ⟧)
 *  - dubblerade: namn vars platshållare förekommer fler gånger än en
 *  - normaliserade: antal platshållare som återställdes trots avvikande skrivsätt
 * ok = inga saknade och inga förvanskade.
 */
function aterstallNamn(text, platshallare) {
  const perId = new Map(platshallare.map((p) => [p.id, p]));
  const antal = new Map();
  const forvanskade = [];
  let normaliserade = 0;
  const ut = String(text ?? '').replace(PLATSHALLARE_RE, (traff, siffror) => {
    const id = Number(normaliseraSiffror(siffror));
    const p = perId.get(id);
    if (!p) {
      forvanskade.push(traff);
      return traff;
    }
    antal.set(id, (antal.get(id) || 0) + 1);
    if (traff !== p.token) normaliserade++;
    return p.original;
  });
  // Kvarglömda hakar som inte ingår i en hel (okänd) platshållare: en halv platshållare.
  for (const rest of ut.replace(PLATSHALLARE_RE, '').match(/[⟦⟧]/g) || []) forvanskade.push(rest);
  const saknade = platshallare.filter((p) => !antal.get(p.id)).map((p) => p.original);
  const dubblerade = platshallare.filter((p) => (antal.get(p.id) || 0) > 1).map((p) => p.original);
  return {
    text: ut.trim(), saknade, forvanskade, dubblerade, normaliserade,
    ok: saknade.length === 0 && forvanskade.length === 0,
  };
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
  normaliseraSiffror, normaliseraArabiska, hittaTal, jamforTal, jamforNamn, likhet, langdkvot,
  bedomMening, sammanfatta, samsta, skyddaNamn, aterstallNamn, namnMonster, BOJNINGSANDELSER, KVOT_MIN, KVOT_MAX, LIKHET_MIN, KOPIA_GRANS,
};
