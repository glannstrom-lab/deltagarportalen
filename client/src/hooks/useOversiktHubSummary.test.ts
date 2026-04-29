import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

// Mock useAuth — return logged-in user
vi.mock('@/hooks/useSupabase', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    profile: null,
    loading: false,
    isAuthenticated: true,
  }),
}))

// Mock the four sibling hub loaders. Each returns a stub summary + matching KEY.
// The aggregator's job is to TRIGGER them and collect their data — not to issue
// its own SELECTs for the cross-hub data (Pitfall D).
const jobsokSummary = { applicationStats: { total: 5 } }
const karriarSummary = { careerGoals: { shortTerm: 'Senior UX' } }
const resurserSummary = { articleCompletedCount: 3 }
const minVardagSummary = { diaryEntryCount: 2 }

const useJobsokHubSummaryMock = vi.fn(() => ({ data: jobsokSummary, isLoading: false }))
const useKarriarHubSummaryMock = vi.fn(() => ({ data: karriarSummary, isLoading: false }))
const useResurserHubSummaryMock = vi.fn(() => ({ data: resurserSummary, isLoading: false }))
const useMinVardagHubSummaryMock = vi.fn(() => ({ data: minVardagSummary, isLoading: false }))

vi.mock('./useJobsokHubSummary', () => ({
  useJobsokHubSummary: () => useJobsokHubSummaryMock(),
  JOBSOK_HUB_KEY: (id: string) => ['hub', 'jobsok', id],
}))
vi.mock('./useKarriarHubSummary', () => ({
  useKarriarHubSummary: () => useKarriarHubSummaryMock(),
  KARRIAR_HUB_KEY: (id: string) => ['hub', 'karriar', id],
}))
vi.mock('./useResurserHubSummary', () => ({
  useResurserHubSummary: () => useResurserHubSummaryMock(),
  RESURSER_HUB_KEY: (id: string) => ['hub', 'resurser', id],
}))
vi.mock('./useMinVardagHubSummary', () => ({
  useMinVardagHubSummary: () => useMinVardagHubSummaryMock(),
  MIN_VARDAG_HUB_KEY: (id: string) => ['hub', 'min-vardag', id],
}))

// Supabase mock — only exercised for the profile select in the aggregator.
const fromMock = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}))

function makeProfileBuilder(data: unknown) {
  const builder: Record<string, unknown> = {}
  builder.select = vi.fn(() => builder)
  builder.eq = vi.fn(() => builder)
  builder.maybeSingle = vi.fn(() => Promise.resolve({ data, error: null }))
  return builder
}

let _qc: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  _qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: _qc }, children)
}

describe('useOversiktHubSummary', () => {
  beforeEach(() => {
    fromMock.mockReset()
    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return makeProfileBuilder({
          onboarded_hubs: ['jobb'],
          full_name: 'Anna Karlsson',
        })
      }
      return makeProfileBuilder(null)
    })
    useJobsokHubSummaryMock.mockClear()
    useKarriarHubSummaryMock.mockClear()
    useResurserHubSummaryMock.mockClear()
    useMinVardagHubSummaryMock.mockClear()
  })

  it('triggers the profile select AND invokes all 4 sibling hub-loader hooks', async () => {
    const { useOversiktHubSummary } = await import('./useOversiktHubSummary')
    const { result } = renderHook(() => useOversiktHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.data).toBeDefined())
    // Profile fetch was issued exactly once
    expect(fromMock).toHaveBeenCalledWith('profiles')
    // The four sibling hub-loader hooks were each invoked at least once.
    expect(useJobsokHubSummaryMock).toHaveBeenCalled()
    expect(useKarriarHubSummaryMock).toHaveBeenCalled()
    expect(useResurserHubSummaryMock).toHaveBeenCalled()
    expect(useMinVardagHubSummaryMock).toHaveBeenCalled()
  })

  it('returns OversiktSummary with profile + 4 sibling slices populated', async () => {
    const { useOversiktHubSummary } = await import('./useOversiktHubSummary')
    const { result } = renderHook(() => useOversiktHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.data).toBeDefined())
    const data = result.current.data!
    expect(data.profile).toMatchObject({
      onboarded_hubs: ['jobb'],
      full_name: 'Anna Karlsson',
    })
    expect(data.jobsok).toBe(jobsokSummary)
    expect(data.karriar).toBe(karriarSummary)
    expect(data.resurser).toBe(resurserSummary)
    expect(data.minVardag).toBe(minVardagSummary)
  })

  it('returns onboarded_hubs as [] (not null) when profile row is null — empty-array safe', async () => {
    fromMock.mockReset()
    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') return makeProfileBuilder(null)
      return makeProfileBuilder(null)
    })
    const { useOversiktHubSummary } = await import('./useOversiktHubSummary')
    const { result } = renderHook(() => useOversiktHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data!.profile).toMatchObject({
      onboarded_hubs: [],
      full_name: null,
    })
  })

  it('isLoading reflects any sibling loader still loading', async () => {
    useMinVardagHubSummaryMock.mockReturnValueOnce({
      data: undefined as unknown as typeof minVardagSummary,
      isLoading: true,
    })
    const { useOversiktHubSummary } = await import('./useOversiktHubSummary')
    const { result } = renderHook(() => useOversiktHubSummary(), { wrapper })
    // First render: minVardag is loading → aggregator should report isLoading true.
    expect(result.current.isLoading).toBe(true)
  })
})
