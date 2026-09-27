/**
 * aktivitetslogg — avtalskravet på aktivitetstid (RM4).
 *
 * Rusta och matcha, FFU §4.1.1: deltagaren ska ha aktiviteter minst
 *   1 timme per vecka under månad 1–6, och
 *   2 timmar per vecka under månad 7–12
 * räknat från planens startdatum. Efter månad 12 finns inget krav i avtalet
 * och veckan bedöms inte. Minst hälften av aktiviteterna ska vara fysiska,
 * och den periodiska rapporten ska visa att minst 50 % var fysiska per
 * deltagare. 50 %-kravet gäller AKTIVITETERNA — de individuella mötena
 * (RM3) är ett annat krav med en annan regel.
 *
 * Vad som räknas som närvarotid: ANVISADE pass (`arAnvisad`) med `present`
 * eller `external`. Frånvaro räknas aldrig, inte heller giltig eller
 * sjukintygad. Deltagarens eget jobbsökande (`jobsearch_own`) räknas inte —
 * varken mot timkravet eller i andelen fysiska — eftersom avtalet räknar
 * aktiviteter leverantören håller i (RR1, 2026-09-27: loggen gav "3 av 4
 * veckor uppfyllda" för en deltagare vars enda närvaro var egen jobbsökning
 * hemifrån, medan Aktivitet-fliken sa "Närvaro 0 h" för samma vecka).
 *
 * Vad som räknas som fysiskt: `activity_type === 'workplace'` eller ett
 * ifyllt `location`. Portalen har ingen egen flagga för fysisk/digital, så
 * det här är en härledning — kortet skriver ut regeln så konsulenten vet
 * vad siffran bygger på.
 *
 * Veckor: måndag–söndag, lokal tid. Bedömda veckor är de som överlappar
 * BÅDE perioden och planens giltighetstid. Timmarna i en vecka räknas över
 * hela veckan även när periodens gräns går mitt i den — anroparen ska
 * därför skicka pass för hela veckorna (se `veckogranser`).
 *
 * Ren logik, inga databasanrop. Ett tal utan underlag är `null`, aldrig 0.
 */

import type { ActivityPlan, ActivitySession } from './aktivitetApi'
import { addDays, arAnvisad, arNarvaro, parseLocalDate, timmar, veckansMandag } from './aktivitetSchema'

export interface Period {
  from: string
  to: string
}

export interface Veckobedomning {
  mandag: string
  /** Planmånad (1-baserad) som veckans måndag faller i. */
  planManad: number
  kravTimmar: number
  narvaroTimmar: number
  uppfylld: boolean
}

export interface Avtalskrav {
  planId: string
  participantId: string
  veckor: Veckobedomning[]
  veckorUppfyllda: number
  veckorTotalt: number
  /** Närvaropass i de bedömda veckorna. */
  passNarvaro: number
  passFysiska: number
  /** 0–1, eller `null` när inget närvaropass finns — aldrig 0 % utan underlag. */
  andelFysiska: number | null
}

type PlanFalt = Pick<ActivityPlan, 'id' | 'participant_id' | 'start_date' | 'end_date'>
type SessionFalt = Pick<ActivitySession, 'plan_id' | 'date' | 'start_time' | 'end_time' | 'attendance' | 'activity_type' | 'location'>


/** Planmånad (1 = startmånaden) för ett datum. Datum före start ger 1. */
export function planManad(startDate: string, datum: string): number {
  if (datum <= startDate) return 1
  const s = parseLocalDate(startDate)
  const d = parseLocalDate(datum)
  let manader = (d.getFullYear() - s.getFullYear()) * 12 + (d.getMonth() - s.getMonth())
  if (d.getDate() < s.getDate()) manader -= 1
  return manader + 1
}

/** Timkravet per vecka för en planmånad; `null` efter månad 12 (inget krav i avtalet). */
export function kravTimmarForManad(manad: number): number | null {
  if (manad <= 6) return 1
  if (manad <= 12) return 2
  return null
}

export function arFysiskt(s: Pick<ActivitySession, 'activity_type' | 'location'>): boolean {
  return s.activity_type === 'workplace' || (s.location !== null && s.location.trim() !== '')
}

/** `YYYY-MM` → månadens första och sista dag. */
export function manadGranser(ym: string): Period {
  const [ar, manad] = ym.split('-').map(Number)
  const sista = new Date(ar, manad, 0).getDate()
  const mm = String(manad).padStart(2, '0')
  return { from: `${ar}-${mm}-01`, to: `${ar}-${mm}-${String(sista).padStart(2, '0')}` }
}

/** Hela veckor (mån–sön) som täcker perioden — det intervall passen ska hämtas för. */
export function veckogranser({ from, to }: Period): Period {
  return { from: veckansMandag(from), to: addDays(veckansMandag(to), 6) }
}

/**
 * Bedömer en plan mot avtalskravet i en period. Perioden bör inte sträcka
 * sig in i en påbörjad vecka — en vecka som inte är slut kan inte ha
 * uppfyllt något; anroparen klipper `to` vid senaste söndag.
 */
export function avtalskravPerDeltagare(
  plan: PlanFalt,
  sessions: readonly SessionFalt[],
  period: Period,
): Avtalskrav {
  const start = period.from > plan.start_date ? period.from : plan.start_date
  const slut = plan.end_date !== null && plan.end_date < period.to ? plan.end_date : period.to

  const egna = sessions.filter((s) => s.plan_id === plan.id && arAnvisad(s) && arNarvaro(s.attendance))
  const veckor: Veckobedomning[] = []

  if (start <= slut) {
    for (let mandag = veckansMandag(start); mandag <= slut; mandag = addDays(mandag, 7)) {
      const sondag = addDays(mandag, 6)
      const manad = planManad(plan.start_date, mandag)
      const krav = kravTimmarForManad(manad)
      if (krav === null) break
      const narvaro = egna
        .filter((s) => s.date >= mandag && s.date <= sondag)
        .reduce((sum, s) => sum + timmar(s.start_time, s.end_time), 0)
      const narvaroTimmar = Math.round(narvaro * 10) / 10
      veckor.push({ mandag, planManad: manad, kravTimmar: krav, narvaroTimmar, uppfylld: narvaroTimmar >= krav })
    }
  }

  const forsta = veckor[0]?.mandag
  const sista = veckor.length > 0 ? addDays(veckor[veckor.length - 1].mandag, 6) : undefined
  const iBedomda = forsta !== undefined && sista !== undefined
    ? egna.filter((s) => s.date >= forsta && s.date <= sista)
    : []
  const passFysiska = iBedomda.filter(arFysiskt).length

  return {
    planId: plan.id,
    participantId: plan.participant_id,
    veckor,
    veckorUppfyllda: veckor.filter((v) => v.uppfylld).length,
    veckorTotalt: veckor.length,
    passNarvaro: iBedomda.length,
    passFysiska,
    andelFysiska: iBedomda.length === 0 ? null : passFysiska / iBedomda.length,
  }
}

/**
 * Senaste söndag vars vecka är ÖVER, sett från `idag` (lokal tid, se
 * `formatLocalDate`). En vecka är avslutad först när söndagen har passerat —
 * på söndagen själv pågår den fortfarande.
 *
 * RR22 (2026-09-27): funktionen gav tidigare dagens datum när det var söndag,
 * så "Avslutade veckor" tog med innevarande vecka och kunde underkänna den
 * medan deltagaren fortfarande hade pass kvar samma dag.
 */
export function senasteAvslutadeSondag(idag: string): string {
  return addDays(veckansMandag(idag), -1)
}
