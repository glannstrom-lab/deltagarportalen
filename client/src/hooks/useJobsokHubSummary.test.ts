import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/hooks/useSupabase', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' }, profile: null, loading: false, isAuthenticated: true }),
}))

const fromMock = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}))

function makeBuilder(data: unknown) {
  const builder: Record<string, unknown> = {}
  const resolve = () => Promise.resolve({ data, error: null })
  builder.select = vi.fn(() => builder)
  builder.eq = vi.fn(() => builder)
  builder.not = vi.fn(() => builder)
  builder.order = vi.fn(() => builder)
  builder.limit = vi.fn(resolve)
  builder.maybeSingle = vi.fn(resolve)
  // For tables where chain ends at .eq (job_applications, spontaneous_companies)
  // the Promise.all awaits the builder itself — add then() for thenable support
  ;(builder as Record<string, unknown>).then = (resolve: (v: { data: unknown; error: null }) => unknown) =>
    Promise.resolve({ data, error: null }).then(resolve)
  return builder
}

let _qc: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  _qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: _qc }, children)
}

describe('useJobsokHubSummary', () => {
  beforeEach(() => {
    fromMock.mockReset()
    // Per-table fixtures
    fromMock.mockImplementation((table: string) => {
      if (table === 'cvs')
        return makeBuilder({ id: 'cv1', updated_at: '2026-04-25', completion_pct: 75 })
      if (table === 'cover_letters')
        return makeBuilder([{ id: 'cl1', title: 'Klarna', created_at: '2026-04-26' }])
      if (table === 'interview_sessions')
        return makeBuilder([{ id: 's1', score: 84, created_at: '2026-04-27' }])
      if (table === 'job_applications')
        return makeBuilder([{ status: 'saved' }, { status: 'applied' }, { status: 'rejected' }])
      if (table === 'spontaneous_companies')
        return makeBuilder([{ id: 'c1' }, { id: 'c2' }])
      return makeBuilder([])
    })
  })

  it('fires Promise.all of 5 supabase selects on mount (HUB-01 loader)', async () => {
    const { useJobsokHubSummary } = await import('./useJobsokHubSummary')
    const { result } = renderHook(() => useJobsokHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fromMock).toHaveBeenCalledWith('cvs')
    expect(fromMock).toHaveBeenCalledWith('cover_letters')
    expect(fromMock).toHaveBeenCalledWith('interview_sessions')
    expect(fromMock).toHaveBeenCalledWith('job_applications')
    expect(fromMock).toHaveBeenCalledWith('spontaneous_companies')
    expect(fromMock).toHaveBeenCalledTimes(5)
  })

  it('populates [application-stats] cache key after loader resolves (HUB-01 cache-sync)', async () => {
    const { useJobsokHubSummary } = await import('./useJobsokHubSummary')
    const { result } = renderHook(() => useJobsokHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const stats = _qc.getQueryData(['application-stats']) as { byStatus: Record<string, number> } | undefined
    expect(stats).toBeDefined()
    expect(stats).toHaveProperty('byStatus')
    expect(stats!.byStatus).toMatchObject({ saved: 1, applied: 1, rejected: 1 })
  })

  it('populates [cv-versions] and [cover-letters] cache keys after loader resolves', async () => {
    const { useJobsokHubSummary } = await import('./useJobsokHubSummary')
    const { result } = renderHook(() => useJobsokHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cvs = _qc.getQueryData(['cv-versions'])
    const letters = _qc.getQueryData(['cover-letters'])
    expect(Array.isArray(cvs)).toBe(true)
    expect(Array.isArray(letters)).toBe(true)
  })
})
