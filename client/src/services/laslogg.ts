/**
 * laslogg — läslogg deltagaren själv kan se (ROADMAP ÖV1) och organisationens
 * AI-brytare sedd från deltagaren.
 *
 * Migration 20260912010000: `audit_logs.participant_id` + SELECT-policy som ger
 * deltagaren raderna om sig själv med `action = 'VIEWED_PARTICIPANT_DATA'`
 * (inte admin-händelser). INSERT-policyn "Aktör loggar egna handlingar" fanns
 * redan: user_id = auth.uid() med roll CONSULTANT/ADMIN/SUPERADMIN.
 *
 * `my_ai_policy` är en vy ägd av postgres: en rad per organisation deltagaren
 * är kopplad till via sin konsulent. Tom lista = ingen organisationsspärr.
 *
 * Mönster som övriga services: kastar vid fel, sväljer aldrig till [].
 * Undantaget är `loggaVisning` som ANROPAREN får svälja (console.warn) —
 * loggen får aldrig fälla deltagarsidan.
 */

import { supabase } from '@/lib/supabase'

export const VIEWED_ACTION = 'VIEWED_PARTICIPANT_DATA'

export interface Visning {
  id: string
  user_id: string
  action: string
  resource_type: string | null
  resource_id: string | null
  participant_id: string
  created_at: string
}

export interface AiPolicyRad {
  org_id: string
  org_name: string
  ai_enabled: boolean
}

async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error('Inte inloggad')
  return user
}

/** Nyckeln som gör att en deltagare loggas en gång per webbläsarsession. */
export const sessionNyckel = (participantId: string) => `laslogg:visad:${participantId}`

export const laslogg = {
  /**
   * Konsulenten loggar att hen öppnat deltagarens sida. Kastar vid fel —
   * anroparen ska fånga och console.warn:a, aldrig låta sidan falla.
   */
  async loggaVisning(participantId: string): Promise<void> {
    const user = await requireUser()
    const { error } = await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: VIEWED_ACTION,
      resource_type: 'participant',
      resource_id: participantId,
      participant_id: participantId,
    })
    if (error) throw error
  },

  /**
   * Som ovan, men bara första gången per deltagare och webbläsarsession, och
   * utan att kasta: fel loggas med console.warn. Det här är det som sidan
   * anropar.
   */
  async loggaVisningEnGang(participantId: string): Promise<boolean> {
    const nyckel = sessionNyckel(participantId)
    try {
      if (sessionStorage.getItem(nyckel) === '1') return false
    } catch {
      // sessionStorage blockerad — logga ändå, hellre en rad för mycket
    }
    try {
      await laslogg.loggaVisning(participantId)
      try { sessionStorage.setItem(nyckel, '1') } catch { /* se ovan */ }
      return true
    } catch (err) {
      console.warn('[laslogg] visningen kunde inte loggas', err instanceof Error ? err.message : err)
      return false
    }
  },

  /** Deltagarens egna rader: vem har öppnat mina uppgifter, senaste 20. */
  async minaVisningar(): Promise<Visning[]> {
    const user = await requireUser()
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, user_id, action, resource_type, resource_id, participant_id, created_at')
      .eq('participant_id', user.id)
      .eq('action', VIEWED_ACTION)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) throw error
    return (data ?? []) as Visning[]
  },

  /** Organisationens AI-brytare sedd från deltagaren. Tom = ingen spärr. */
  async minAiPolicy(): Promise<AiPolicyRad[]> {
    await requireUser()
    const { data, error } = await supabase.from('my_ai_policy').select('*')
    if (error) throw error
    return (data ?? []) as AiPolicyRad[]
  },
}

/** Den organisation (om någon) som stängt av AI för deltagaren. */
export function orgSomStangtAv(rader: AiPolicyRad[]): AiPolicyRad | null {
  return rader.find((r) => r.ai_enabled === false) ?? null
}
