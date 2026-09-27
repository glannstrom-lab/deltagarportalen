/**
 * egenrapport — deltagarens egna uppgifter som väntar på konsulentens kvittens
 * (RK15, rollspelet 2026-09-27).
 *
 * Annas söndagspass "Eget jobbsökande" 08–17 (9 h, egen redovisning) lyfte
 * veckans eget jobbsökande till 12 h utan att någon bekräftat något:
 * veckosaldot summerade PLANERADE timmar eget jobbsökande. Deltagarsidan gav
 * dessutom ingen närvaroknapp för passet, medan Min dag erbjöd
 * Närvarande/Frånvaro/Sjuk på samma pass.
 *
 * Regeln här, och i alla konsulentvyer som använder den:
 *   · ett pass som deltagaren själv redovisat (eget jobbsökande) eller checkat
 *     in på, som inte har någon närvaromarkering och vars dag har kommit,
 *     VÄNTAR PÅ KVITTENS
 *   · bara kvitterade timmar (närvarande/extern) räknas som utfört eget
 *     jobbsökande; planerade är en avsikt
 *
 * Ren logik, inga databasanrop. Anvisade pass räknas som förut (arNarvaro i
 * aktivitetSchema); det här ändrar bara hur egenrapporterna visas och räknas.
 */
import { addDays, arNarvaro, minuterMellan, veckansMandag, type Attendance } from './aktivitetSchema'

export interface EgenrapportPass {
  date: string
  start_time: string
  end_time: string
  activity_type: string
  attendance: Attendance | null
  self_checkin_at?: string | null
}

export function arEgenrapport(s: Pick<EgenrapportPass, 'activity_type' | 'self_checkin_at'>): boolean {
  return s.activity_type === 'jobsearch_own' || !!s.self_checkin_at
}

/** Egenrapporterat, omarkerat och dagen har kommit. */
export function vantarPaKvittens(s: EgenrapportPass, idag: string): boolean {
  return s.attendance === null && s.date <= idag && arEgenrapport(s)
}

export interface EgetJobbsokSaldo {
  /** Timmar eget jobbsökande som konsulenten kvitterat (närvarande/extern). */
  kvitteradeTimmar: number
  /** Timmar eget jobbsökande som väntar på kvittens. */
  vantarTimmar: number
  /** Alla pass i veckan (även anvisade med incheckning) som väntar på kvittens. */
  antalVantar: number
}

export function egetJobbsokSaldo(sessions: readonly EgenrapportPass[], datumIVeckan: string, idag: string): EgetJobbsokSaldo {
  const mandag = veckansMandag(datumIVeckan)
  const sondag = addDays(mandag, 6)
  let kvitt = 0
  let vantar = 0
  let antal = 0
  for (const s of sessions) {
    if (s.date < mandag || s.date > sondag) continue
    const min = minuterMellan(s.start_time, s.end_time)
    if (vantarPaKvittens(s, idag)) {
      antal += 1
      if (s.activity_type === 'jobsearch_own') vantar += min
    } else if (s.activity_type === 'jobsearch_own' && arNarvaro(s.attendance)) {
      kvitt += min
    }
  }
  const h = (m: number) => Math.round((m / 60) * 10) / 10
  return { kvitteradeTimmar: h(kvitt), vantarTimmar: h(vantar), antalVantar: antal }
}
