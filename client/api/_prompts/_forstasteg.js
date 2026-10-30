// AIX7 (2026-10-30): kontroll av "första steget i dag" i kompetensgapet.
// Egen fil med understreck (som _annons.js).
//
// Steget ska vara något personen gör själv, hemifrån, på ungefär 15 minuter,
// utan kostnad. Det går inte att bevisa att något är gratis, men det går att
// stryka allt som luktar kurs, anordnare, köp eller belopp — det är de påhitt
// som kostat förtroende förut (se kommentaren vid `kompetensgap` i karriar.js).
// Steget stryks hellre än att visas misstänkt: planen står kvar utan det.

/** Typerna klienten kan mappa till en artikel. Allt annat blir "ingen länk". */
const STEG_TYPER = ['kartlagga', 'natverka', 'utveckla', 'cv'];

const FOR_LANGT = 220;

/** Ord som gör steget till något annat än en gratis handling på 15 minuter. */
const FORBJUDET = [
  /\bkurs(er|en|erna)?\b/i,
  /\butbildning(ar|en|arna)?\b/i,
  /\banm[äa]l(an|ning|a|er)?\b/i,
  /\bansök(a|er|an)?\s+(till|om)\b/i,
  /\b(k[öo]p(a|er)?|bet(ala|alar)|prenumer\w+|abonnemang|avgift|betald|premium)\b/i,
  /\b(komvux|yrkesh[öo]gskola|yh-?\w*|folkh[öo]gskola|bootcamp|certifier\w+|diplom\w*)\b/i,
  /\b(udemy|coursera|linkedin learning|youtube|skillshare|duolingo)\b/i,
  /\b(AB|HB|KB)\b/,
  /\bwww\.|https?:|\.(se|com|nu|org)\b/i,
  /\d[\d\s]*\s?(kr|kronor|sek|:-|€|\$|%)/i,
];

/**
 * Returnerar steget om det duger, annars null. "0 kr" får nämnas av modellen;
 * varje annat tal med valuta fälls.
 */
function rensaForstaSteg(v) {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (t.length < 8 || t.length > FOR_LANGT) return null;
  const utanNollkr = t.replace(/\b0\s?(kr|kronor)\b/gi, '');
  if (FORBJUDET.some((re) => re.test(utanNollkr))) return null;
  return t;
}

/** Okänd typ → undefined (ingen artikellänk), aldrig en gissad. */
function rensaStegTyp(v) {
  return typeof v === 'string' && STEG_TYPER.includes(v.trim()) ? v.trim() : undefined;
}

module.exports = { STEG_TYPER, rensaForstaSteg, rensaStegTyp };
