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

/**
 * B33 (2026-08-09): mocken kan nu skilja på en LISTFRÅGA och en COUNT-fråga.
 *
 * Hooken hämtar antalen med `.select(col, { count: 'exact', head: true })`
 * i stället för att räkna i en `.limit(n)`-lista (en användare med åtta
 * avklarade artiklar kunde aldrig se mer än 3). Mocken måste spegla det:
 * en head-fråga ger `{ data: null, count }`, en vanlig ger `{ data, count: null }`
 * — precis som supabase-js. Gör den inte det, "passerar" testet mot en form
 * som inte finns i drift.
 */
function makeBuilder(data: unknown, count: number | null = null) {
  const builder: Record<string, unknown> = {}
  let isHead = false
  const result = () =>
    isHead ? { data: null, count, error: null } : { data, count: null, error: null }
  builder.select = vi.fn((_cols?: unknown, opts?: { head?: boolean; count?: string }) => {
    if (opts?.head) isHead = true
    return builder
  })
  builder.eq = vi.fn(() => builder)
  builder.not = vi.fn(() => builder)
  builder.order = vi.fn(() => builder)
  // limit returns the builder so the chain ends at await OR .maybeSingle()
  builder.limit = vi.fn(() => builder)
  builder.maybeSingle = vi.fn(() => Promise.resolve(result()))
  // Thenable for tables where the chain ends without maybeSingle (lettersR, articlesR, aiTeamR)
  ;(builder as Record<string, unknown>).then = (
    resolve: (v: { data: unknown; count: number | null; error: null }) => unknown
  ) => Promise.resolve(result()).then(resolve)
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
      // B33: antalen är MEDVETET större än listorna. Listan är `.limit(3)`
      // respektive `.limit(5)`; räknaren ska komma från count-frågan. Vore de
      // lika kunde testet inte skilja den lagade koden från den trasiga.
      if (table === 'article_reading_progress')
        return makeBuilder(
          [
            { article_id: 'a1', progress_percent: 100, is_completed: true, completed_at: '2026-04-20' },
            { article_id: 'a2', progress_percent: 60, is_completed: false, completed_at: null },
          ],
          8
        )
      if (table === 'ai_team_sessions')
        return makeBuilder([{ agent_id: 'career-coach', updated_at: '2026-04-25' }], 12)
      return makeBuilder(null)
    })
  })

  // B33 (2026-08-09): 4 → 6. De två nya är count-frågor (`head: true`) mot
  // article_reading_progress och ai_team_sessions. De hämtar inga rader, bara
  // antalet — se kommentaren i hooken om varför antal aldrig får räknas i en
  // `.limit()`-kapad lista. Taket här är en vakt mot att hubben smyger in fler
  // rundresor, inte ett förbud mot de här två.
  it('fires Promise.all of 6 supabase selects on mount (4 listor + 2 count-frågor)', async () => {
    const { useResurserHubSummary } = await import('./useResurserHubSummary')
    const { result } = renderHook(() => useResurserHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fromMock).toHaveBeenCalledWith('cvs')
    expect(fromMock).toHaveBeenCalledWith('cover_letters')
    expect(fromMock).toHaveBeenCalledWith('article_reading_progress')
    expect(fromMock).toHaveBeenCalledWith('ai_team_sessions')
    expect(fromMock).toHaveBeenCalledTimes(6)
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
    // B33: 12 från count-frågan, inte 1 från den `.limit(5)`-kapade listan.
    expect(data.aiTeamSessionCount).toBe(12)
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

  // B33 (2026-08-09): räknaren kom tidigare ur den `.limit(3)`-kapade listan
  // (`articles.filter(a => a.is_completed).length`), så en användare med åtta
  // avklarade artiklar kunde aldrig se mer än 3. Fixturen ger nu 2 rader i
  // listan men count = 8: går den här assertionen tillbaka till 1 har någon
  // återinfört räkningen i listan.
  it('articleCompletedCount kommer från count-frågan, inte från den kapade listan', async () => {
    const { useResurserHubSummary } = await import('./useResurserHubSummary')
    const { result } = renderHook(() => useResurserHubSummary(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.articleCompletedCount).toBe(8)
    // Listan är fortfarande kapad — det är bara ANTALET som inte får komma därifrån.
    expect(result.current.data!.recentArticles).toHaveLength(2)
  })
})
