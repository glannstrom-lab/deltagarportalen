/**
 * useAktivitetsplan — planen hämtas en gång och delas av huvudet och fliken.
 * KM5 flyttad hit: "Plan som PDF" laddar ner planen med deltagarens namn.
 * KV1: byts deltagaren står inte förra deltagarens plan kvar.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAktivitetsplan } from './useAktivitetsplan'

const plan = { id: 'plan1', participant_id: 'p1', org_id: null, status: 'active', start_date: '2026-10-05', weekly_hours_target: 10, jobsearch_hours_per_week: 2 }

vi.mock('@/services/aktivitetApi', () => ({
  aktivitetsplanApi: { getForParticipant: vi.fn(), listAllSessions: vi.fn(async () => []), end: vi.fn() },
  underlagApi: { list: vi.fn(async () => []) },
}))
vi.mock('@/services/aktivitetsplanPdf', () => ({ downloadAktivitetsplanPDF: vi.fn(async () => undefined) }))
vi.mock('@/services/orgApi', () => ({ orgApi: { myMemberships: vi.fn(async () => []) } }))
vi.mock('@/components/ui/ConfirmDialog', () => ({ useConfirmDialog: () => ({ confirm: vi.fn(async () => true) }) }))
vi.mock('@/lib/toast', () => ({ notifications: { success: vi.fn(), error: vi.fn() } }))

function omslag({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
}

afterEach(() => vi.clearAllMocks())

describe('useAktivitetsplan', () => {
  it('laddar ner plan-PDF:en med planen och deltagarens namn (KM5)', async () => {
    const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
    const { downloadAktivitetsplanPDF } = await import('@/services/aktivitetsplanPdf')
    vi.mocked(aktivitetsplanApi.getForParticipant).mockResolvedValue(plan as never)
    const { result } = renderHook(() => useAktivitetsplan('p1', 'Anna Andersson'), { wrapper: omslag })
    await waitFor(() => expect(result.current.lage.status).toBe('klart'))
    await act(() => result.current.laddaNerPdf())
    expect(downloadAktivitetsplanPDF).toHaveBeenCalledWith(expect.objectContaining({ participantName: 'Anna Andersson', plan: expect.objectContaining({ id: 'plan1' }) }))
  })

  it('avslutar planen efter bekräftelse och hämtar om', async () => {
    const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
    vi.mocked(aktivitetsplanApi.getForParticipant).mockResolvedValue(plan as never)
    const { result } = renderHook(() => useAktivitetsplan('p1', 'Anna'), { wrapper: omslag })
    await waitFor(() => expect(result.current.lage.status).toBe('klart'))
    await act(() => result.current.avslutaPlan())
    expect(aktivitetsplanApi.end).toHaveBeenCalledWith('plan1')
  })

  it('hämtar inte alls när den inte är aktiv (sidan äger hämtningen)', async () => {
    const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
    renderHook(() => useAktivitetsplan('p1', 'Anna', false), { wrapper: omslag })
    await new Promise((r) => setTimeout(r, 20))
    expect(aktivitetsplanApi.getForParticipant).not.toHaveBeenCalled()
  })

  it('byts deltagaren går läget tillbaka till laddar — förra deltagarens plan står inte kvar (KV1)', async () => {
    const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
    vi.mocked(aktivitetsplanApi.getForParticipant).mockResolvedValueOnce(plan as never).mockReturnValueOnce(new Promise(() => {}))
    const { result, rerender } = renderHook(({ id }) => useAktivitetsplan(id, 'X'), { wrapper: omslag, initialProps: { id: 'p1' } })
    await waitFor(() => expect(result.current.lage.status).toBe('klart'))
    rerender({ id: 'p2' })
    expect(result.current.lage.status).toBe('laddar')
  })
})
