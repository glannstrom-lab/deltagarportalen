/**
 * passSerie — återkommande pass i aktivitetsplanen (RK37, rollspelet 2026-09-27).
 *
 * Passen har ingen seriekolumn: en schemamall och "upprepa varje vecka" (RK28)
 * lägger ut fristående rader. En serie är därför de pass i SAMMA plan som har
 * samma veckodag, tid, rubrik och typ som passet konsulenten valt — det är
 * exakt så mallen och upprepningen skapade dem.
 *
 * "Alla kommande" betyder passet självt och de senare i serien som INTE är
 * markerade. Ett markerat pass är ett utfall — det skrivs aldrig om i efterhand
 * av en ändring i schemat.
 *
 * Plats → pass (RK37): praktikens dagar ur Platser blir arbetsplatspass i
 * planen, så att timmarna räknas i veckosaldot och avtalsloggen.
 *
 * Ren logik, inga databasanrop.
 */

import { addDays, isoWeekday, timmar } from './aktivitetSchema'

export interface SeriePass {
  id: string
  plan_id: string
  date: string
  start_time: string
  end_time: string
  title: string
  activity_type: string
  attendance: string | null
}

function sammaSerie(a: SeriePass, b: SeriePass): boolean {
  return a.plan_id === b.plan_id
    && isoWeekday(a.date) === isoWeekday(b.date)
    && a.start_time === b.start_time
    && a.end_time === b.end_time
    && a.title.trim() === b.title.trim()
    && a.activity_type === b.activity_type
}

/**
 * Passet och alla senare omarkerade pass i samma serie, i datumordning.
 * Passet självt är alltid med (också om det är markerat — då ändras bara det).
 */
export function kommandeISerien<T extends SeriePass>(pass: T, alla: readonly T[]): T[] {
  const senare = alla.filter((s) => s.id !== pass.id && s.date > pass.date && s.attendance === null && sammaSerie(pass, s))
  return [pass, ...senare.sort((a, b) => a.date.localeCompare(b.date))]
}

/**
 * SFT7: samma vecka, annan veckodag. Ett pass på torsdag flyttat till onsdag
 * hamnar dagen före, inte veckan efter — serien behåller sina veckor.
 */
export function flyttaTillVeckodag(datum: string, veckodag: number): string {
  return addDays(datum, veckodag - isoWeekday(datum))
}

export interface PassFlytt { id: string; date: string }

/** Varje pass i serien flyttat till `veckodag` (1–7) i sin egen vecka. */
export function serieFlytt(serie: readonly SeriePass[], veckodag: number): PassFlytt[] {
  return serie.map((s) => ({ id: s.id, date: flyttaTillVeckodag(s.date, veckodag) }))
}

// ---------------------------------------------------------------------------
// Plats → pass
// ---------------------------------------------------------------------------

export interface PlatsPassIndata {
  /** ISO-veckodagar 1–7 som deltagaren är på platsen. */
  veckodagar: readonly number[]
  from: string
  to: string
}

/** Datumen för platsens pass: valda veckodagar från och med `from` till och med `to`. */
export function platsPassDatum({ veckodagar, from, to }: PlatsPassIndata): string[] {
  if (!from || !to || from > to || veckodagar.length === 0) return []
  const dagar = new Set(veckodagar)
  const ut: string[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (dagar.has(isoWeekday(d))) ut.push(d)
  }
  return ut
}

/**
 * Förslagen period: från det senaste av platsens start, planens start och
 * i dag (passerade dagar läggs inte ut som omarkerade pass); till det tidigaste
 * av platsens och planens slut. `till` är null när varken platsen eller
 * planen har ett slut — då finns inget att räkna fram, och konsulenten får
 * ange det.
 */
export function platsPassPeriod(
  plats: { start_date: string | null; end_date: string | null },
  plan: { start_date: string; end_date: string | null },
  idag: string,
): { fran: string; till: string | null } {
  const starter = [plats.start_date, plan.start_date, idag].filter((d): d is string => !!d).sort()
  const fran = starter[starter.length - 1]
  const slut = [plats.end_date, plan.end_date].filter((d): d is string => !!d).sort()[0] ?? null
  return { fran, till: slut }
}

/** Planerade timmar per vecka för passen — att jämföra med platsens h/vecka. */
export function platsPassTimmarPerVecka(veckodagar: readonly number[], start: string, slut: string): number | null {
  if (veckodagar.length === 0 || !start || !slut || slut <= start) return null
  return Math.round(veckodagar.length * timmar(start, slut) * 10) / 10
}
