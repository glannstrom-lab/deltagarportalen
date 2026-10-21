/**
 * KC3 (2026-10-21): pseudonymisering före AI för organisationskonton.
 *
 * B29 maskerar kontrolluppgifter (personnummer, konto, e-post, telefon) för
 * alla. Namnet fick däremot följa med, eftersom CV och brev behöver det
 * ("NEVER STRIP: Namn" i src/lib/piiSanitizer.ts). För konton som hör till en
 * organisation gäller nu kommunens krav: namn och födelseuppgifter lämnar inte
 * servern. De byts mot platshållare här och sätts tillbaka i svaret, så att
 * brevet fortfarande säger "Anna" för Anna.
 *
 * Vad som ersätts:
 *   - Användarens EGET för- och efternamn ur `profiles` (det är det enda namn
 *     vi säkert vet är ett namn; fritext har ingen namnigenkänning).
 *   - Födelseuppgifter med en ledtråd före: "född 1985", "f. 1985-03-12",
 *     "födelseår: 1985", "born 1985", "date of birth: …".
 *   - Ålder med en ledtråd: "45 år gammal", "jag är 45 år", "ålder: 45",
 *     "45-åring", "aged 45", "45 years old".
 *   - Kön som fält: "kön: kvinna", "gender: male".
 *
 * Vad som INTE ersätts, och sägs ärligt i ROADMAP: andra personers namn i
 * fritext, och pronomen ("hon", "han") — kön går inte att ta bort ur löpande
 * text utan att texten slutar fungera.
 *
 * Konsulentfunktionerna skickar redan aldrig deltagarens namn
 * (_prompts/konsulent.js), så det här rör konsulentens eget namn, om det
 * står i texten.
 */

const NAMN_PLATSHALLARE = { first: '[FÖRNAMN]', last: '[EFTERNAMN]' };

/** Escapa för RegExp. */
function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** "anna" → "Anna". */
function versalStart(s) {
  return s.charAt(0).toLocaleUpperCase('sv-SE') + s.slice(1).toLocaleLowerCase('sv-SE');
}

/**
 * Delar ett namnfält i ord som ska ersättas. "Anna-Karin" ger både
 * "Anna-Karin" och delarna, så att "Anna" ensam också fångas. Ord kortare än
 * två bokstäver hoppas över (initialer ger för många falska träffar).
 */
function namnord(falt) {
  if (typeof falt !== 'string') return [];
  const ord = new Set();
  for (const helt of falt.trim().split(/\s+/)) {
    if (helt.length >= 2) ord.add(helt);
    for (const del of helt.split('-')) if (del.length >= 2) ord.add(del);
  }
  return [...ord];
}

/**
 * Bygger ersättningslistan för en användare. Matchar bara skrivsätt som är
 * namn — som i profilen, med versal först, eller helt i versaler (CV-rubriker).
 * Gemener matchas inte: efternamnet "Berg" ska inte ta ordet "berg".
 */
function byggNamnregler(profil) {
  /** @type {Array<{ ord: string, platshallare: string }>} */
  const regler = [];
  const forn = namnord(profil?.first_name);
  const eftern = namnord(profil?.last_name);
  // full_name täcker konton där bara det fältet är ifyllt: första ordet är
  // förnamn, resten efternamn.
  if (forn.length === 0 && eftern.length === 0 && typeof profil?.full_name === 'string') {
    const delar = profil.full_name.trim().split(/\s+/);
    forn.push(...namnord(delar[0] || ''));
    eftern.push(...namnord(delar.slice(1).join(' ')));
  }
  for (const o of forn) regler.push({ ord: o, platshallare: NAMN_PLATSHALLARE.first });
  for (const o of eftern) regler.push({ ord: o, platshallare: NAMN_PLATSHALLARE.last });
  // Längst först: "Anna-Karin" före "Anna".
  regler.sort((a, b) => b.ord.length - a.ord.length);
  return regler.map(({ ord, platshallare }) => {
    const varianter = [...new Set([ord, versalStart(ord), ord.toLocaleUpperCase('sv-SE')])].map(esc);
    return {
      ord,
      platshallare,
      re: new RegExp(`(?<![\\p{L}\\p{N}])(?:${varianter.join('|')})(?![\\p{L}\\p{N}])`, 'gu'),
    };
  });
}

