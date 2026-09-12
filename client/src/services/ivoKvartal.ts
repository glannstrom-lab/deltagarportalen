/**
 * ivoKvartal — kvartalsunderlag till IVO enligt aktivitetskravet (KM7).
 *
 * IVO ska från januari 2027 ha kvartalsvis: antal personer som anvisats
 * aktivitet och antal vars stöd nekats eller satts ned, fördelat på
 * försörjningshinder. Det här är en RÄKNING ur portalens planer och pass —
 * beslutet om nedsättning fattas av socialnämnden och registreras i
 * kommunens verksamhetssystem, så det vi kan räkna här är:
 *
 *   antal_anvisade            planer som var aktiva någon dag i kvartalet
 *   antal_med_ogiltig_franvaro planer med minst ett pass `absent_invalid` i kvartalet
 *   antal_underlag_lamnat     planer med ett lämnat underlag i kvartalet (F10: ur
 *                             activity_plan_handovers om listan ges, annars planens synkade datum)
 *
 * Regeln för "aktiv i kvartalet": start_date ≤ kvartalets sista dag OCH
 * (end_date saknas ELLER end_date ≥ kvartalets första dag). Status `ended`
 * räknas ändå om perioden överlappar — en plan som avslutades mitt i
 * kvartalet var anvisad under kvartalet. Planer som slutade FÖRE kvartalet
 * räknas inte.
 *
 * Ren logik, inga databasanrop. Datum är `YYYY-MM-DD`-strängar i lokal tid.
 */

import type { ActivityPlan, ActivitySession, Forsorjningshinder } from './aktivitetApi'
import { FORSORJNINGSHINDER, FORSORJNINGSHINDER_ETIKETT } from './aktivitetApi'

export type Kvartal = 1 | 2 | 3 | 4

export interface KvartalVal {
  ar: number
  kvartal: Kvartal
}

export interface KvartalGranser {
  from: string
  to: string
}

export interface UnderlagRad {
  /** Kategorinyckel, eller 'ej_angivet' för planer utan försörjningshinder. */
  nyckel: Forsorjningshinder | 'ej_angivet'
  etikett: string
  antal_anvisade: number
  antal_med_ogiltig_franvaro: number
  antal_underlag_lamnat: number
}

export interface Kvartalsunderlag {
  ar: number
  kvartal: Kvartal
  from: string
  to: string
  rader: UnderlagRad[]
  summa: Omit<UnderlagRad, 'nyckel' | 'etikett'>
}

export const EJ_ANGIVET_ETIKETT = 'Ej angivet'

/** Kvartalets första och sista dag. */
export function kvartalGranser(ar: number, kvartal: Kvartal): KvartalGranser {
  const startManad = (kvartal - 1) * 3 + 1
  const slutManad = startManad + 2
  const sistaDag = new Date(ar, slutManad, 0).getDate() // dag 0 i nästa månad = sista i denna
  const mm = (m: number) => String(m).padStart(2, '0')
  return {
    from: `${ar}-${mm(startManad)}-01`,
    to: `${ar}-${mm(slutManad)}-${mm(sistaDag)}`,
  }
}

/** Innevarande kvartal ur ett datum (`YYYY-MM-DD`). */
export function kvartalForDatum(datum: string): KvartalVal {
  const [ar, manad] = datum.split('-').map(Number)
  return { ar, kvartal: (Math.floor((manad - 1) / 3) + 1) as Kvartal }
}

type PlanFalt = Pick<ActivityPlan, 'id' | 'start_date' | 'end_date' | 'forsorjningshinder' | 'nedsattning_underlag_lamnat_at'>
type SessionFalt = Pick<ActivitySession, 'plan_id' | 'date' | 'attendance'>
/** F10: ett lämnat underlag ur activity_plan_handovers. Ångrade (withdrawn_at) räknas inte. */
export type UnderlagFalt = { plan_id: string; handed_over_at: string; withdrawn_at: string | null }

/** Var planen anvisad någon dag i intervallet? */
export function planAktivIPeriod(plan: Pick<ActivityPlan, 'start_date' | 'end_date'>, { from, to }: KvartalGranser): boolean {
  if (plan.start_date > to) return false
  if (plan.end_date !== null && plan.end_date < from) return false
  return true
}

