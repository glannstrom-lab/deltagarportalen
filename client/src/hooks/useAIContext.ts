/**
 * AI Context Hook
 *
 * Collects user context for AI personalization.
 * This context is sent with AI requests to provide more relevant responses.
 */

import { useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useInterestProfile } from '@/hooks/useInterestProfile'

/**
 * User context sent to AI endpoints for personalization
 */
export interface AIUserContext {
  // Profile information
  firstName?: string
  experienceLevel?: 'entry' | 'junior' | 'mid' | 'senior' | 'executive'
  targetIndustry?: string
  targetRole?: string

  // Interest profile (RIASEC)
  riasecDominant?: string[] // e.g., ['S', 'E', 'A']
  hasCompletedInterestGuide?: boolean

  // Current state
  energyLevel?: 'low' | 'medium' | 'high'
  isInCalmMode?: boolean

  // Platform engagement
  hasCV?: boolean
  cvCompleteness?: number // 0-100
  onboardingComplete?: boolean

  // Language preference
  language?: 'sv' | 'en'
}

/**
 * Get user context for AI requests
 */
export function useAIContext(): AIUserContext {
  const { profile } = useAuthStore()
  const { energyLevel, calmMode: isInCalmMode, language, hasCompletedOnboarding } = useSettingsStore()
  const { profile: interestProfile } = useInterestProfile()

  const context = useMemo<AIUserContext>(() => {
    const ctx: AIUserContext = {
      language: language || 'sv',
      isInCalmMode: isInCalmMode || false,
      energyLevel: energyLevel || 'medium',
      onboardingComplete: hasCompletedOnboarding || false
    }

    // Add profile info if available
    if (profile) {
      ctx.firstName = profile.first_name || undefined
      ctx.targetRole = profile.target_role || undefined
      ctx.targetIndustry = profile.target_industry || undefined

      // Determine experience level from years
      const years = profile.experience_years
      if (typeof years === 'number') {
        if (years < 1) ctx.experienceLevel = 'entry'
        else if (years < 3) ctx.experienceLevel = 'junior'
        else if (years < 7) ctx.experienceLevel = 'mid'
        else if (years < 15) ctx.experienceLevel = 'senior'
        else ctx.experienceLevel = 'executive'
      }
    }

    // Add interest profile if available
    if (interestProfile) {
      ctx.hasCompletedInterestGuide = interestProfile.hasResult || false

      if (interestProfile.dominantTypes && interestProfile.dominantTypes.length > 0) {
        ctx.riasecDominant = interestProfile.dominantTypes
          .slice(0, 3)
          .map(t => t.code)
      }
    }

    return ctx
  }, [profile, energyLevel, isInCalmMode, language, hasCompletedOnboarding, interestProfile])

  return context
}

/**
 * Get static context (for use outside React components)
 * This reads from stores directly - use with caution
 */
export function getStaticAIContext(): AIUserContext {
  const authState = useAuthStore.getState()
  const settingsState = useSettingsStore.getState()

  const ctx: AIUserContext = {
    language: settingsState.language || 'sv',
    isInCalmMode: settingsState.calmMode || false,
    energyLevel: settingsState.energyLevel || 'medium',
    onboardingComplete: settingsState.hasCompletedOnboarding || false
  }

  if (authState.profile) {
    ctx.firstName = authState.profile.first_name || undefined
    ctx.targetRole = authState.profile.target_role || undefined
    ctx.targetIndustry = authState.profile.target_industry || undefined

    const years = authState.profile.experience_years
    if (typeof years === 'number') {
      if (years < 1) ctx.experienceLevel = 'entry'
      else if (years < 3) ctx.experienceLevel = 'junior'
      else if (years < 7) ctx.experienceLevel = 'mid'
      else if (years < 15) ctx.experienceLevel = 'senior'
      else ctx.experienceLevel = 'executive'
    }
  }

  return ctx
}

/**
 * Format context for prompt injection
 * Creates a human-readable context string for AI prompts
 */
export function formatContextForPrompt(context: AIUserContext): string {
  const lines: string[] = []

  // Experience level
  if (context.experienceLevel) {
    const levelMap: Record<string, string> = {
      entry: 'nybörjare utan arbetslivserfarenhet',
      junior: 'junior med 1-3 års erfarenhet',
      mid: 'erfaren med 3-7 års erfarenhet',
      senior: 'senior med 7-15 års erfarenhet',
      executive: 'mycket erfaren med 15+ års erfarenhet'
    }
    lines.push(`Användaren är ${levelMap[context.experienceLevel]}.`)
  }

  // Target role/industry
  if (context.targetRole || context.targetIndustry) {
    const parts: string[] = []
    if (context.targetRole) parts.push(`rollen "${context.targetRole}"`)
    if (context.targetIndustry) parts.push(`branschen "${context.targetIndustry}"`)
    lines.push(`Användaren söker jobb inom ${parts.join(' i ')}.`)
  }

  // Interest profile
  if (context.riasecDominant && context.riasecDominant.length > 0) {
    const riasecMap: Record<string, string> = {
      R: 'Realistisk (praktisk, handfast)',
      I: 'Undersökande (analytisk, forskande)',
      A: 'Artistisk (kreativ, konstnärlig)',
      S: 'Social (hjälpsam, samarbetande)',
      E: 'Entreprenöriell (ledande, affärsinriktad)',
      C: 'Konventionell (strukturerad, detaljorienterad)'
    }
    const types = context.riasecDominant.map(t => riasecMap[t] || t).join(', ')
    lines.push(`Intresseprofil: ${types}.`)
  }

  // Energy level adjustments
  if (context.energyLevel === 'low' || context.isInCalmMode) {
    lines.push('Användaren har låg energi just nu - ge kortare, enklare svar och undvik överväldigande information.')
  }

  // Language
  if (context.language === 'en') {
    lines.push('Respond in English.')
  }

  return lines.length > 0
    ? `\n\n[ANVÄNDARKONTEXT]\n${lines.join('\n')}\n`
    : ''
}

export default useAIContext
