import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

// Source of truth for the consultant_participants column name:
// .planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md §consultant_participants
const CONSULTANT_PARTICIPANT_COL = 'participant_id'

vi.mock('@/hooks/useSupabase', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    profile: null,
    loading: false,
    isAuthenticated: true,
  }),
}))

const fromMock = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}))

/**
 * makeBuilder — supports two return shapes:
 *   - data-only chains: { data, error: null }
 *   - count-only chains (head: true): { data: null, error: null, count }
 *
 * Tracks `.eq` calls so tests can assert column names used per chain.
 */
function makeBuilder(data: unknown, count?: number) {
  const builder: Record<string, unknown> = {}
  const eqCalls: Array<[string, unknown]> = []
  const resolved = { data, error: null, count: count ?? null }
  const resolve = () => Promise.resolve(resolved)
  builder.select = vi.fn(() => builder)
  builder.eq = vi.fn((col: string, val: unknown) => {
    eqCalls.push([col, val])
    return builder
  })
  builder.gte = vi.fn(() => builder)
  builder.not = vi.fn(() => builder)
  builder.order = vi.fn(() => builder)
  builder.limit = vi.fn(() => builder)
  builder.maybeSingle = vi.fn(resolve)
  // Thenable so `await builder` resolves
  ;(builder as Record<string, unknown>).then = (
    onFulfilled: (v: typeof resolved) => unknown
  ) => Promise.resolve(resolved).then(onFulfilled)
  ;(builder as { __eqCalls: Array<[string, unknown]> }).__eqCalls = eqCalls
  return builder
}

let _qc: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  _qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: _qc }, children)
}

describe('useMinVardagHubSummary', () => {
  // Track latest builders per table so tests can assert .eq calls
  const builders: Record<string, ReturnType<typeof makeBuilder>[]> = {}

  beforeEach(() => {
    fromMock.mockReset()
    for (const k of Object.keys(builders)) delete builders[k]
    fromMock.mockImplementation((table: string) => {
      let b: ReturnType<typeof makeBuilder>
      if (table === 'mood_logs') {
        b = makeBuilder([
          { mood_level: 4, energy_level: 3, log_date: '2026-04-27' },
          { mood_level: 3, energy_level: 3, log_date: '2026-04-26' },
        ])
      } else if (table === 'diary_entries') {
        // First call (count: head:true) returns count=5; second call (latest, maybeSingle) returns row
        if (!builders.diary_entries) {
          b = makeBuilder(null, 5)
        } else {
          b = makeBuilder({ id: 'd1', created_at: '2026-04-25' })
        }
      } else if (table === 'calendar_events') {
        b = makeBuilder([
          {
            id: 'e1',
            title: 'Intervju Klarna',
            date: '2026-05-05',
            time: '14:00',
            type: 'meeting',
          },
        ])
      } else if (table === 'network_contacts') {
        b = makeBuilder(null, 8)
      } else if (table === 'consultant_participants') {
        b = makeBuilder({
          consultant_id: 'c1',
          profiles: { id: 'c1', full_name: 'Anna Karlsson', avatar_url: null },
        })
      } else {
        b = makeBuilder(null)
      }
      builders[table] = [...(builders[table] ?? []), b]
      return b
    })
  })

  it('fires Promise.all of 6 supabase calls (mood, diary count, diary latest, calendar, network count, consultant join)', async () => {
    const { useMinVardagHubSummary } = await import('./useMinVardagHubSummary')
    const { result } = renderHook(() => useMinVardagHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fromMock).toHaveBeenCalledWith('mood_logs')
    expect(fromMock).toHaveBeenCalledWith('diary_entries')
    expect(fromMock).toHaveBeenCalledWith('calendar_events')
    expect(fromMock).toHaveBeenCalledWith('network_contacts')
    expect(fromMock).toHaveBeenCalledWith('consultant_participants')
    // diary_entries is called twice (count + latest); total = 6
    expect(fromMock).toHaveBeenCalledTimes(6)
    expect(builders.diary_entries).toHaveLength(2)
  })

  it('returns MinVardagSummary shape with all 6 slices populated from fixture', async () => {
    const { useMinVardagHubSummary } = await import('./useMinVardagHubSummary')
    const { result } = renderHook(() => useMinVardagHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const data = result.current.data!
    expect(data).toHaveProperty('recentMoodLogs')
    expect(data).toHaveProperty('diaryEntryCount')
    expect(data).toHaveProperty('latestDiaryEntry')
    expect(data).toHaveProperty('upcomingEvents')
    expect(data).toHaveProperty('networkContactsCount')
    expect(data).toHaveProperty('consultant')
    expect(data.recentMoodLogs).toHaveLength(2)
    expect(data.diaryEntryCount).toBe(5)
    expect(data.latestDiaryEntry).toMatchObject({ id: 'd1', created_at: '2026-04-25' })
    expect(data.upcomingEvents).toHaveLength(1)
    expect(data.networkContactsCount).toBe(8)
    expect(data.consultant).toMatchObject({
      id: 'c1',
      full_name: 'Anna Karlsson',
      avatar_url: null,
    })
  })

  it('returns recentMoodLogs as [] (not undefined) when mood_logs fixture is empty — Sparkline-safe', async () => {
    fromMock.mockReset()
    fromMock.mockImplementation((table: string) => {
      if (table === 'mood_logs') return makeBuilder([])
      if (table === 'diary_entries') return makeBuilder(null, 0)
      if (table === 'calendar_events') return makeBuilder([])
      if (table === 'network_contacts') return makeBuilder(null, 0)
      if (table === 'consultant_participants') return makeBuilder(null)
      return makeBuilder(null)
    })
    const { useMinVardagHubSummary } = await import('./useMinVardagHubSummary')
    const { result } = renderHook(() => useMinVardagHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.recentMoodLogs).toEqual([])
    // never undefined
    expect(result.current.data!.recentMoodLogs).not.toBeUndefined()
  })

  it('summary.consultant is null when consultant_participants returns null', async () => {
    fromMock.mockReset()
    fromMock.mockImplementation((table: string) => {
      if (table === 'mood_logs') return makeBuilder([])
      if (table === 'diary_entries') return makeBuilder(null, 0)
      if (table === 'calendar_events') return makeBuilder([])
      if (table === 'network_contacts') return makeBuilder(null, 0)
      if (table === 'consultant_participants') return makeBuilder(null)
      return makeBuilder(null)
    })
    const { useMinVardagHubSummary } = await import('./useMinVardagHubSummary')
    const { result } = renderHook(() => useMinVardagHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.consultant).toBeNull()
  })

  it('consultant_participants query filters by the column recorded in 05-DB-DISCOVERY.md', async () => {
    const { useMinVardagHubSummary } = await import('./useMinVardagHubSummary')
    const { result } = renderHook(() => useMinVardagHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const consultantBuilder = builders.consultant_participants?.[0]
    expect(consultantBuilder).toBeDefined()
    const eqCalls = (consultantBuilder as { __eqCalls: Array<[string, unknown]> }).__eqCalls
    expect(eqCalls).toEqual([[CONSULTANT_PARTICIPANT_COL, 'test-user-id']])
  })
})
