/**
 * Enhetens utfall (FN7) — andel i arbete eller studier, avslut och tid till plan
 * för HELA enheten, inte bara den inloggade konsulentens deltagare.
 *
 * Premissen (mätt mot prod 2026-10-31):
 *  - AnalyticsTab har sex konsulentfilter (`.eq('consultant_id', user.id)`).
 *  - Chef/admin läser org-planer (activity_plans, aal2 eller demoorganisation),
 *    men INTE consultant_placements (bara konsulenten med aktiv koppling) och inte
 *    consultant_participants (bara konsulenten själv eller superadmin) — alltså
 *    varken arbete/studier eller kopplingsdatum, och därmed inte tid till plan.
 *  - Vyn organization_caseload ger bara antal deltagare/planer/frånvaro per
 *    konsulent, inga utfall.
 * Därför: arbete/studier och tid till plan kräver databasfunktionen
 * `enhetens_utfall` (migration 20261031_fn7_enhetens_utfall.sql, EJ KÖRD, väntar
 * på ja). Tills dess (`ENHETENS_UTFALL_RPC_FINNS = false`) görs inget anrop mot
 * den, och det enda som går att räkna med befintlig RLS är avslut ur planerna.
 *
 * Regler: ett värde utan underlag är "—" och en rad om varför, aldrig 0. Celler
 * under CELLGRANS (5) redovisas inte (samma regel som nämndtexten).
 * Konsulentvyn översätts inte: svenska literaler.
 */

import { supabase } from '@/lib/supabase'
import { CELLGRANS } from '@/services/namndTextApi'
import { mfaApi } from '@/services/mfaApi'

/** Sätts till true när 20261031_fn7_enhetens_utfall.sql körts och schema:refresh/grants:refresh gjorts. */
export const ENHETENS_UTFALL_RPC_FINNS = false
// Medvetet en konstant och inte ett strängliteral i .rpc(): lint:schema ska inte
// fälla på en funktion som ännu inte finns. Byt till literalen när flaggan slås på,
// så grinden börjar vakta namnet.
const RPC_NAMN = 'enhetens_utfall'

export interface UtfallRpcRad {
  // null = undertryckt i databasen (cell under 5), aldrig 0.
  deltagare_totalt: number | null
  i_arbete_eller_studier: number | null
  avslutade_deltagare: number | null
  /** Medelvärde i dagar, null när ingen deltagare har både koppling och plan. */
  tid_till_plan_dagar: number | null
  tid_till_plan_n: number | null
}

export interface PlanFaltUtfall {
  participant_id: string
  status: string
}

export interface UtfallRad {
  nyckel: 'arbete_studier' | 'avslut' | 'tid_till_plan'
  rubrik: string
  /** Texten i cellen: ett tal, eller "—". */
  text: string
  visas: boolean
  /** Bara när visas är false: raden om varför. */
  varfor?: string
}

export const STRECK = '—'
const UNDER_GRANS = `För få personer för att redovisas (under ${CELLGRANS}).`

/** Roller som får se enhetens utfall. */
export const arEnhetsroll = (role: string): boolean => role === 'chef' || role === 'admin'

/** Andel n av nämnare, med cellgräns på båda. `varfor` sätts när den inte redovisas. */
export function andelText(n: number | null, namnare: number | null): { text: string; varfor?: string } {
  if (n === null || namnare === null) return { text: STRECK, varfor: UNDER_GRANS }
  if (namnare <= 0) return { text: STRECK, varfor: 'Inga deltagare i underlaget ännu.' }
  if (namnare < CELLGRANS || (n > 0 && n < CELLGRANS)) return { text: STRECK, varfor: UNDER_GRANS }
  return { text: `${n} av ${namnare} (${Math.round((n / namnare) * 100)} %)` }
}

/** Avslut ur planerna: deltagare vars alla planer är avslutade, av deltagare med plan. */
export function avslutUrPlaner(planer: readonly PlanFaltUtfall[]): { avslutade: number; totalt: number } {
  const perDeltagare = new Map<string, boolean>()
  for (const p of planer) {
    const hittills = perDeltagare.get(p.participant_id) ?? true
    perDeltagare.set(p.participant_id, hittills && p.status === 'ended')
  }
  return { avslutade: [...perDeltagare.values()].filter(Boolean).length, totalt: perDeltagare.size }
}

