/**
 * Delade typer för konsulentvyn (I4, 2026-07-27).
 *
 * Brutna ut ur StaConsultant.tsx så att flikfilerna i ./consultant/ kan dela
 * dem utan att importera tillbaka från huvudfilen — en sådan cirkel hade
 * gjort uppdelningen meningslös.
 */

/** Vilken flik konsulentvyn visar. Flikarna tar emot den för att kunna
 *  navigera vidare (t.ex. "visa deltagaren" från Skattningar). */
export type TabId = 'oversikt' | 'deltagare' | 'skattningar' | 'arbetsplatser' | 'dokument'

/** Sorteringsriktning i tabellerna. */
export type SortDir = 'asc' | 'desc'

/** Skattningsinstrument i STA. */
export type Instrument = 'DOA' | 'WRI' | 'MOHOST' | 'AWP' | 'AWC'

/**
 * Antal items per instrument — verifierat mot AF:s officiella blanketter
 * (sta/SKATTNINGAR-OCH-DEADLINES.md för detaljer).
 *
 * Bor här och inte i AssessmentsTab.tsx: `react-refresh/only-export-components`
 * kräver att en komponentfil bara exporterar komponenter, annars slutar
 * hot reload fungera för filen.
 */
export const ASSESSMENT_ITEM_COUNT: Record<Instrument, number> = {
  DOA: 34,
  WRI: 17,
  MOHOST: 24,
  AWP: 14,
  AWC: 14,
}
