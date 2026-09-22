/**
 * AI Consent Hook
 * Checks if user has granted consent for AI processing of their data.
 *
 * GDPR-modell:
 *  - ai_consent_at: tidsstämpel för samtycke (Art 6.1.a). NULL = inte gett samtycke.
 *  - ai_enabled:    on/off-toggle (Art 21 invändning). Default TRUE.
 *
 * Effektiv AI-tillgång = båda ska gälla: samtycke gett OCH inte invänt.
 */

import { useAuthStore } from '@/stores/authStore'

export interface AiConsentStatus {
  /** Användaren har gett AI-samtycke (Art 6.1.a) */
  hasConsent: boolean
  /** AI-funktioner är aktiverade just nu (samtycke + ai_enabled) */
  isEnabled: boolean
  /** Användaren har samtycke men har invänt mot AI (Art 21) */
  isOptedOut: boolean
  consentedAt: string | null
  isLoading: boolean
}

/**
 * Hook to check AI consent status.
 */
export function useAiConsent(): AiConsentStatus {
  const { profile, isLoading } = useAuthStore()

  const hasConsent = !!profile?.ai_consent_at
  // ai_enabled default TRUE — bara FALSE om explicit avstängt
  const aiEnabled = profile?.ai_enabled !== false
  const isEnabled = hasConsent && aiEnabled
  const isOptedOut = hasConsent && !aiEnabled

  return {
    hasConsent,
    isEnabled,
    isOptedOut,
    consentedAt: profile?.ai_consent_at || null,
    isLoading,
  }
}

// useCanUseAi RADERAD 2026-09-22 — noll anropare; använd useAiConsent().isEnabled.