export function ivoKvartalsunderlag(
  plans: readonly PlanFalt[],
  sessions: readonly SessionFalt[],
  { ar, kvartal }: KvartalVal,
  /**
   * F10 (2026-09-13): ges listan räknas "underlag lämnat" ur de faktiska
   * överlämningarna (en plan räknas en gång per kvartal, ångrade ignoreras).
   * Utan listan används planens synkade kolumn som förut — samma tal, för
   * triggern håller kolumnen lika med senaste ej ångrade underlaget.
   */
  handovers?: readonly UnderlagFalt[],
): Kvartalsunderlag {
  const granser = kvartalGranser(ar, kvartal)
  const aktiva = plans.filter((p) => planAktivIPeriod(p, granser))
  const planerMedUnderlag = new Set<string>()
  if (handovers) {
    for (const h of handovers) {
      if (h.withdrawn_at) continue
      const dag = h.handed_over_at.slice(0, 10)
      if (dag >= granser.from && dag <= granser.to) planerMedUnderlag.add(h.plan_id)
    }
  }

  const planerMedOgiltig = new Set<string>()
  for (const s of sessions) {
    if (s.attendance === 'absent_invalid' && s.date >= granser.from && s.date <= granser.to) {
      planerMedOgiltig.add(s.plan_id)
    }
  }

  const nycklar: Array<Forsorjningshinder | 'ej_angivet'> = [...FORSORJNINGSHINDER, 'ej_angivet']
  const rader: UnderlagRad[] = nycklar.map((nyckel) => {
    const iKategori = aktiva.filter((p) => (p.forsorjningshinder ?? 'ej_angivet') === nyckel)
    return {
      nyckel,
      etikett: nyckel === 'ej_angivet' ? EJ_ANGIVET_ETIKETT : FORSORJNINGSHINDER_ETIKETT[nyckel],
      antal_anvisade: iKategori.length,
      antal_med_ogiltig_franvaro: iKategori.filter((p) => planerMedOgiltig.has(p.id)).length,
      antal_underlag_lamnat: handovers
        ? iKategori.filter((p) => planerMedUnderlag.has(p.id)).length
        : iKategori.filter(
          (p) => p.nedsattning_underlag_lamnat_at !== null
            && p.nedsattning_underlag_lamnat_at >= granser.from
            && p.nedsattning_underlag_lamnat_at <= granser.to,
        ).length,
    }
  })

  const summa = rader.reduce(
    (acc, r) => ({
      antal_anvisade: acc.antal_anvisade + r.antal_anvisade,
      antal_med_ogiltig_franvaro: acc.antal_med_ogiltig_franvaro + r.antal_med_ogiltig_franvaro,
      antal_underlag_lamnat: acc.antal_underlag_lamnat + r.antal_underlag_lamnat,
    }),
    { antal_anvisade: 0, antal_med_ogiltig_franvaro: 0, antal_underlag_lamnat: 0 },
  )

  return { ar, kvartal, from: granser.from, to: granser.to, rader, summa }
}

/** TSV med BOM-fri text; anroparen lägger på BOM om Excel är målet. */
export function tillTsv(u: Kvartalsunderlag): string {
  const rader: string[][] = [
    ['Aktivitetskravet – kvartalsunderlag till IVO', `${u.ar} Q${u.kvartal} (${u.from} – ${u.to})`],
    [''],
    ['Försörjningshinder', 'Anvisade', 'Med ogiltig frånvaro', 'Underlag lämnat till handläggare'],
    ...u.rader.map((r) => [r.etikett, String(r.antal_anvisade), String(r.antal_med_ogiltig_franvaro), String(r.antal_underlag_lamnat)]),
    ['Summa', String(u.summa.antal_anvisade), String(u.summa.antal_med_ogiltig_franvaro), String(u.summa.antal_underlag_lamnat)],
    [''],
    ['Underlaget är en räkning ur portalen. Beslut om nekande/nedsättning registreras i kommunens verksamhetssystem.'],
  ]
  return rader.map((r) => r.join('\t')).join('\n')
}
