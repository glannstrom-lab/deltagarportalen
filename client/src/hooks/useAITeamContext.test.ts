import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAITeamContext } from './useAITeamContext'

// Regression (2026-09-22): the hook read `interestProfile.suggestedCareers`,
// a field that does not exist on InterestProfile (real shape:
// `recommendedOccupations: Array<{ name, matchPercentage }>`). The AI-team
// coach's system prompt silently never included "Föreslagna yrken" for any
// user who completed the interest guide — no crash, just quietly dropped
// data, so nothing in normal testing would have caught it.

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ profile: null, user: { id: 'u1' } }),
}))

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: () => ({ energyLevel: 'medium', language: 'sv' }),
}))

vi.mock('@/hooks/useSupabase', () => ({
  useCV: () => ({ cv: null, loading: false }),
}))

vi.mock('@/hooks/useApplications', () => ({
  useApplications: () => ({ applications: [], stats: null, isLoading: false }),
}))

const mockInterestProfile = vi.fn()
vi.mock('@/hooks/useInterestProfile', () => ({
  useInterestProfile: () => ({ profile: mockInterestProfile() }),
}))

describe('useAITeamContext', () => {
  it('maps recommendedOccupations from the interest profile to suggestedCareers', () => {
    mockInterestProfile.mockReturnValue({
      hasResult: true,
      riasecScores: null,
      dominantTypes: [{ code: 'realistic', score: 10 }],
      recommendedOccupations: [
        { name: 'Snickare', matchPercentage: 90 },
        { name: 'Elektriker', matchPercentage: 80 },
      ],
      completedAt: '2026-09-01',
    })

    const { result } = renderHook(() => useAITeamContext())

    expect(result.current.context.suggestedCareers).toEqual(['Snickare', 'Elektriker'])
    expect(result.current.context.riasecTypes).toEqual(['realistic'])
  })

  it('leaves suggestedCareers unset when there are no recommended occupations', () => {
    mockInterestProfile.mockReturnValue({
      hasResult: false,
      riasecScores: null,
      dominantTypes: [],
      recommendedOccupations: [],
      completedAt: null,
    })

    const { result } = renderHook(() => useAITeamContext())

    expect(result.current.context.suggestedCareers).toBeUndefined()
  })
})
