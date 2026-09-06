/**
 * Tester för den delade react-query-hooken bakom KK4.
 *
 * Kärnpåståendet att testa: flera konsumenter av samma nyckel delar EN
 * hämtning, och en invalidering gör att alla konsumenter ser den nya datan
 * — inte bara den som utlöste den. Ett test som bara anropar hooken en
 * gång bevisar inget om delningen, så det första testet monterar hooken
 * TVÅ gånger på samma QueryClient och räknar nätverksanrop.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  useConsultantParticipants,
  useInvalidateConsultantParticipants,
  fetchCachedConsultantParticipants,
  CONSULTANT_PARTICIPANTS_QUERY_KEY,
} from './consultantParticipantsQuery'

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockEq = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  return { queryClient, Wrapper }
}

beforeEach(() => {
  mockGetUser.mockReset()
  mockFrom.mockReset()
  mockEq.mockReset()
  mockGetUser.mockResolvedValue({ data: { user: { id: 'consultant-1' } } })
  mockFrom.mockImplementation(() => ({
    select: vi.fn(() => ({ eq: mockEq })),
  }))
})

describe('useConsultantParticipants — KK4: delad cache', () => {
  it('två samtidiga konsumenter av samma nyckel gör bara EN nätverkshämtning', async () => {
    mockEq.mockResolvedValue({ data: [{ participant_id: 'p1' }], error: null })
    const { queryClient, Wrapper } = makeWrapper()

    const first = renderHook(() => useConsultantParticipants(), { wrapper: Wrapper })
    const second = renderHook(() => useConsultantParticipants(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    await waitFor(() => expect(first.result.current.data).toEqual([{ participant_id: 'p1' }]))
    await waitFor(() => expect(second.result.current.data).toEqual([{ participant_id: 'p1' }]))

    // Kärnan i KK4: EN rad i mockEq, inte två — trots två konsumenter.
    expect(mockFrom).toHaveBeenCalledTimes(1)
    expect(mockFrom).toHaveBeenCalledWith('consultant_dashboard_participants')
  })

  it('kastar om ingen user är inloggad, i stället för att ge en tyst tom lista', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { Wrapper } = makeWrapper()

    const { result } = renderHook(() => useConsultantParticipants(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toEqual(new Error('Not authenticated'))
  })

  it('kastar vidare ett supabase-fel i stället för att sätta data till en tom lista', async () => {
    mockEq.mockResolvedValue({ data: null, error: new Error('db-fel') })
    const { Wrapper } = makeWrapper()

    const { result } = renderHook(() => useConsultantParticipants(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })

  it('useInvalidateConsultantParticipants() gör att en redan monterad konsument hämtar om', async () => {
    mockEq.mockResolvedValue({ data: [{ participant_id: 'p1' }], error: null })
    const { queryClient, Wrapper } = makeWrapper()

    const { result } = renderHook(
      () => ({
        query: useConsultantParticipants(),
        invalidate: useInvalidateConsultantParticipants(),
      }),
      { wrapper: Wrapper }
    )

    await waitFor(() => expect(result.current.query.data).toEqual([{ participant_id: 'p1' }]))
    expect(mockFrom).toHaveBeenCalledTimes(1)

    mockEq.mockResolvedValue({ data: [{ participant_id: 'p1' }, { participant_id: 'p2' }], error: null })
    await result.current.invalidate()

    await waitFor(() =>
      expect(result.current.query.data).toEqual([{ participant_id: 'p1' }, { participant_id: 'p2' }])
    )
    expect(mockFrom).toHaveBeenCalledTimes(2)

    // Samma nyckel som resten av modulen förutsätter — en glidning här (t.ex.
    // en konsument som stavar om nyckeln) bryter delningen tyst.
    expect(CONSULTANT_PARTICIPANTS_QUERY_KEY).toEqual(['consultant-dashboard-participants'])
    expect(queryClient.getQueryData(CONSULTANT_PARTICIPANTS_QUERY_KEY)).toEqual([
      { participant_id: 'p1' },
      { participant_id: 'p2' },
    ])
  })
})

describe('fetchCachedConsultantParticipants — imperativa flikar (Overview/Analytics/Communication/ParticipantDetail)', () => {
  it('delar cachen med useConsultantParticipants: en redan färsk hämtning ger ingen ny nätverksrunda', async () => {
    mockEq.mockResolvedValue({ data: [{ participant_id: 'p1' }], error: null })
    const { queryClient, Wrapper } = makeWrapper()

    const { result } = renderHook(() => useConsultantParticipants(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.data).toEqual([{ participant_id: 'p1' }]))
    expect(mockFrom).toHaveBeenCalledTimes(1)

    // En imperativ flik som frågar EFTER att den reaktiva redan hämtat ska
    // få samma data ur cachen — inte ett nytt anrop.
    const cached = await fetchCachedConsultantParticipants(queryClient)
    expect(cached).toEqual([{ participant_id: 'p1' }])
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })
})
