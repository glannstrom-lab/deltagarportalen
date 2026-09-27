/**
 * RK22 (rollspelet 2026-09-27): katalogposterna som seedades 2026-09-13
 * (migrationen 20260913000000_pg18_katalog_seed_testorgs.sql) bär
 * beskrivningen `Ur schemamallen "…" (seedad 2026-09-13, PG18).` — en
 * utvecklaranteckning om varifrån raden kom, som visades för en köpare.
 *
 * Den riktiga rättelsen är att tömma kolumnen i databasen (se rapporten);
 * tills dess, och om samma seed körs igen, visas en sådan beskrivning inte.
 * Allt annat konsulenten skrivit visas oförändrat.
 */
const SEEDMARKERING = /\(seedad \d{4}-\d{2}-\d{2}[^)]*\)\.?\s*$/i

export function synligBeskrivning(beskrivning: string | null | undefined): string | null {
  const text = (beskrivning ?? '').trim()
  if (!text || SEEDMARKERING.test(text)) return null
  return text
}
