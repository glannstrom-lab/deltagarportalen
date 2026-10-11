/**
 * komIgangApi — räknar ur databasen hur långt konsulenten kommit, för guiden
 * "Så kommer du igång" (components/consultant/KomIgangGuide.tsx).
 *
 * Bara räkningar (`head: true`) och ett par id:n. Varje fråga KASTAR vid fel:
 * ett läsfel är inte "inget gjort än", och guiden ska då inte påstå något.
 * Tabeller och kolumner verifierade mot prod-schemat 2026-10-11.
 */

import { supabase } from '@/lib/supabase'
import { underlagApi } from '@/services/aktivitetApi'
import type { OrgMembership, Organization } from '@/services/orgApi'
import type { ChefLage, GuideLage, GuideRoll, HandlaggareLage, KonsulentLage } from '@/components/consultant/komIgangSteg'

type Svar = { count: number | null; error: unknown }

function antal(svar: Svar): number {
  if (svar.error) throw svar.error
  return svar.count ?? 0
}

async function konsulentLage(userId: string): Promise<KonsulentLage> {
  const [deltagare, forsta, planer, forstaPlan, narvaro, journal, underlag, avvikelser, placeringar] = await Promise.all([
    supabase.from('consultant_participants').select('id', { count: 'exact', head: true }).eq('consultant_id', userId),
    supabase.from('consultant_participants').select('participant_id').eq('consultant_id', userId).order('assigned_at', { ascending: true }).limit(1),
    supabase.from('activity_plans').select('id', { count: 'exact', head: true }).eq('consultant_id', userId),
    supabase.from('activity_plans').select('participant_id').eq('consultant_id', userId).order('created_at', { ascending: false }).limit(1),
    supabase.from('activity_sessions').select('id', { count: 'exact', head: true }).eq('marked_by', userId),
    supabase.from('consultant_journal').select('id', { count: 'exact', head: true }).eq('consultant_id', userId),
    supabase.from('activity_plan_handovers').select('id', { count: 'exact', head: true }).eq('handed_over_by', userId).is('withdrawn_at', null),
    supabase.from('activity_sessions').select('id', { count: 'exact', head: true }).eq('af_notified_by', userId),
    supabase.from('consultant_placements').select('id', { count: 'exact', head: true }).eq('consultant_id', userId),
  ])
  if (forsta.error) throw forsta.error
  if (forstaPlan.error) throw forstaPlan.error
  return {
    deltagare: antal(deltagare),
    forstaDeltagare: (forsta.data?.[0] as { participant_id?: string } | undefined)?.participant_id ?? null,
    planer: antal(planer),
    forstaPlanDeltagare: (forstaPlan.data?.[0] as { participant_id?: string } | undefined)?.participant_id ?? null,
    narvaro: antal(narvaro),
    journal: antal(journal),
    underlag: antal(underlag),
    avvikelser: antal(avvikelser),
    placeringar: antal(placeringar),
  }
}

async function handlaggareLage(): Promise<HandlaggareLage> {
  const rader = await underlagApi.mottagna()
  const giltiga = rader.filter((u) => !u.withdrawn_at)
  return { mottagna: giltiga.length, kvitterade: giltiga.filter((u) => !!u.received_at).length }
}

async function chefLage(userId: string, orgIds: string[]): Promise<ChefLage> {
  if (orgIds.length === 0) return { kollegor: 0, mallar: 0, handlaggare: 0 }
  const [kollegor, handlaggare, egnaMallar, orgMallar] = await Promise.all([
    supabase.from('organization_colleagues').select('id', { count: 'exact', head: true }).in('org_id', orgIds).neq('user_id', userId),
    supabase.from('organization_colleagues').select('id', { count: 'exact', head: true }).in('org_id', orgIds).eq('role', 'handlaggare'),
    supabase.from('activity_templates').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
    supabase.from('activity_templates').select('id', { count: 'exact', head: true }).in('org_id', orgIds),
  ])
  return {
    kollegor: antal(kollegor),
    handlaggare: antal(handlaggare),
    mallar: antal(egnaMallar) + antal(orgMallar),
  }
}

export const komIgangApi = {
  async hamta(
    roll: GuideRoll,
    userId: string,
    medlemskap: ReadonlyArray<OrgMembership & { organization?: Organization | null }>,
  ): Promise<GuideLage> {
    if (roll === 'handlaggare') return { roll, data: await handlaggareLage() }
    if (roll === 'chef') {
      const orgIds = medlemskap
        .filter((m) => (m.role === 'chef' || m.role === 'admin') && m.organization?.kind !== 'arbetsgivare')
        .map((m) => m.org_id)
      return { roll, data: await chefLage(userId, orgIds) }
    }
    return { roll, data: await konsulentLage(userId) }
  },
}
