// AIX4 (2026-10-30): hjälpare för "Intervjuberättelse av egna minnen".
// Egen fil med understreck (som _annons.js): index.js kräver att varje export i
// en domänfil är en promptfunktion i ORDNING.
//
// Regeln som bär hela funktionen: berättelsen får bara innehålla det personen
// själv har SAGT. Prompten ber om det, men prompten är en bön — det som gör
// regeln sann är att servern jämför varje steg mot personens egen text och
// stryker det som inte står där (se validatorn i ai.js).

const { normalisera } = require('./_annons');

const STEG = ['situation', 'uppgift', 'handling', 'resultat'];

/** Tak per fält. Totalt ryms högst ~3 500 tecken användartext i prompten. */
const HANDELSE_MAX = 1500;
const SVAR_MAX = 500;
const SVAR_ANTAL = 4;

/** Fasta följdfrågor — används när modellens egen fråga inte duger. Inga förslag på svar. */
const RESERVFRAGOR = {
  situation: 'Var var du och vad hände? Berätta med några meningar hur det såg ut.',
  uppgift: 'Vad var din del i det här — vad skulle just du göra eller ansvara för?',
  handling: 'Vad gjorde du, steg för steg?',
  resultat: 'Vad hände efteråt? Skriv det du minns, även om det är litet. Vet du inte är det också ett svar.',
};

/** Rensar indata till det prompten och validatorn båda utgår från. */
function rensaIndata(data) {
  const handelse = typeof data?.handelse === 'string' ? data.handelse.trim().slice(0, HANDELSE_MAX) : '';
  const svar = (Array.isArray(data?.svar) ? data.svar : [])
    .slice(0, SVAR_ANTAL)
    .map((s) => ({
      steg: STEG.includes(s?.steg) ? s.steg : undefined,
      text: typeof s?.text === 'string' ? s.text.trim().slice(0, SVAR_MAX) : '',
    }))
    .filter((s) => s.text);
  return { handelse, svar };
}

/** Allt personen själv har skrivit, som en text. Frågorna ingår inte — de är inte hennes. */
function anvandarText(data) {
  const { handelse, svar } = rensaIndata(data);
  return [handelse, ...svar.map((s) => s.text)].join('\n');
}

/**
 * Svar som inte är ett innehåll ("vet inte", "ingenting") får inte räknas som
 * ett steg, även om de står ordagrant i texten.
 */
const INGET_SVAR = /^(vet inte|jag vet inte|vet ej|ingen aning|inget|ingenting|nej|minns inte|jag minns inte|-+|\?+)[.!\s]*$/;

/**
 * Står `citat` ordagrant i personens text? Ellipser tillåts som skarvar mellan
 * delar (varje del för sig, i ordning). Under 4 tecken räknas inte.
 */
function citatFinnsIText(citat, text) {
  const bas = normalisera(text);
  const norm = normalisera(citat);
  if (!norm || INGET_SVAR.test(norm)) return false;
  const delar = norm
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

/**
 * Har texten stöd i det personen sagt? Två mätbara villkor:
 *  1. varje tal i texten står även i personens text (ett påhittat "30 %" eller
 *     "tre kunder" fälls här), och
 *  2. högst en femtedel av de längre orden saknar motsvarighet (samma första
 *     fem tecken) i personens text.
 * Det är en grind mot påhitt, inte en korrekturläsare: går den inte igenom
 * byggs sammanställningen i stället av personens egna citat.
 */
function harStodITexten(sammanstallning, text) {
  const bas = normalisera(text);
  const sam = normalisera(sammanstallning);
  const tal = sam.match(/\d+/g) || [];
  for (const t of tal) {
    if (!new RegExp(`(^|\\D)${t}(\\D|$)`).test(bas)) return false;
  }
  const basOrd = new Set((bas.match(/[a-zåäöéü]+/g) || []).map((o) => o.slice(0, 5)));
  const ord = (sam.match(/[a-zåäöéü]+/g) || []).filter((o) => o.length >= 6);
  if (ord.length === 0) return true;
  const saknas = ord.filter((o) => !basOrd.has(o.slice(0, 5)));
  return saknas.length * 5 <= ord.length;
}

module.exports = { STEG, RESERVFRAGOR, rensaIndata, anvandarText, citatFinnsIText, harStodITexten };
