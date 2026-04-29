import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

// Mock useAuth — switched per test by mockReturnValueOnce in its own block.
const useAuthMock = vi.fn(() => ({
  user: { id: 'test-user-id' },
  profile: null,
  loading: false,
  isAuthenticated: true,
}))
vi.mock('@/hooks/useSupabase', () => ({
  useAuth: () => useAuthMock(),
}))

// Supabase mock — captures update payloads for assertions.
const updateSpy = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
}))
const fromMock = vi.fn(() => ({ update: updateSpy }))
vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}))

let _qc: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  _qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  // Pre-seed cache with empty onboarded_hubs to mimic returning loader data
  _qc.setQueryData(['hub', 'oversikt', 'test-user-id'], {
    onboarded_hubs: [],
    full_name: null,
  })
  return createElement(QueryClientProvider, { client: _qc }, children)
}

describe('useOnboardedHubsTracking', () => {
  beforeEach(() => {
    fromMock.mockClear()
    updateSpy.mockClear()
    useAuthMock.mockReturnValue({
      user: { id: 'test-user-id' },
      profile: null,
      loading: false,
      isAuthenticated: true,
    })
  })

  it("appends hub_id to profiles.onboarded_hubs on first mount and updates the cache", async () => {
    const { useOnboardedHubsTracking } = await import('./useOnboardedHubsTracking')
    renderHook(() => useOnboardedHubsTracking('jobb'), { wrapper })
    await waitFor(() => expect(updateSpy).toHaveBeenCalled())
    // The supabase.from('profiles').update({onboarded_hubs: ['jobb']}) call happened
    expect(fromMock).toHaveBeenCalledWith('profiles')
    expect(updateSpy).toHaveBeenCalledWith({ onboarded_hubs: ['jobb'] })
    // Cache reflects the optimistic update
    await waitFor(() => {
      const cached = _qc.getQueryData(['hub', 'oversikt', 'test-user-id']) as {
        onboarded_hubs: string[]
      }
      expect(cached.onboarded_hubs).toEqual(['jobb'])
    })
  })

  it('does NOT call supabase.update when hubId is already in onboarded_hubs', async () => {
    // Seed cache with hubId already present — should be a no-op.
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    qc.setQueryData(['hub', 'oversikt', 'test-user-id'], {
      onboarded_hubs: ['jobb'],
      full_name: null,
    })
    const localWrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: qc }, children)

    const { useOnboardedHubsTracking } = await import('./useOnboardedHubsTracking')
    renderHook(() => useOnboardedHubsTracking('jobb'), { wrapper: localWrapper })
    // Wait long enough for any mutation to fire if it would
    await new Promise(r => setTimeout(r, 50))
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('is a no-op when userId is empty (logged-out)', async () => {
    useAuthMock.mockReturnValue({
      user: null as unknown as { id: string },
      profile: null,
      loading: false,
      isAuthenticated: false,
    })
    const { useOnboardedHubsTracking } = await import('./useOnboardedHubsTracking')
    renderHook(() => useOnboardedHubsTracking('jobb'), { wrapper })
    await new Promise(r => setTimeout(r, 50))
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it("does not double-fire on rerender (useRef guard)", async () => {
    const { useOnboardedHubsTracking } = await import('./useOnboardedHubsTracking')
    const { rerender } = renderHook(() => useOnboardedHubsTracking('jobb'), { wrapper })
    await waitFor(() => expect(updateSpy).toHaveBeenCalled())
    const firstCount = updateSpy.mock.calls.length
    rerender()
    rerender()
    rerender()
    expect(updateSpy.mock.calls.length).toBe(firstCount)
  })
})
