// AIX27 (2026-10-30): deterministisk kontroll av rättstavningsförslag.
// Ligger i en egen fil med understreck (som _annons.js) eftersom index.js kräver
// att varje export i en domänfil är en promptfunktion.
//
// Förslaget från modellen är en lista [före, efter]. Modellen får aldrig släppa
// igenom en omskrivning eller en tillagd merit, så kontrollen sker i kod, inte
// i prompten. Regeln är avsiktligt snäv: hellre ett förslag för lite än en
// tillagd "erfarenhet" i ett brev som går till en arbetsgivare.
//
//   1. SIFFROR: samma siffergrupper, i samma mängd, före och efter.
//   2. ORD: varje ord i `efter` ska antingen finnas i `före`, vara en
//      stavningsvariant av ett ord i `före` (liten redigeringsdistans), vara
//      hopskrivet/särskrivet av intilliggande ord, eller vara ett litet
//      funktionsord (en/ett, på, att …). Ett nytt innehållsord stoppas.
//   3. STORLEK: ett enskilt förslag rör högst 8 ord, och hela listan högst
//      MAX_ANDRINGAR förslag och en liten andel av texten.

const MAX_ANDRINGAR = 25;
const MAX_ORD_PER_ANDRING = 8;
const MAX_TECKEN_PER_BIT = 120;
/** Högst så stor andel av texten får beröras av förslagen sammanlagt. */
const MAX_ANDEL_BERORD = 0.35;
/** Texten som skickas in kapas här. */
const TEXT_MAX = 4000;

// Små funktionsord får ändras fritt: genus (en/ett), prepositioner,
// pronomen, hjälpverb. Inget av dem är ett substantiv eller en merit.
const FUNKTIONSORD = new Set([
  'en', 'ett', 'de', 'dem', 'den', 'det', 'då', 'än', 'att', 'och', 'ock', 'som', 'av', 'på', 'pa', 'i', 'å',
  'om', 'vi', 'ni', 'du', 'jag', 'han', 'hon', 'hen', 'man', 'mig', 'dig', 'sig', 'oss', 'er', 'min', 'mitt',
  'mina', 'din', 'ditt', 'dina', 'sin', 'sitt', 'sina', 'vår', 'vårt', 'våra', 'ert', 'era', 'har', 'ha', 'hade',
  'är', 'var', 'vara', 'blir', 'bli', 'kan', 'ska', 'skall', 'vill', 'får', 'fick', 'med', 'för', 'från', 'till',
  'hos', 'vid', 'ut', 'upp', 'ner', 'in', 'så', 'nu', 'ju', 'nog', 'inte', 'ej', 'ur', 'åt', 'mot', 'men',
  'eller', 'när', 'där', 'här', 'hur', 'vad', 'vem', 'sa', 'se', 'gå', 'ta', 'ge', 'ger',
]);

/** @returns {string[]} */
function ordLista(text) {
  return String(text ?? '').toLowerCase().match(/[\p{L}]+/gu) || [];
}

/** @returns {string[]} */
function siffror(text) {
  return String(text ?? '').match(/\d+/g) || [];
}

function lika(a, b) {
  if (a.length !== b.length) return false;
  const s = [...a].sort();
  const t = [...b].sort();
  return s.every((v, i) => v === t[i]);
}

function avstand(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 3) return Math.abs(m - n);
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/** Hur många teckenfel ett ord får skilja sig med och ändå räknas som samma ord. */
function tolerans(a, b) {
  const kortast = Math.min(a.length, b.length);
  if (kortast <= 3) return 1;
  return Math.max(1, Math.floor(kortast / 3));
}

function narliggande(ord, kallor) {
  return kallor.some((k) => avstand(ord, k) <= tolerans(ord, k));
}

/** Orden plus varje par av intilliggande ord hopslagna ("hem"+"sida" → "hemsida"). */
function medHopslagna(lista) {
  const ut = [...lista];
  for (let i = 0; i + 1 < lista.length; i++) ut.push(lista[i] + lista[i + 1]);
  return ut;
}

/**
 * Är `efter` en ren stavnings-/grammatikrättning av `fore` — utan nytt innehåll?
 * @returns {{ ok: true } | { ok: false, skal: string }}
 */
