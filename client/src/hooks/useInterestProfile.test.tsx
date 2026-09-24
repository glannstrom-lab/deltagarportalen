/**
 * interestGuideApi.getHistory KASTAR vid läsfel sedan 2026-09-24. Hooken
 * använder historiken bara som genväg — utan den räknas profilen ur
 * progress.answers. Ett läsfel på historiken får därför inte ge
 * hasResult: false (vilket hookens yttre catch annars gör).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

const { getProgress, getHistory, calculateUserProfile } = vi.hoisted(() => ({
  getProgress: vi.fn(),
  getHistory: vi.fn(),
  calculateUserProfile: vi.fn(),
}))

vi.mock('@/services/cloudStorage', () => ({
  interestGuideApi: { getProgress, getHistory },
}))
vi.mock('@/services/interestGuideData', () => ({ calculateUserProfile }))

import { useInterestProfile } from './useInterestProfile'

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useInterestProfile — läsfel på historiken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    getProgress.mockResolvedValue({
      is_completed: true,
      answers: { q1: 5 },
      updated_at: '2026-09-20T10:00:00Z',
    })
    calculateUserProfile.mockReturnValue({
      riasec: { R: 1, I: 2, A: 3, S: 4, E: 5, C: 0 },
    })
  })

  it('räknar profilen ur sparade svar när getHistory kastar', async () => {
    getHistory.mockRejectedValue(new Error('nätverksfel'))

    const { result } = renderHook(() => useInterestProfile(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(getHistory).toHaveBeenCalled()
    expect(result.current.profile.hasResult).toBe(true)
    expect(result.current.profile.riasecScores?.enterprising).toBe(100)
    expect(result.current.profile.completedAt).toBe('2026-09-20T10:00:00Z')
  })
})
