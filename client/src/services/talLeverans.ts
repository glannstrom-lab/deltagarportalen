/**
 * O10 steg 1 (spår O / KF fas 3, 2026-10-18): hur ett svar LEVERERADES, räknat ur
 * taligenkänningens text och tiden mikrofonen var på. Inget ljud sparas, ingen
 * modell anropas — allt räknas här i webbläsaren.
 *
 * Två ärliga begränsningar, som också står i gränssnittet:
 *  - Webbläsarens taligenkänning tar ofta bort "eh" och "öh". De räknas om de
 *    kommer med, men att de saknas betyder inte att de inte sades.
 *  - Tempot är ord per minut MEDAN MIKROFONEN VAR PÅ, pauser inräknade. Det är
 *    ett mått att jämföra sina egna svar med, inte en norm — portalen sätter
 *    inget "rätt" tempo utan belägg.
 */

export interface TalAnalys {
  ord: number
  sekunder: number
  ordPerMinut: number
  utfyllnad: Array<{ ord: string; antal: number }>
}

/** Ord som ofta används som utfyllnad i talad svenska. "typ" räknas inte i "typ av". */
const UTFYLLNAD: Array<{ ord: string; monster: RegExp }> = [
  { ord: 'liksom', monster: /(^|[^\p{L}])liksom(?=$|[^\p{L}])/giu },
  { ord: 'alltså', monster: /(^|[^\p{L}])alltså(?=$|[^\p{L}])/giu },
  { ord: 'asså', monster: /(^|[^\p{L}])asså(?=$|[^\p{L}])/giu },
  { ord: 'typ', monster: /(^|[^\p{L}])typ(?!\s+av\b)(?=$|[^\p{L}])/giu },
  { ord: 'eh', monster: /(^|[^\p{L}])e+h+m*(?=$|[^\p{L}])/giu },
  { ord: 'öh', monster: /(^|[^\p{L}])ö+h+m*(?=$|[^\p{L}])/giu },
  { ord: 'så här', monster: /(^|[^\p{L}])så här(?=$|[^\p{L}])/giu },
]

/** Under så här mycket underlag säger siffrorna ingenting — då visas inget. */
const MINST_SEKUNDER = 5
const MINST_ORD = 5

export function analyseraTal(text: string, sekunder: number): TalAnalys | null {
  const ren = text.trim()
  const ord = ren ? ren.split(/\s+/u).filter((w) => /\p{L}/u.test(w)).length : 0
  if (sekunder < MINST_SEKUNDER || ord < MINST_ORD) return null
  const utfyllnad = UTFYLLNAD
    .map(({ ord: o, monster }) => ({ ord: o, antal: (ren.match(monster) ?? []).length }))
    .filter((u) => u.antal > 0)
    .sort((a, b) => b.antal - a.antal)
  return { ord, sekunder: Math.round(sekunder), ordPerMinut: Math.round(ord / (sekunder / 60)), utfyllnad }
}