// Ledtråden fångas i grupp 1 och står kvar; bara värdet ersätts.
const DATUM = String.raw`(?:\d{4}-\d{2}-\d{2}|\d{1,2}[ ./-]\s?(?:\d{1,2}|[A-Za-zÅÄÖåäö]{3,10})[ ./-]\s?\d{2,4}|(?:19|20)\d{2})`;
const FODELSE_REGLER = [
  // `\b` är ASCII-only i JS och ser ingen ordgräns före "å" — därav lookbehind.
  { typ: 'FÖDD', re: new RegExp(String.raw`((?<![\p{L}\p{N}])(?:född|f\.|födelseår|födelsedatum|born|date of birth|DOB|year of birth)\s*:?\s*(?:den\s+|in\s+|on\s+)?)(${DATUM})`, 'giu') },
  { typ: 'ÅLDER', re: /((?<![\p{L}\p{N}])(?:ålder|age|aged)\s*:?\s*)(\d{1,2})(?![\p{N}])/giu },
  { typ: 'ÅLDER', re: /()((?<![\p{N}])\d{1,2}\s*(?:år gammal|år ung|years old|year old|-åring|-årig))/giu },
  { typ: 'ÅLDER', re: /((?<![\p{L}\p{N}])(?:jag är|i am|I'm)\s+)(\d{1,2}\s*(?:år|years))(?![\p{L}])/giu },
  { typ: 'KÖN', re: /((?<![\p{L}\p{N}])(?:kön|gender|sex)\s*:\s*)(kvinna|man|icke-binär|annat|female|male|woman|non-binary|other)(?![\p{L}])/giu },
];

/**
 * Skapar en pseudonymiserare för en användare. Returnerar ett objekt med
 * `in` (ersätter i allt som skickas) och `ut` (sätter tillbaka i svaret).
 * Platshållarna för ålder och födelse numreras, så att återställningen
 * sätter tillbaka exakt det som stod.
 *
 * @param {{ first_name?: string|null, last_name?: string|null, full_name?: string|null } | null} profil
 */
function skapaPseudonymiserare(profil) {
  const namnregler = byggNamnregler(profil);
  /** @type {Map<string, string>} platshållare → original */
  const karta = new Map();
  for (const r of namnregler) {
    // Profilens skrivsätt är det som sätts tillbaka.
    if (!karta.has(r.platshallare)) {
      karta.set(r.platshallare, r.platshallare === NAMN_PLATSHALLARE.first
        ? (profil?.first_name || (profil?.full_name || '').trim().split(/\s+/)[0] || '')
        : (profil?.last_name || (profil?.full_name || '').trim().split(/\s+/).slice(1).join(' ') || ''));
    }
  }
  let nummer = 0;
  /** @type {Map<string, string>} original → platshållare, så att samma värde får samma platshållare */
  const omvand = new Map();

  /** @param {string} text */
  function inText(text) {
    let ut = text;
    for (const { re, typ } of FODELSE_REGLER) {
      ut = ut.replace(re, (_m, ledtrad, varde) => {
        let ph = omvand.get(varde);
        if (!ph) {
          nummer += 1;
          ph = `[${typ}-${nummer}]`;
          omvand.set(varde, ph);
          karta.set(ph, varde);
        }
        return `${ledtrad}${ph}`;
      });
    }
    for (const r of namnregler) ut = ut.replace(r.re, r.platshallare);
    return ut;
  }

  /** @param {unknown} v @param {(s: string) => string} f @returns {any} */
  function djupt(v, f, djup = 0) {
    if (djup > 12) return v;
    if (typeof v === 'string') return f(v);
    if (Array.isArray(v)) return v.map((x) => djupt(x, f, djup + 1));
    if (v && typeof v === 'object') {
      /** @type {Record<string, unknown>} */
      const o = {};
      for (const [k, x] of Object.entries(v)) o[k] = djupt(x, f, djup + 1);
      return o;
    }
    return v;
  }

  /** @param {string} text */
  function utText(text) {
    if (karta.size === 0 || text.indexOf('[') === -1) return text;
    let ut = text;
    // Skiftlägesokänsligt: modellen skriver ibland "[Förnamn]".
    for (const [ph, original] of karta) ut = ut.replace(new RegExp(esc(ph), 'giu'), () => original);
    return ut;
  }

  return {
    /** Antal namnord som ersätts — 0 betyder att profilen saknar namn. */
    namnord: namnregler.length,
    /** Läggs sist i systemprompten, så att modellen skriver platshållarna orörda. */
    instruktion:
      'Underlaget är pseudonymiserat: namn, ålder och födelseuppgifter står som platshållare i hakparentes, t.ex. [FÖRNAMN], [EFTERNAMN], [ÅLDER-1]. Skriv platshållarna exakt som de står där de behövs — de ersätts med de riktiga uppgifterna innan svaret visas. Kommentera dem aldrig och hitta inte på något i deras ställe.',
    in: (/** @type {unknown} */ v) => djupt(v, inText),
    ut: (/** @type {unknown} */ v) => djupt(v, utText),
    /**
     * Återställare för en ström. En platshållare kan delas mellan två
     * tokens ("[FÖR" + "NAMN]"), så en öppen hakparentes i slutet hålls kvar
     * tills den stängts eller blivit för lång för att vara en platshållare.
     */
    strom() {
      let kvar = '';
      return {
        /** @param {string} token */
        push(token) {
          kvar += token;
          const oppen = kvar.lastIndexOf('[');
          if (oppen !== -1 && kvar.indexOf(']', oppen) === -1 && kvar.length - oppen <= 16) {
            const klart = kvar.slice(0, oppen);
            kvar = kvar.slice(oppen);
            return utText(klart);
          }
          const klart = kvar;
          kvar = '';
          return utText(klart);
        },
        flush() {
          const klart = kvar;
          kvar = '';
          return utText(klart);
        },
      };
    },
  };
}

/**
 * Hämtar användarens namn. Kastar vid uppslagsfel: för ett organisationskonto
 * är löftet att namnet inte lämnar servern, och det kan vi inte hålla utan att
 * veta vad namnet är (fail closed, samma policy som organisationsgrinden).
 *
 * @param {any} supabase den tokenbärande klienten (RLS: egen rad)
 * @param {string} userId
 */
async function hamtaNamn(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, full_name')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(`namnuppslag: ${error.message}`);
  return data || null;
}

module.exports = { skapaPseudonymiserare, hamtaNamn, NAMN_PLATSHALLARE };