const SAKNAS_FUNKTION =
  'Chefen kan inte läsa deltagarnas placeringar och kopplingsdatum med dagens behörighet. Kräver databasfunktionen enhetens_utfall, som väntar på beslut.'

type Cell = { text: string; varfor?: string }

/** Bygger de tre raderna. `rpc` = funktionens svar, `planer` = org-planer via RLS (eller null). */
export function byggUtfall(kalla: { rpc: UtfallRpcRad | null; planer: readonly PlanFaltUtfall[] | null }): UtfallRad[] {
  const { rpc, planer } = kalla
  const rad = (nyckel: UtfallRad['nyckel'], rubrik: string, c: Cell): UtfallRad => ({
    nyckel,
    rubrik,
    text: c.text,
    visas: c.varfor === undefined,
    varfor: c.varfor,
  })

  let arbete: Cell
  let avslut: Cell
  let tid: Cell

  if (rpc) {
    arbete = andelText(rpc.i_arbete_eller_studier, rpc.deltagare_totalt)
    avslut = andelText(rpc.avslutade_deltagare, rpc.deltagare_totalt)
    if (rpc.tid_till_plan_n === null) {
      tid = { text: STRECK, varfor: UNDER_GRANS }
    } else if (rpc.tid_till_plan_dagar === null || rpc.tid_till_plan_n <= 0) {
      tid = { text: STRECK, varfor: 'Ingen deltagare har både kopplingsdatum och plan ännu.' }
    } else if (rpc.tid_till_plan_n < CELLGRANS) {
      tid = { text: STRECK, varfor: UNDER_GRANS }
    } else {
      tid = { text: `${Math.round(rpc.tid_till_plan_dagar)} dagar i snitt (${rpc.tid_till_plan_n} deltagare)` }
    }
  } else {
    arbete = { text: STRECK, varfor: SAKNAS_FUNKTION }
    tid = { text: STRECK, varfor: SAKNAS_FUNKTION }
    if (planer === null) {
      avslut = { text: STRECK, varfor: 'Planerna kunde inte läsas.' }
    } else {
      const a = avslutUrPlaner(planer)
      const andel = andelText(a.avslutade, a.totalt)
      avslut = andel.varfor === undefined ? { text: `${andel.text} har avslutad plan` } : andel
    }
  }

  return [
    rad('arbete_studier', 'I arbete eller studier', arbete),
    rad('avslut', 'Avslut', avslut),
    rad('tid_till_plan', 'Tid till plan', tid),
  ]
}

export type UtfallLage =
  | { status: 'kraver_aal2' }
  | { status: 'klart'; rader: UtfallRad[]; kalla: 'funktion' | 'planer' }

export const enhetensUtfallApi = {
  /**
   * aal2 kontrolleras först (utan det svarar RLS med 0 rader, inte ett fel).
   * Demoorganisationer undantas, precis som i policyn.
   */
  async hamta(orgId: string, arDemo: boolean): Promise<UtfallLage> {
    if (!arDemo) {
      const a = await mfaApi.assurans()
      if (a.nuvarande !== 'aal2') return { status: 'kraver_aal2' }
    }
    if (ENHETENS_UTFALL_RPC_FINNS) {
      const { data, error } = await supabase.rpc(RPC_NAMN, { p_org: orgId })
      if (error) throw new Error(error.message)
      const rad = (Array.isArray(data) ? data[0] : data) as UtfallRpcRad | null | undefined
      return { status: 'klart', rader: byggUtfall({ rpc: rad ?? null, planer: null }), kalla: 'funktion' }
    }
    const { data, error } = await supabase.from('activity_plans').select('participant_id, status').eq('org_id', orgId)
    if (error) throw new Error(error.message)
    return { status: 'klart', rader: byggUtfall({ rpc: null, planer: (data ?? []) as PlanFaltUtfall[] }), kalla: 'planer' }
  },
}

/** Textrader till nämndrapporten — bara rader som får visas, aldrig ett "—". */
export function utfallTextrader(rader: readonly UtfallRad[]): string[] {
  return rader.filter((r) => r.visas).map((r) => `${r.rubrik}: ${r.text}`)
}
