/**
 * Dagboken svalde fel i två lager (2026-09-22): diaryApi returnerade `[]`/
 * `null` vid läsfel, och useDiary fångade dessutom en gång till. Ett
 * nätverks- eller RLS-fel såg därför ut som en tom dagbok.
 *
 * Testet kör den RIKTIGA kedjan diaryApi → useDiary mot en mockad supabase:
 * felet måste nå `isError`. Mutationer (kontrollerade): återställ
 * `if (error) { console.error…; return [] }` i diaryApi.getAll → test 1
 * faller; återställ try/catch i useDiaryEntries queryFn → test 1 faller;
 * mappa inte 42501 till 'samtycke' i diaryApi.skapa → test 3 faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

let lasSvar: { data: unknown; error: { message: string; code?: string } | null }
let skrivSvar: { data: unknown; error: { message: string; code?: string } | null }

vi.mock('@/lib/supabase', () => {
  const builder = () => {
    const b: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'order', 'range', 'limit', 'gte', 'lte', 'overlaps']) b[m] = () => b
    b.insert = () => ({ select: () => ({ single: async () => skrivSvar }) })
    b.maybeSingle = async () => lasSvar
    b.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(lasSvar).then(res, rej)
    return b
  }
  return {
    supabase: {
      auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
      from: () => builder(),
    },
  }
})

import { useDiaryEntries, useMoodLogs } from './useDiary'
import { diaryEntriesApi } from '@/services/diaryApi'

const wrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  lasSvar = { data: [], error: null }
  skrivSvar = { data: { id: 'ny' }, error: null }
})

describe('useDiary — ett läsfel är inte en tom dagbok', () => {
  it('useDiaryEntries: läsfel ger isError, inte entries = []', async () => {
    lasSvar = { data: null, error: { message: 'nätverk' } }
    const { result } = renderHook(() => useDiaryEntries(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('useMoodLogs: läsfel på dagens humör ger isError — inte todayMood = null', async () => {
    lasSvar = { data: null, error: { message: 'nätverk' } }
    const { result } = renderHook(() => useMoodLogs(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('tom dagbok är fortfarande tom — inte ett fel', async () => {
    const { result } = renderHook(() => useDiaryEntries(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isError).toBe(false)
    expect(result.current.entries).toEqual([])
  })
})

describe('diaryEntriesApi.skapa — säger varför', () => {
  const inlagg = {
    title: 't', content: 'text', mood: null, energy_level: null, tags: [],
    word_count: 1, entry_date: '2026-09-22', entry_type: 'diary' as const, is_favorite: false,
  }

  it('42501 (RLS: inget hälsosamtycke) → orsak samtycke', async () => {
    skrivSvar = { data: null, error: { message: 'new row violates row-level security policy', code: '42501' } }
    await expect(diaryEntriesApi.skapa(inlagg)).resolves.toEqual({ ok: false, orsak: 'samtycke' })
  })

  it('annat fel → orsak fel; create() ger fortfarande null (fokuslägets kontrakt)', async () => {
    skrivSvar = { data: null, error: { message: 'boom', code: 'XX000' } }
    await expect(diaryEntriesApi.skapa(inlagg)).resolves.toEqual({ ok: false, orsak: 'fel' })
    await expect(diaryEntriesApi.create(inlagg)).resolves.toBeNull()
  })

  it('ett fel i skrivsviten gör inte ett sparat inlägg till misslyckat', async () => {
    // Sparningen lyckas; skrivsvitens läsning (maybeSingle) faller.
    lasSvar = { data: null, error: { message: 'streak nere' } }
    await expect(diaryEntriesApi.skapa(inlagg)).resolves.toMatchObject({ ok: true })
  })
})
