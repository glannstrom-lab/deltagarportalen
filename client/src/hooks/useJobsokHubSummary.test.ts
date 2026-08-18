import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import type { ApplicationStatus } from '@/types/application.types'

vi.mock('@/hooks/useSupabase', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' }, profile: null, loading: false, isAuthenticated: true }),
}))

const fromMock = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    // applicationsApi äger saved_jobs sedan E12 och autentiserar själv
    auth: { getUser: async () => ({ data: { user: { id: 'test-user-id' } } }) },
  },
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

  /**
   * Vakten för buggen som fanns fram till 2026-08-18: fyra segment slog upp
   * fem statusnycklar av elva, varav en (`closed`) inte ens finns i typen.
   * Sju statusar räknades i `total` men i inget segment, så Översikt visade
   * "ANSÖKNINGAR 5" över "2 + 1 + 0 + 0".
   *
   * Testet itererar över HELA `ApplicationStatus` — läggs en status till i
   * typen utan att få en grupp, faller det här.
   */
  it('summan av segmenten är alltid lika med total — för varje status i typen', async () => {
    const ALLA: ApplicationStatus[] = [
      'interested', 'saved', 'applied', 'screening', 'phone',
      'interview', 'assessment', 'offer', 'accepted', 'rejected', 'withdrawn',
    ]
    fromMock.mockImplementation((table: string) => {
      if (table === 'saved_jobs')
        return makeBuilder(ALLA.map((status) => ({ status, archived_at: null })))
      return makeBuilder([])
    })

    const { useJobsokHubSummary } = await import('./useJobsokHubSummary')
    const { result } = renderHook(() => useJobsokHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const stats = result.current.data!.applicationStats
    const summa = stats.segments.reduce((n, seg) => n + seg.count, 0)
    expect(stats.total).toBe(ALLA.length)
    expect(summa).toBe(stats.total)

    // Summan stämmer även om en grupp glöms bort, eftersom restposten `other`
    // fångar upp det. Restposten är ett skyddsnät, inte ett svar: en status
    // som hamnar där saknar etikett i vyn. Kräv därför att varje känd status
    // har en EGEN grupp — annars fäller den här raden, inte summan.
    const restpost = stats.segments.find((seg) => seg.key === 'other')
    expect(restpost, 'en status i ApplicationStatus saknar segmentgrupp').toBeUndefined()
  })

  it('segmenten bär nycklar, inte färdig svensk text', async () => {
    // Etiketterna låg tidigare som strängar ('aktiva', 'svar inväntas') här i
    // datalagret och kunde därför aldrig översättas — en engelskspråkig
    // användare fick dem på svenska oavsett språkval.
    const { useJobsokHubSummary } = await import('./useJobsokHubSummary')
    const { result } = renderHook(() => useJobsokHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    for (const seg of result.current.data!.applicationStats.segments) {
      expect(seg.key).toMatch(/^[a-z]+$/)
      expect(seg).not.toHaveProperty('label')
    }
  })

  it('kastar när en av tabellerna svarar med fel — ett fel är inte tom data', async () => {
    // `?? []` gjorde tidigare om ett RLS-avslag till en tom lista, och
    // Översikt renderade "Inte påbörjat än" — ett påstående om personen när
    // felet satt i systemet.
    fromMock.mockImplementation((table: string) => {
      if (table === 'cvs') {
        const b: Record<string, unknown> = {}
        b.select = vi.fn(() => b)
        b.eq = vi.fn(() => b)
        b.maybeSingle = vi.fn(() =>
          Promise.resolve({ data: null, error: { message: 'permission denied' } })
        )
        return b
      }
      return makeBuilder([])
    })

    const { useJobsokHubSummary } = await import('./useJobsokHubSummary')
    const { result } = renderHook(() => useJobsokHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
