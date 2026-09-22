/**
 * Datum i svensk tid för edge-funktionerna (2026-09-22).
 *
 * Edge-runtimen kör i UTC. `toISOString().slice(0, 10)` och
 * `toLocaleDateString('sv-SE', …)` utan `timeZone` ger därför UTC-dygnet —
 * mellan 00:00 och 02:00 svensk sommartid (01:00 vintertid) är det GÅRDAGENS
 * datum. Två synliga fall rättades samtidigt:
 *   - `send-invite-email`: inbjudan skapas med `expires_at = now() + 7 days`.
 *     En inbjudan skapad 00:30 svensk tid fick "Inbjudan är giltig till" en dag
 *     för tidigt i mejlet.
 *   - `ai-industry-radar`: `lastUpdated` fick gårdagens datum samma timmar.
 */

export const SVENSK_TIDSZON = 'Europe/Stockholm'

/** YYYY-MM-DD för dygnet i Sverige vid tidpunkten `d`. */
export function datumISverige(d: Date = new Date()): string {
  // sv-SE formaterar redan som YYYY-MM-DD.
  return d.toLocaleDateString('sv-SE', { timeZone: SVENSK_TIDSZON, year: 'numeric', month: '2-digit', day: '2-digit' })
}

/** Datum i svensk klartext ("30 september 2026") för dygnet i Sverige. */
export function svensktDatum(
  d: Date,
  format: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' },
): string {
  return d.toLocaleDateString('sv-SE', { ...format, timeZone: SVENSK_TIDSZON })
}
