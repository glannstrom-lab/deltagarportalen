/**
 * RM1 — Resultatklockan som tidslinje per placering.
 *
 * Premissen (2026-10-31): nivå (`outcome_level`), betalstatus per punkt, 3-/6-månaderspunkter
 * och beloppsberäkningen fanns redan (RR5/RR7/RR25/KF2). Det som saknades var tidslinjen som
 * samlar dem och tvåmånadersfönstret för tillträde. Ingen migration behövs.
 *
 * Ärlighet: nivå saknas -> inga belopp. Slutdatum saknas -> inget fönster. Uppföljning inte
 * registrerad -> ingen status ("—"). Aldrig en gissad nivå och aldrig ett påhittat datum.
 * Datum räknas i lokal tid (formatLocalDate, aldrig toISOString).
 *
 * Det här räknar vad som KAN begäras; AF verifierar och betalar.
 */
import { uppfoljningspunkt, type Uppfoljning } from '@/pages/consultant/placeringsmatt'
import { formatLocalDate } from '@/services/aktivitetSchema'
import { RESULTAT_MAX, TILLAGG } from '@/services/rom2Ersattning'
import { betalstatus, type Betalstatus } from '@/services/resultatklocka'
import type { Niva } from '@/services/placeringUtfall'

/** FFU Af-2025/0017 §5.1.2: tillträde senast 2 månader efter avslutad placering. */
export const TILLTRADESFONSTER_MANADER = 2

function parseYmd(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

/** Kalendermånader framåt, lokal tid; dag som saknas i målmånaden klipps (31/8 + 2 = 31/10, 31/12 + 2 = 28/2). */
export function plusManader(ymd: string | null | undefined, manader: number): string | null {
  if (!ymd) return null
  const s = parseYmd(ymd)
  if (!s) return null
  const sista = new Date(s.getFullYear(), s.getMonth() + manader + 1, 0).getDate()
  return formatLocalDate(new Date(s.getFullYear(), s.getMonth() + manader, Math.min(s.getDate(), sista)))
}

export interface TidslinjePlacering {
  start_date?: string | null
  end_date?: string | null
  outcome_level?: Niva | null
  followup_3m: boolean
  followup_6m: boolean
  followup_3m_evidence?: string | null
  followup_6m_evidence?: string | null
  followup_3m_payment_status?: string | null
  followup_6m_payment_status?: string | null
}

export interface TidslinjePunkt {
  vilken: Uppfoljning
  /** Punktens datum, eller null utan startdatum. */
  datum: string | null
  /** passerad/kommande relativt idag; null utan datum. */
  lage: 'passerad' | 'kommande' | null
  registrerad: boolean
  /** Null tills uppföljningen är registrerad — visas som "—". */
  status: Betalstatus | null
  /** Halva resultatersättningens maxbelopp för nivån, eller null utan nivå. */
  hogstBelopp: number | null
}

export interface Tidslinje {
  niva: Niva | null
  start: string | null
  /** Senaste tillträde (slutdatum + 2 mån), eller null utan slutdatum. */
  tilltradeSenast: string | null
  punkter: [TidslinjePunkt, TidslinjePunkt]
  /** Tillägg om resultatet nås inom första halvåret; null utan nivå. */
  tillagg: number | null
}

export function byggTidslinje(p: TidslinjePlacering, idag: string): Tidslinje {
  const niva = p.outcome_level ?? null
  const start = p.start_date ?? null
  const punkt = (vilken: Uppfoljning): TidslinjePunkt => {
    const datum = uppfoljningspunkt(start, vilken)
    const registrerad = vilken === '3m' ? p.followup_3m : p.followup_6m
    return {
      vilken,
      datum,
      // ISO-datum jämförs som strängar; båda är lokala YYYY-MM-DD.
      lage: datum ? (datum <= idag ? 'passerad' : 'kommande') : null,
      registrerad,
      status: betalstatus(p, vilken),
      hogstBelopp: niva ? RESULTAT_MAX[niva] / 2 : null,
    }
  }
  return {
    niva,
    start,
    tilltradeSenast: plusManader(p.end_date ?? null, TILLTRADESFONSTER_MANADER),
    punkter: [punkt('3m'), punkt('6m')],
    tillagg: niva ? TILLAGG[niva] : null,
  }
}
