/**
 * ovningsLage — vad Övningar-sidan ska säga om användarens läge (PG9, 2026-09-12).
 *
 * Sidan visade fyra nyckeltal — "119 Övningar totalt / 0 Påbörjade / 0 Aktiva /
 * 119 Ej påbörjade" — för en person som inte börjat. CLAUDE.md: ett tomt fält är
 * en invit, aldrig en nolla. Här räknas läget fram på ett ställe så att UI:t kan
 * välja mellan invit (inget påbörjat) och räkning (något påbörjat), och så att
 * regeln går att testa utan att rendera sidan.
 */

export type Svar = Record<string, Record<string, string | undefined>>

export interface OvningsLage {
  totalt: number
  paborjade: number
  /** Påbörjade övningar där minst ett svar har text. */
  aktiva: number
  /** `invit` = inget påbörjat: visa inbjudan, inga nollor. `rakning` = visa talen > 0. */
  lage: 'invit' | 'rakning'
}

export function ovningsLage(totalt: number, svar: Svar): OvningsLage {
  const paborjade = Object.keys(svar).length
  const aktiva = Object.values(svar).filter(
    (s) => Object.values(s).some((v) => typeof v === 'string' && v.trim().length > 0),
  ).length
  return { totalt, paborjade, aktiva, lage: paborjade === 0 ? 'invit' : 'rakning' }
}
