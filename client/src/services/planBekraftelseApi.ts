/**
 * KF5 (2026-10-18): deltagarens bekräftelse av aktivitetsplanen.
 *
 * En kvittens, inte en signatur: "jag har läst min plan", med tidsstämpel och
 * den version (`activity_plans.updated_at`) som lästes. Tabellen
 * `activity_plan_confirmations` tar bara INSERT och SELECT; RLS släpper bara
 * deltagaren själv, bara den aktiva planen och bara den version som gäller nu
 * (migration 20261018120000, provad mot prod: fel version, bakdatering och
 * UPDATE nekas med 42501).
 *
 * Versionen gäller planens huvud (timmar, datum, text, beslut). Att flytta ett
 * enskilt pass ändrar inte `activity_plans.updated_at` och räknas alltså inte
 * som en ny plan.
 */
import { supabase } from '@/lib/supabase'

export interface PlanBekraftelse {
  id: string
  plan_id: string
  plan_updated_at: string
  confirmed_at: string
}

export type BekraftelseLage =
  | { lage: 'ej' }
  | { lage: 'aktuell'; bekraftad: string }
  | { lage: 'aldre'; bekraftad: string }

/** Jämför senaste bekräftelsen med planens nuvarande version. */
export function bekraftelseLage(planUpdatedAt: string, bekraftelser: readonly PlanBekraftelse[]): BekraftelseLage {
  const senaste = [...bekraftelser].sort((a, b) => b.confirmed_at.localeCompare(a.confirmed_at))[0]
  if (!senaste) return { lage: 'ej' }
  // Jämför som tidpunkter, inte som strängar — Postgres och JS skriver samma ögonblick olika.
  const samma = new Date(senaste.plan_updated_at).getTime() === new Date(planUpdatedAt).getTime()
  return samma ? { lage: 'aktuell', bekraftad: senaste.confirmed_at } : { lage: 'aldre', bekraftad: senaste.confirmed_at }
}

export const planBekraftelseApi = {
  async lista(planId: string): Promise<PlanBekraftelse[]> {
    const { data, error } = await supabase
      .from('activity_plan_confirmations')
      .select('id, plan_id, plan_updated_at, confirmed_at')
      .eq('plan_id', planId)
      .order('confirmed_at', { ascending: false })
      .limit(20)
    if (error) throw error
    return (data ?? []) as PlanBekraftelse[]
  },

  /** Deltagaren bekräftar den version av planen hen just läst. */
  async bekrafta(plan: { id: string; participant_id: string; updated_at: string }): Promise<void> {
    const { error } = await supabase
      .from('activity_plan_confirmations')
      .insert({ plan_id: plan.id, participant_id: plan.participant_id, plan_updated_at: plan.updated_at })
    if (error) throw error
  },
}
