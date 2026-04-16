import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAIContext, getStaticAIContext, formatContextForPrompt, type AIUserContext } from './useAIContext'

// Mock stores
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      profile: null as any,
    }
    return selector ? selector(state) : state
  }),
}))

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn((selector) => {
    const state = {
      energyLevel: 'medium' as const,
      calmMode: false,
      language: 'sv' as const,
      hasCompletedOnboarding: false,
    }
    return selector ? selector(state) : state
  }),
}))

vi.mock('@/hooks/useInterestProfile', () => ({
  useInterestProfile: vi.fn(() => ({
    profile: null,
  })),
}))

import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useInterestProfile } from '@/hooks/useInterestProfile'

describe('useAIContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useAIContext hook', () => {
    it('should return default context when no profile exists', () => {
      const { result } = renderHook(() => useAIContext())

      expect(result.current).toEqual({
        language: 'sv',
        isInCalmMode: false,
        energyLevel: 'medium',
        onboardingComplete: false,
      })
    })

    it('should include profile data when available', () => {
      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          profile: {
            first_name: 'Anna',
            target_role: 'Frontend Developer',
            target_industry: 'IT',
            experience_years: 5,
          },
        }
        return selector ? selector(state) : state
      })

      const { result } = renderHook(() => useAIContext())

      expect(result.current.firstName).toBe('Anna')
      expect(result.current.targetRole).toBe('Frontend Developer')
      expect(result.current.targetIndustry).toBe('IT')
      expect(result.current.experienceLevel).toBe('mid')
    })

    it('should determine correct experience level from years', () => {
      const testCases = [
        { years: 0, expected: 'entry' },
        { years: 2, expected: 'junior' },
        { years: 5, expected: 'mid' },
        { years: 10, expected: 'senior' },
        { years: 20, expected: 'executive' },
      ]

      testCases.forEach(({ years, expected }) => {
        vi.mocked(useAuthStore).mockImplementation((selector: any) => {
          const state = {
            profile: { experience_years: years },
          }
          return selector ? selector(state) : state
        })

        const { result } = renderHook(() => useAIContext())
        expect(result.current.experienceLevel).toBe(expected)
      })
    })

    it('should include interest profile when available', () => {
      vi.mocked(useInterestProfile).mockReturnValue({
        profile: {
          hasResult: true,
          dominantTypes: [
            { code: 'S', name: 'Social' },
            { code: 'E', name: 'Enterprising' },
            { code: 'A', name: 'Artistic' },
          ],
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      const { result } = renderHook(() => useAIContext())

      expect(result.current.hasCompletedInterestGuide).toBe(true)
      expect(result.current.riasecDominant).toEqual(['S', 'E', 'A'])
    })

    it('should reflect calm mode and energy settings', () => {
      vi.mocked(useSettingsStore).mockImplementation((selector: any) => {
        const state = {
          energyLevel: 'low' as const,
          calmMode: true,
          language: 'en' as const,
          hasCompletedOnboarding: true,
        }
        return selector ? selector(state) : state
      })

      const { result } = renderHook(() => useAIContext())

      expect(result.current.energyLevel).toBe('low')
      expect(result.current.isInCalmMode).toBe(true)
      expect(result.current.language).toBe('en')
      expect(result.current.onboardingComplete).toBe(true)
    })
  })

  describe('getStaticAIContext', () => {
    beforeEach(() => {
      // Reset mock implementations to use getState pattern
      vi.mocked(useAuthStore as any).getState = vi.fn(() => ({
        profile: null,
      }))
      vi.mocked(useSettingsStore as any).getState = vi.fn(() => ({
        energyLevel: 'medium',
        calmMode: false,
        language: 'sv',
        hasCompletedOnboarding: false,
      }))
    })

    it('should return context from store state directly', () => {
      const context = getStaticAIContext()

      expect(context.language).toBe('sv')
      expect(context.energyLevel).toBe('medium')
    })

    it('should include profile data when available', () => {
      vi.mocked(useAuthStore as any).getState = vi.fn(() => ({
        profile: {
          first_name: 'Erik',
          target_role: 'Backend Developer',
          experience_years: 8,
        },
      }))

      const context = getStaticAIContext()

      expect(context.firstName).toBe('Erik')
      expect(context.targetRole).toBe('Backend Developer')
      expect(context.experienceLevel).toBe('senior')
    })
  })

  describe('formatContextForPrompt', () => {
    it('should return empty string for minimal context', () => {
      const context: AIUserContext = {}
      const result = formatContextForPrompt(context)

      expect(result).toBe('')
    })

    it('should format experience level correctly', () => {
      const context: AIUserContext = {
        experienceLevel: 'junior',
      }
      const result = formatContextForPrompt(context)

      expect(result).toContain('ANVÄNDARKONTEXT')
      expect(result).toContain('junior med 1-3 års erfarenhet')
    })

    it('should format target role and industry', () => {
      const context: AIUserContext = {
        targetRole: 'UX Designer',
        targetIndustry: 'E-handel',
      }
      const result = formatContextForPrompt(context)

      expect(result).toContain('UX Designer')
      expect(result).toContain('E-handel')
      expect(result).toContain('söker jobb inom')
    })

    it('should format RIASEC profile', () => {
      const context: AIUserContext = {
        riasecDominant: ['S', 'E', 'A'],
      }
      const result = formatContextForPrompt(context)

      expect(result).toContain('Intresseprofil')
      expect(result).toContain('Social')
      expect(result).toContain('Entreprenöriell')
      expect(result).toContain('Artistisk')
    })

    it('should add low energy note when applicable', () => {
      const context: AIUserContext = {
        energyLevel: 'low',
      }
      const result = formatContextForPrompt(context)

      expect(result).toContain('låg energi')
      expect(result).toContain('kortare, enklare svar')
    })

    it('should add calm mode note when applicable', () => {
      const context: AIUserContext = {
        isInCalmMode: true,
      }
      const result = formatContextForPrompt(context)

      expect(result).toContain('låg energi')
    })

    it('should add English instruction when language is en', () => {
      const context: AIUserContext = {
        language: 'en',
      }
      const result = formatContextForPrompt(context)

      expect(result).toContain('Respond in English')
    })

    it('should combine multiple context elements', () => {
      const context: AIUserContext = {
        experienceLevel: 'mid',
        targetRole: 'Projektledare',
        riasecDominant: ['E', 'S'],
        energyLevel: 'low',
      }
      const result = formatContextForPrompt(context)

      expect(result).toContain('ANVÄNDARKONTEXT')
      expect(result).toContain('3-7 års erfarenhet')
      expect(result).toContain('Projektledare')
      expect(result).toContain('Intresseprofil')
      expect(result).toContain('låg energi')
    })
  })
})
