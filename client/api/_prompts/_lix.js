// AIX25 (2026-10-27): LIX-mått för att pröva att Lätt svenska-svaren faktiskt är lätta.
// LIX = ord / meningar + 100 * långa ord (över sex tecken) / ord.
// Tolkning (Björnsson): under 30 mycket lättläst, 30–40 lättläst, 40–50 medelsvår,
// över 50 svår. Ren funktion utan beroenden, delas av vitest-grinden och
// e2e/latt-ai-prod-rok.cjs.

/** Lätt svenska-grinden: svar som hamnar över taket underkänns. */
const LIX_TAK_LATT = 40;

/**
 * @param {string} text
 * @returns {{ ord: number, meningar: number, langaOrd: number, lix: number }}
 */
function lix(text) {
  const rent = String(text || '')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[*_`#>]/g, ' ');
  const ord = rent.match(/[A-Za-zÅÄÖåäöÉéÜü0-9]+(?:[-'][A-Za-zÅÄÖåäöÉéÜü0-9]+)*/g) || [];
  const meningar = Math.max(1, rent.split(/[.!?:]+(?:\s|$)|\n+/).filter((m) => /[A-Za-zÅÄÖåäö0-9]/.test(m)).length);
  const langaOrd = ord.filter((o) => o.length > 6).length;
  if (ord.length === 0) return { ord: 0, meningar: 0, langaOrd: 0, lix: 0 };
  return { ord: ord.length, meningar, langaOrd, lix: ord.length / meningar + (100 * langaOrd) / ord.length };
}

module.exports = { lix, LIX_TAK_LATT };
