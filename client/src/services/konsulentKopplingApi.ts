/**
 * Kopplingen deltagare ↔ konsulent: samtycket och uppsägningen.
 *
 * Utbrutet ur `staApi.ts` 2026-09-12 (STA-ARK) — STA-modulen arkiverades, men de
 * här två delarna är inte STA: `KonsulentSamtyckeFraga` (efterhandsfrågan KS3) och
 * `RevokeConsultantLinkSection` (Min konsulent → säg upp kopplingen) använder dem
 * för varje deltagare med konsulent, oavsett program. RPC:n `revoke_consultant_link`
 * och tabellen `consultant_consents` är kvar i prod och grindade av KS2 (aktiv
 * relation i `consultant_participants`).
 */
import { supabase } from '@/lib/supabase'

function handleError(error: { message: string; code?: string }): never {
  const err = new Error(error.message) as Error & { code?: string }
  err.code = error.code
  throw err
}

export interface ConsultantConsent {
  id: string
  participant_id: string
  consultant_id: string
  program: string | null
  scope: Record<string, unknown>
  granted_text: string | null
  granted_at: string
  granted_via: 'invitation' | 'consultant_request' | 'manual_link'
  revoked_at: string | null
  revoked_reason: string | null
  created_at: string
}

export interface RevokeResult {
  success: boolean
  cancelled_enrollments: number
  drafts_deleted: number
  consents_revoked: number
}

export const konsulentKopplingApi = {
  /**
   * Deltagaren säger upp sin koppling till konsulenten.
   * Mjuk uppsägning — inskickade dokument bevaras för AF-arkiv. Tar bort den
   * aktiva raden i `consultant_participants`, vilket är det som (KS2) stänger
   * konsulentens läsrätt till journal och mål.
   */
  async revokeConsultantLink(consultantId: string, reason?: string): Promise<RevokeResult> {
    const { data, error } = await supabase.rpc('revoke_consultant_link', {
      p_consultant_id: consultantId,
      p_reason: reason ?? null,
    })
    if (error) handleError(error)
    return data as RevokeResult
  },
}

export const consultantConsentsApi = {
  /** Aktivt samtycke (revoked_at IS NULL) för inloggad deltagare och given konsulent. */
  async getActive(consultantId: string): Promise<ConsultantConsent | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase
      .from('consultant_consents')
      .select('*')
      .eq('participant_id', user.id)
      .eq('consultant_id', consultantId)
      .is('revoked_at', null)
      .order('granted_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error && error.code !== 'PGRST116') handleError(error)
    return (data as ConsultantConsent) ?? null
  },
}
