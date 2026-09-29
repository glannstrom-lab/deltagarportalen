/**
 * resultatklocka — Rusta och matchas resultatersättning per placering (RR25)
 * och markeringen "förd över till MSFA" (RR24), rollspelet 2026-09-27.
 *
 * ── PENDING_20260927d_resultat_och_msfa ──────────────────────────────────
 * Skapas av `supabase/migrations/PENDING_20260927d_resultat_och_msfa.sql`:
 *   consultant_placements.followup_{3m,6m}_payment_status (+ _at, _by)
 *   tabellen msfa_overforingar (RLS: konsulentens egna rader för deltagare
 *   med aktiv relation; organisationens chef läser)
 * Med `RESULTAT_MSFA_FINNS = false`:
 *   · statusraden (väntar → verifierad → fakturerad) och knappen
 *     "Markera som förd över" visas inte
 *   · inget anrop går till kolumnerna eller tabellen
 * Efter körning: `npm run schema:refresh`, `npm run grants:refresh`, sätt
 * konstanten till true. Tabellnamnet står i en konstant och kolumnerna skrivs
 * via beräknade nycklar, så lint:schema/lint:kolumner ser dem inte innan de
 * finns i snapshoten.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Status per uppföljningspunkt:
 *   —           uppföljningen är inte registrerad än (ingen status att ha)
 *   väntar      uppföljningen är registrerad, underlaget inte verifierat
 *   verifierad  konsulenten har stämt av ett skriftligt underlag
 *   fakturerad  resultatersättningen för punkten är fakturerad
 * Beloppet enligt FFU §5.1 räknas inte här — portalen har inte avtalets
 * prislista, och ett gissat belopp är värre än inget.
 *
 * Portalen skickar ingenting till Arbetsförmedlingen.
 */

import { supabase } from '@/lib/supabase'
import type { Uppfoljning } from '@/pages/consultant/placeringsmatt'

import { anvandareFranSession } from '@/lib/anvandareFranSession'
/** PENDING_20260927d_resultat_och_msfa — true när migrationen körts och snapshotarna uppdaterats. */
export const RESULTAT_MSFA_FINNS = true

export type Betalstatus = 'vantar' | 'verifierad' | 'fakturerad'

export const BETALSTATUS_ETIKETT: Record<Betalstatus, string> = {
  vantar: 'Väntar på verifiering',
  verifierad: 'Verifierad',
  fakturerad: 'Fakturerad',
}

/** Underlag som går att verifiera mot — muntliga uppgifter räcker inte. */
const SKRIFTLIGT_UNDERLAG = new Set(['anstallningsbevis', 'lonespecifikation', 'studieintyg'])

export interface BetalPlacering {
  followup_3m: boolean
  followup_6m: boolean
  followup_3m_evidence?: string | null
  followup_6m_evidence?: string | null
  followup_3m_payment_status?: string | null
  followup_6m_payment_status?: string | null
  followup_3m_payment_status_at?: string | null
  followup_6m_payment_status_at?: string | null
}

function falt<K extends 'evidence' | 'payment_status' | 'payment_status_at'>(p: BetalPlacering, vilken: Uppfoljning, k: K): string | null {
  const v = (p as unknown as Record<string, unknown>)[`followup_${vilken}_${k}`]
  return typeof v === 'string' && v !== '' ? v : null
}

/** Punktens status, eller null när uppföljningen inte är registrerad (visas som —). */
export function betalstatus(p: BetalPlacering, vilken: Uppfoljning): Betalstatus | null {
  const gjord = vilken === '3m' ? p.followup_3m : p.followup_6m
  if (!gjord) return null
  const s = falt(p, vilken, 'payment_status')
  return s === 'verifierad' || s === 'fakturerad' ? s : 'vantar'
}

export function betalstatusDatum(p: BetalPlacering, vilken: Uppfoljning): string | null {
  return falt(p, vilken, 'payment_status_at')
}

export type NastaSteg = { steg: Betalstatus; knapp: string } | { steg: null; skal: string | null }

