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
      // saved_jobs — den levande tabellen (UX8). Sista raden är arkiverad och
      // ska INTE räknas, så filtret i buildApplicationStats verifieras.
      if (table === 'saved_jobs')
        return makeBuilder([
          { status: 'saved', archived_at: null },
          { status: 'applied', archived_at: null },
          { status: 'rejected', archived_at: null },
          { status: 'saved', archived_at: '2026-07-01T00:00:00Z' },
        ])
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
    expect(fromMock).toHaveBeenCalledWith('saved_jobs')
    expect(fromMock).toHaveBeenCalledWith('spontaneous_companies')
    expect(fromMock).toHaveBeenCalledTimes(5)
  })

  it('räknar ansökningar ur saved_jobs och hoppar över arkiverade', async () => {
    const { useJobsokHubSummary } = await import('./useJobsokHubSummary')
    const { result } = renderHook(() => useJobsokHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const stats = result.current.data!.applicationStats
    expect(stats.total).toBe(3) // 4 rader, 1 arkiverad
    expect(stats.byStatus).toMatchObject({ saved: 1, applied: 1, rejected: 1 })
  })

  // Regressionsvakt för UX8 (2026-07-27): hubben skrev sina EGNA former till
  // cache-nycklar som ägs av andra hooks. ['application-stats'] ägs av
  // useApplications (platt {total,active,…} ur saved_jobs), ['cv-versions'] och
  // ['cover-letters'] av useDocuments (hela objekt). Hubbens former är andra, så
  // skrivningen fick Ansökningar-sidan att visa "Du har inte börjat söka jobb än"
  // trots 24 rader i prod. En nyckel = en form = en ägare.
  it('skriver INTE till cache-nycklar som ägs av andra hooks (UX8)', async () => {
    const { useJobsokHubSummary } = await import('./useJobsokHubSummary')
    const { result } = renderHook(() => useJobsokHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(_qc.getQueryData(['application-stats'])).toBeUndefined()
    expect(_qc.getQueryData(['cv-versions'])).toBeUndefined()
    expect(_qc.getQueryData(['cover-letters'])).toBeUndefined()
  })
})