function arRattstavning(fore, efter) {
  if (typeof fore !== 'string' || typeof efter !== 'string') return { ok: false, skal: 'ej text' };
  if (!fore.trim() || fore === efter) return { ok: false, skal: 'ingen ändring' };
  if (fore.length > MAX_TECKEN_PER_BIT || efter.length > MAX_TECKEN_PER_BIT) return { ok: false, skal: 'för lång bit' };

  const f = ordLista(fore);
  const e = ordLista(efter);
  if (f.length > MAX_ORD_PER_ANDRING || e.length > MAX_ORD_PER_ANDRING) return { ok: false, skal: 'för många ord' };

  if (!lika(siffror(fore), siffror(efter))) return { ok: false, skal: 'siffror ändrade' };

  // Ett förslag får ändra antalet ord med högst ett (isär-/hopskrivning).
  if (Math.abs(e.length - f.length) > 1) return { ok: false, skal: 'ordantal ändrat' };

  const fMed = medHopslagna(f);
  const eMed = medHopslagna(e);
  const fSet = new Set(f);

  for (const ord of e) {
    if (fSet.has(ord) || FUNKTIONSORD.has(ord)) continue;
    // Ett nytt kort ord som inte är ett funktionsord kunde vara ett substantiv.
    if (ord.length <= 3) return { ok: false, skal: 'nytt kort ord: ' + ord };
    if (narliggande(ord, fMed)) continue;
    // Särskrivning rättad: ordet är en del av ett ord i `före` som hör ihop med grannen.
    const delAvForOrd = f.some((k) => k.length > ord.length && (k.startsWith(ord) || k.endsWith(ord)));
    if (!delAvForOrd) return { ok: false, skal: 'nytt ord: ' + ord };
  }
  // Omvänt: inget innehållsord i `före` får bara försvinna — det vore en
  // borttagen del av texten, inte en rättning. Funktionsord får tas bort
  // ("i i" → "i").
  for (const ord of f) {
    if (e.includes(ord) || FUNKTIONSORD.has(ord) || ord.length <= 2) continue;
    if (narliggande(ord, eMed)) continue;
    const delAvEOrd = e.some((k) => k.length > ord.length && (k.startsWith(ord) || k.endsWith(ord)));
    if (!delAvEOrd) return { ok: false, skal: 'ord borttaget: ' + ord };
  }
  return { ok: true };
}

function raknaForekomster(text, bit) {
  let n = 0;
  let pos = 0;
  while ((pos = text.indexOf(bit, pos)) !== -1) {
    n++;
    pos += Math.max(1, bit.length);
  }
  return n;
}

/**
 * Validerar modellens svar mot texten som skickades. Returnerar bara de förslag
 * som klarar kontrollen; en lista som är för stor avvisas helt.
 *
 * @param {any} value  modellens svar: { andringar: [[före, efter], …] }
 * @param {string} text    texten som skickades in
 */
function validera(value, text) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'rättstavningssvaret var inte ett JSON-objekt' };
  }
  const bas = String(text ?? '').slice(0, TEXT_MAX);
  const rader = Array.isArray(value.andringar) ? value.andringar : null;
  if (!rader) return { ok: false, error: 'rättstavningssvaret saknade ändringslista' };
  if (rader.length > MAX_ANDRINGAR) {
    return { ok: false, error: 'för stor ändringslista (' + rader.length + ' > ' + MAX_ANDRINGAR + ')' };
  }

  const andringar = [];
  const intervall = [];
  let berort = 0;
  for (const rad of rader) {
    const fore = Array.isArray(rad) ? rad[0] : (rad && typeof rad === 'object' ? rad.fore : undefined);
    const efter = Array.isArray(rad) ? rad[1] : (rad && typeof rad === 'object' ? rad.efter : undefined);
    if (typeof fore !== 'string' || typeof efter !== 'string') continue;
    // Bitar som kan förekomma på flera ställen är tvetydiga: vilken ska ändras?
    if (raknaForekomster(bas, fore) !== 1) continue;
    if (!arRattstavning(fore, efter).ok) continue;
    const start = bas.indexOf(fore);
    const slut = start + fore.length;
    if (intervall.some(([s, e]) => start < e && slut > s)) continue;
    intervall.push([start, slut]);
    berort += fore.length;
    andringar.push({ fore, efter });
  }
  // För stor del av texten berörd = en omskrivning, hur små stegen än är.
  if (bas.length > 0 && berort / bas.length > MAX_ANDEL_BERORD) {
    return { ok: false, error: 'förslagen berör för stor del av texten' };
  }
  return { ok: true, value: { andringar } };
}

module.exports = {
  arRattstavning, validera, MAX_ANDRINGAR, TEXT_MAX, MAX_ANDEL_BERORD, FUNKTIONSORD,
};
