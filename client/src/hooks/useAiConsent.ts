/**
 * AI Consent Hook
 * Checks if user has granted consent for AI processing of their data
 */

import { useAuthStore } from '@/stores/authStore'

export interface AiConsentStatus {
  hasConsent: boolean
  consentedAt: string | null
  isLoading: boolean
}

/**
 * Hook to check AI consent status
 * Returns the current consent status from the user's profile
 */
export function useAiConsent(): AiConsentStatus {
  const { profile, isLoading } = useAuthStore()

  return {
    hasConsent: !!profile?.ai_consent_at,
    consentedAt: profile?.ai_consent_at || null,
    isLoading,
  }
}

/**
 * Hook to check if AI features should be available
 * Returns true only if user is authenticated AND has given AI consent
 */
export function useCanUseAi(): boolean {
  const { profile, isAuthenticated } = useAuthStore()
  return isAuthenticated && !!profile?.ai_consent_at
}
