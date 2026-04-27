/**
 * Account API — GDPR-flöden för konto-radering.
 *
 * Wrapper kring Supabase RPC + delete-account edge function.
 * Används av components/settings/DeleteAccountSection och liknande UI.
 *
 * GDPR Art. 17: rätt att bli glömd. Två-stegs flöde:
 *   1. profile-data raderas via RPC (execute_account_deletion_immediate)
 *   2. auth.users raderas via service-role edge function (delete-account)
 *
 * Alternativt grace-period-flöde (request → 14 dagar → automatisk radering)
 * via request_account_deletion / cancel_account_deletion.
 */

import { supabase } from '@/lib/supabase'

export interface DeletionRequestResult {
  success: boolean
  scheduled_at?: string
  grace_period_days?: number
  error?: string
}

export interface ImmediateDeletionResult {
  success: boolean
  authDeleted: boolean
  error?: string
}

/**
 * Begär radering med 14 dagars grace period (GDPR-rekommendation).
 * Användaren kan ångra under graceperioden.
 */
export async function requestDeletion(reason?: string): Promise<DeletionRequestResult> {
  const { data, error } = await supabase.rpc('request_account_deletion', {
    p_reason: reason || null,
    p_grace_period_days: 14,
  })

  if (error) throw error
  if (!data?.success) throw new Error(data?.error || 'Begäran om radering misslyckades')

  return {
    success: true,
    scheduled_at: data.scheduled_at,
    grace_period_days: data.grace_period_days,
  }
}

/**
 * Avbryt en pågående grace-period-radering.
 */
export async function cancelDeletion(): Promise<{ success: boolean }> {
  const { data, error } = await supabase.rpc('cancel_account_deletion')
  if (error) throw error
  return { success: !!data?.success }
}

/**
 * Omedelbar radering utan grace period.
 * Två-stegs: RPC raderar profile-data, edge function raderar auth.users.
 *
 * Edge function-failet är icke-fatalt — profile är redan borta, vi loggar
 * och fortsätter. Auth-cleanup kan göras manuellt om det behövs.
 */
export async function executeImmediateDeletion(): Promise<ImmediateDeletionResult> {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData?.session?.access_token

  if (!accessToken) {
    throw new Error('Ingen aktiv session')
  }

  // Steg 1: profile-data via RPC
  const { data, error } = await supabase.rpc('execute_account_deletion_immediate')
  if (error) throw error
  if (!data?.success) throw new Error(data?.error || 'Profil-radering misslyckades')

  // Steg 2: auth.users via edge function (icke-fatalt om det failar)
  let authDeleted = true
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) authDeleted = false
  } catch {
    authDeleted = false
  }

  return { success: true, authDeleted }
}
