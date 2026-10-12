/**
 * franvaroperiod — hur länge en sammanhängande sjukfrånvaro (eller frånvaro för
 * vård av barn) har pågått, räknat ur passen. Delas av två regler:
 *
 *   - KSL19 (kommun): läkarintyg behövs från dag 8 (`lakarintygDag8`).
 *   - KSL20 (Rusta och matcha): ny avvikelserapport dag 8 vid fortsatt
 *     frånvaro, AFFS 2023:1 § 10 (`avvikelseDag8`).
 *
 * ANTAGANDEN (obelagda i underlaget docs/ksl19-20-underlag.md, 1.3 b):
 *   1. "Dag" är KALENDERDAGAR från första sjukdagen — inte aktivitetsdagar.
 *      Om lagen räknar annat ändras bara `DAG_ATTA` och `dagarMellan`.
 *   2. Portalen ser bara dagar som har pass i planen. En period räknas till
 *      DEN SENASTE sjuka passdagen — ingen extrapolering till i dag. Talet är
 *      därför en nedre gräns: vi flaggar hellre sent än påstår för mycket.
 *   3. Perioden bryts av en dag där något pass inte är sjukt: närvarande,
 *      annan frånvaro, eller ett passerat pass som ingen markerat (okänt).
 *   4. Perioden är "pågående" om dess sista dag ligger högst PAGAENDE_DAGAR
 *      före i dag (så en helg utan pass inte släcker den).
 *
 * Fakta, aldrig bedömning: ingenting här avgör om frånvaron är godtagbar.
 * Ren logik, inga databasanrop.
 */

import { addDays } from './aktivitetSchema'

/** Första dagen läkarintyg/ny rapport behövs, räknat som dag 1 = första sjukdagen. */
export const DAG_ATTA = 8
/** En period vars senaste dag ligger längre bak än så här räknas inte som pågående. */
export const PAGAENDE_DAGAR = 4

export type FranvaroSlag = 'sick' | 'child_care'

export interface PeriodPass {
  date: string
  attendance: string | null
  absence_reason?: string | null
  sick_certificate_received?: boolean | null
  af_notified_at?: string | null
}

export interface Franvaroperiod<P extends PeriodPass = PeriodPass> {
  /** Första och sista dagen (YYYY-MM-DD) som ett pass visar frånvaron. */
  start: string
  slut: string
  /** Kalenderdagar från start till slut, båda inräknade. Nedre gräns. */
  dagar: number
  /** Perioden börjar på deltagarens första pass vi ser — den kan ha börjat tidigare. */
  kanVaraLangre: boolean
  /** Periodens pass, äldsta först. */
  pass: P[]
}

/** Hela kalenderdagar från `a` till `b` (YYYY-MM-DD), `b` senare ger positivt tal. */
export function dagarMellan(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000)
}

function arFranvaro(p: PeriodPass, slag: FranvaroSlag): boolean {
  if (slag === 'sick') return p.attendance === 'sick_certified' || (p.attendance === null && p.absence_reason === 'sick')
  return p.absence_reason === 'child_care' && (p.attendance === null || p.attendance === 'absent_valid')
}

/**
 * Den pågående sammanhängande frånvaroperioden för EN deltagare, eller null.
 * `pass` är deltagarens pass (alla datum; framtida ignoreras).
 */
export function pagaendeFranvaro<P extends PeriodPass>(
  pass: readonly P[],
  idag: string,
  slag: FranvaroSlag = 'sick',
): Franvaroperiod<P> | null {
  const perDag = new Map<string, P[]>()
  for (const p of pass) {
    if (p.date > idag) continue
    const lista = perDag.get(p.date) ?? []
    lista.push(p)
    perDag.set(p.date, lista)
  }
  const dagar = [...perDag.keys()].sort()
  if (dagar.length === 0) return null

  // Bakifrån: den senaste dagen måste vara frånvaro, och perioden går så långt
  // bakåt som varje dag är frånvaro hela vägen.
  const sistaDag = dagar[dagar.length - 1]
  const dagArFranvaro = (d: string) => (perDag.get(d) ?? []).every((p) => arFranvaro(p, slag))
  if (!dagArFranvaro(sistaDag)) return null
  if (dagarMellan(sistaDag, idag) > PAGAENDE_DAGAR) return null

  let i = dagar.length - 1
  while (i > 0 && dagArFranvaro(dagar[i - 1])) i -= 1
  const periodDagar = dagar.slice(i)
  return {
    start: periodDagar[0],
    slut: sistaDag,
    dagar: dagarMellan(periodDagar[0], sistaDag) + 1,
    kanVaraLangre: i === 0,
    pass: periodDagar.flatMap((d) => perDag.get(d) ?? []),
  }
}

/** Dagen då dag 8 infaller för en period som börjar `start`. */
export function dagAtta(start: string): string {
  return addDays(start, DAG_ATTA - 1)
}

/**
 * KSL19: läkarintyg behövs från dag 8. Returnerar perioden när den har pågått
 * mer än sju dagar och intyget inte redan kommit in på periodens sista pass.
 */
export function lakarintygDag8<P extends PeriodPass>(pass: readonly P[], idag: string): Franvaroperiod<P> | null {
  const period = pagaendeFranvaro(pass, idag, 'sick')
  if (!period || period.dagar < DAG_ATTA) return null
  const sista = period.pass[period.pass.length - 1]
  if (sista.sick_certificate_received) return null
  return period
}

/**
 * KSL20: ny avvikelserapport dag 8 vid fortsatt frånvaro (sjukdom eller vård av
 * barn). Klar när något pass på eller efter dag 8 har antecknats som underrättat
 * (`af_notified_at`). Annars returneras perioden.
 */
export function avvikelseDag8<P extends PeriodPass>(pass: readonly P[], idag: string, slag: FranvaroSlag = 'sick'): Franvaroperiod<P> | null {
  const period = pagaendeFranvaro(pass, idag, slag)
  if (!period || period.dagar < DAG_ATTA) return null
  const dag8 = dagAtta(period.start)
  if (period.pass.some((p) => p.date >= dag8 && !!p.af_notified_at)) return null
  return period
}

/** Flaggtexten på deltagarsidan, eller null när ingen flagga ska visas. */
export function lakarintygText(period: Pick<Franvaroperiod, 'dagar' | 'kanVaraLangre'> | null): string | null {
  if (!period) return null
  return `Läkarintyg behövs från dag ${DAG_ATTA} (sjuk ${period.kanVaraLangre ? 'minst ' : ''}${period.dagar} dagar i följd)`
}
