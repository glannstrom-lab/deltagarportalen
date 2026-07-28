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
  // limit returns the builder so the chain ends at await OR .maybeSingle()
  builder.limit = vi.fn(() => builder)
  builder.maybeSingle = vi.fn(resolve)
  // Thenable for tables where the chain ends without maybeSingle (lettersR, articlesR, aiTeamR)
  ;(builder as Record<string, unknown>).then = (
    resolve: (v: { data: unknown; error: null }) => unknown
  ) => Promise.resolve({ data, error: null }).then(resolve)
  return builder
}

let _qc: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  _qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: _qc }, children)
}

describe('useResurserHubSummary', () => {
  beforeEach(() => {
    fromMock.mockReset()
    fromMock.mockImplementation((table: string) => {
      if (table === 'cvs')
        return makeBuilder({ id: 'cv-r', updated_at: '2026-04-25' })
      if (table === 'cover_letters')
        return makeBuilder([
          { id: 'cl-r', title: 'Spotify', created_at: '2026-04-26' },
        ])
      if (table === 'article_reading_progress')
        return makeBuilder([
          { article_id: 'a1', progress_percent: 100, is_completed: true, completed_at: '2026-04-20' },
          { article_id: 'a2', progress_percent: 60, is_completed: false, completed_at: null },
        ])
      if (table === 'ai_team_sessions')
        return makeBuilder([
          { agent_id: 'career-coach', updated_at: '2026-04-25' },
        ])
      return makeBuilder(null)
    })
  })

  it('fires Promise.all of 4 supabase selects on mount (cvs, cover_letters, article_reading_progress, ai_team_sessions)', async () => {
    const { useResurserHubSummary } = await import('./useResurserHubSummary')
    const { result } = renderHook(() => useResurserHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fromMock).toHaveBeenCalledWith('cvs')
    expect(fromMock).toHaveBeenCalledWith('cover_letters')
    expect(fromMock).toHaveBeenCalledWith('article_reading_progress')
    expect(fromMock).toHaveBeenCalledWith('ai_team_sessions')
    expect(fromMock).toHaveBeenCalledTimes(4)
  })

  it('returns ResurserSummary shape with cv, coverLetters, recentArticles, aiTeamSessions populated', async () => {
    const { useResurserHubSummary } = await import('./useResurserHubSummary')
    const { result } = renderHook(() => useResurserHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const data = result.current.data!
    expect(data).toHaveProperty('cv')
    expect(data).toHaveProperty('coverLetters')
    expect(data).toHaveProperty('recentArticles')
    expect(data).toHaveProperty('articleCompletedCount')
    expect(data).toHaveProperty('aiTeamSessions')
    expect(data).toHaveProperty('aiTeamSessionCount')
    expect(data.cv).toMatchObject({ id: 'cv-r', updated_at: '2026-04-25' })
    expect(data.coverLetters).toHaveLength(1)
    expect(data.coverLetters[0]).toMatchObject({ id: 'cl-r', title: 'Spotify' })
    expect(data.recentArticles).toHaveLength(2)
    expect(data.aiTeamSessions).toHaveLength(1)
    expect(data.aiTeamSessions[0]).toMatchObject({ agent_id: 'career-coach' })
    expect(data.aiTeamSessionCount).toBe(1)
  })

  // Regressionsvakt för UX8 (2026-07-27): hubben skrev sina egna former till
  // nycklar som ägs av useDocuments — ['cv-versions'] väntar hela CVVersion[] men
  // fick en stubbe med {id, updated_at}, ['cover-letters'] väntar alla brev men
  // fick hubbens tre senaste. Samma buggklass som tömde Ansökningar-sidan.
  it('skriver INTE till cache-nycklar som ägs av useDocuments (UX8)', async () => {
    const { useResurserHubSummary } = await import('./useResurserHubSummary')
    const { result } = renderHook(() => useResurserHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(_qc.getQueryData(['cv-versions'])).toBeUndefined()
    expect(_qc.getQueryData(['cover-letters'])).toBeUndefined()
  })

  it('articleCompletedCount counts only is_completed=true rows', async () => {
    const { useResurserHubSummary } = await import('./useResurserHubSummary')
    const { result } = renderHook(() => useResurserHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // Fixture has 1 completed (a1) + 1 not completed (a2) → count = 1
    expect(result.current.data!.articleCompletedCount).toBe(1)
  })
})