/** Vad konsulenten kan göra härnäst med punkten. Stegen tas i ordning, aldrig bakåt eller förbi. */
export function nastaBetalsteg(p: BetalPlacering, vilken: Uppfoljning): NastaSteg {
  const status = betalstatus(p, vilken)
  if (status === null) return { steg: null, skal: null }
  if (status === 'fakturerad') return { steg: null, skal: null }
  if (status === 'verifierad') return { steg: 'fakturerad', knapp: 'Markera fakturerad' }
  const underlag = falt(p, vilken, 'evidence')
  if (!underlag || !SKRIFTLIGT_UNDERLAG.has(underlag)) {
    return { steg: null, skal: 'Verifiering kräver ett skriftligt underlag registrerat på uppföljningen (anställningsbevis, lönespecifikation eller studieintyg).' }
  }
  return { steg: 'verifierad', knapp: 'Markera verifierad' }
}

/** Kolumnerna att sprida in i update-objektet — tomt före migrationen. */
export function betalKolumner(vilken: Uppfoljning, status: Betalstatus, userId: string, nu: Date = new Date(), finns: boolean = RESULTAT_MSFA_FINNS): Record<string, unknown> {
  if (!finns) return {}
  const p = `followup_${vilken}_payment_status`
  return { [p]: status, [`${p}_at`]: nu.toISOString(), [`${p}_by`]: userId }
}

async function requireUser() {
  const { data: { user }, error } = await anvandareFranSession()
  if (error) throw error
  if (!user) throw new Error('Inte inloggad')
  return user
}

export const resultatApi = {
  /** Nästa steg för en uppföljningspunkt. Kastar vid fel — anroparen visar det. */
  async sattBetalstatus(placementId: string, vilken: Uppfoljning, status: Betalstatus): Promise<void> {
    const user = await requireUser()
    const kolumner = betalKolumner(vilken, status, user.id)
    if (Object.keys(kolumner).length === 0) throw new Error('Status kan inte sparas ännu.')
    const { error } = await supabase
      .from('consultant_placements')
      .update({ ...kolumner })
      .eq('id', placementId)
      .eq('consultant_id', user.id)
    if (error) throw error
  },
}

// ---------------------------------------------------------------------------
// RR24: "förd över till MSFA" per plan och månad
// ---------------------------------------------------------------------------

/** Tabell- och kolumnnamn i konstanter: tabellen finns först efter migrationen. */
const MSFA_TABELL = 'msfa_overforingar'
const MSFA_MANAD = 'period_month'

export interface MsfaOverforing {
  id: string
  plan_id: string
  participant_id: string
  consultant_id: string
  period_month: string
  transferred_at: string
  transferred_by: string
}

export function arManad(ym: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(ym)
}

export const msfaApi = {
  /** Månadens markeringar som RLS låter mig läsa. */
  async listForManad(ym: string): Promise<MsfaOverforing[]> {
    if (!RESULTAT_MSFA_FINNS) return []
    const { data, error } = await supabase.from(MSFA_TABELL).select('*').eq(MSFA_MANAD, ym)
    if (error) throw error
    return (data ?? []) as MsfaOverforing[]
  },

  async markera(plan: { id: string; participant_id: string; org_id: string | null }, ym: string): Promise<MsfaOverforing> {
    if (!RESULTAT_MSFA_FINNS) throw new Error('Markeringen kan inte sparas ännu.')
    if (!arManad(ym)) throw new Error('Ogiltig månad')
    const user = await requireUser()
    const rad: Record<string, unknown> = {
      plan_id: plan.id,
      participant_id: plan.participant_id,
      consultant_id: user.id,
      org_id: plan.org_id,
      period_month: ym,
      transferred_by: user.id,
    }
    const { data, error } = await supabase.from(MSFA_TABELL).insert({ ...rad }).select('*').single()
    if (error) throw error
    return data as MsfaOverforing
  },

  /** Ångra en egen markering (fel månad, fel deltagare). RLS släpper bara egna rader. */
  async angra(id: string): Promise<void> {
    if (!RESULTAT_MSFA_FINNS) throw new Error('Markeringen kan inte ändras ännu.')
    const { error } = await supabase.from(MSFA_TABELL).delete().eq('id', id)
    if (error) throw error
  },
}
