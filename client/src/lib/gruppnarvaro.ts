/**
 * Gruppnärvaro (RK36, rollspelet 2026-09-27) — ren logik.
 *
 * "Jobbsökarverkstaden har tio deltagare — markera närvaro för hela passet på
 * en skärm i stället för tio deltagarsidor." Ett grupppass finns inte som egen
 * rad i databasen: varje deltagare har sitt eget `activity_sessions`-pass
 * (planen genereras per deltagare ur mallen). Ett grupppass är därför de pass
 * hos konsulentens deltagare som har SAMMA datum, start, slut och titel.
 * Titeln jämförs utan skiftläge och utan omgivande blanksteg — "Jobbsökarverkstad"
 * och "jobbsökarverkstad " är samma pass; "Jobbsökarverkstad 2" är det inte.
 *
 * Närvaron sätts per pass genom `aktivitetsplanApi.markAttendance` — samma väg
 * som Min dag och deltagarsidan, ingen kopia av logiken.
 */
import type { PassIdag } from './dagensPass'

export interface PassGrupp {
  nyckel: string
  date: string
  start_time: string
  end_time: string
  title: string
  pass: PassIdag[]
}

const kort = (t: string) => t.slice(0, 5)

export function gruppNyckel(p: Pick<PassIdag, 'date' | 'start_time' | 'end_time' | 'title'>): string {
  return `${p.date}|${kort(p.start_time)}|${kort(p.end_time)}|${p.title.trim().toLocaleLowerCase('sv-SE')}`
}

/** Passen grupperade, i tidsordning. Deltagarnas ordning inom gruppen följer indata. */
export function grupperaPass(pass: readonly PassIdag[]): PassGrupp[] {
  const grupper = new Map<string, PassGrupp>()
  for (const p of pass) {
    const nyckel = gruppNyckel(p)
    const g = grupper.get(nyckel)
    if (g) g.pass.push(p)
    else grupper.set(nyckel, { nyckel, date: p.date, start_time: kort(p.start_time), end_time: kort(p.end_time), title: p.title.trim(), pass: [p] })
  }
  return [...grupper.values()].sort((a, b) => a.start_time.localeCompare(b.start_time) || a.title.localeCompare(b.title, 'sv'))
}

/** Bara grupper med minst två deltagare — ett ensamt pass markeras där det står. */
export function gemensammaPass(pass: readonly PassIdag[]): PassGrupp[] {
  return grupperaPass(pass).filter((g) => new Set(g.pass.map((p) => p.participant_id)).size >= 2)
}

/** Länken till gruppvyn för ett grupppass. */
export function gruppLank(g: Pick<PassGrupp, 'date' | 'start_time' | 'end_time' | 'title'>): string {
  const q = new URLSearchParams({ datum: g.date, start: g.start_time, slut: g.end_time, titel: g.title })
  return `/consultant/pass/grupp?${q.toString()}`
}

/**
 * Vilka pass "Alla omarkerade närvarande" får röra: omarkerade pass där
 * deltagaren INTE har anmält frånvaro. En anmäld frånvaro ska bedömas, inte
 * skrivas över med närvaro i ett massklick.
 */
export function kanMarkerasNarvarandeIMassa(p: PassIdag): boolean {
  return p.attendance === null && !p.absence_reason
}
