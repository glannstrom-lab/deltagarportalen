/**
 * Phase 3 / DATA-02 — Personal Brand audit history (append-only).
 *
 * IMPORTANT: This targets the PLURAL table `personal_brand_audits`,
 * which is DISTINCT from the existing SINGULAR `personal_brand_audit`
 * table (used by personalBrandApi in cloudStorage.ts for the upsert flow).
 *
 * See migration: supabase/migrations/20260429_personal_brand_audits.sql
 * See research: 03-RESEARCH.md Pitfall C.
 */

import { supabase } from '@/lib/supabase'

export interface PersonalBrandAuditInsert {
  score: number
  dimensions: Record<string, number>
  summary?: string
}

export const personalBrandAuditsApi = {
  async create(input: PersonalBrandAuditInsert): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Användaren måste vara inloggad för att spara audit-historik')

    const { error } = await supabase
      .from('personal_brand_audits')           // PLURAL — new append-only table
      .insert({
        user_id: user.id,
        score: input.score,
        dimensions: input.dimensions,
        summary: input.summary ?? null,
      })

    if (error) throw error
  },

  async getLatest(): Promise<{ score: number; dimensions: Record<string, number>; summary: string | null; created_at: string } | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('personal_brand_audits')
      .select('score, dimensions, summary, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Fel vid hämtning av brand-audit-historik:', error)
      return null
    }
    return data as { score: number; dimensions: Record<string, number>; summary: string | null; created_at: string } | null
  },
}
