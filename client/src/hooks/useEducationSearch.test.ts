/**
 * Tester för useEducationSearch.
 *
 * Två av dem vaktar buggar som var i drift till 2026-08-22:
 *
 *  1. **"Ladda fler" hämtade sida två och kastade bort den.** `offset` låg i
 *     state och stod i `performSearch`-callbackens beroendelista, medan
 *     `performSearch` stod i auto-sökeffektens. Varje avslutad sökning gav ny
 *     callbackidentitet → effekten kördes om → `setOffset(0)` + ny sökning.
 *     Uppmätt: 40 träffar syntes i ~300 ms, sedan stod listan på 20 igen. Med
 *     211 träffar gick det inte att nå träff 21.
 *  2. **Ett nätverksfel såg ut som "inga utbildningar".** `educationApi.search`
 *     kastar inte — den fångar och returnerar `source: 'error'`. Hookens
 *     `catch` nåddes därför aldrig, `error` förblev `null`, och sidan ritade
 *     tomtillståndet "Inga utbildningar hittades — prova att ändra dina
 *     sökfilter". Med en knapp som RADERADE det användaren skrivit.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useEducationSearch } from './useEducationSearch'
import { educationApi, type Education, type SearchResult } from '@/services/educationApi'

vi.mock('@/services/educationApi', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/educationApi')>('@/services/educationApi')
  return { ...faktisk, educationApi: { ...faktisk.educationApi, search: vi.fn() } }
})

const sok = educationApi.search as unknown as ReturnType<typeof vi.fn>

function traffar(fran: number, antal: number): Education[] {
  return Array.from({ length: antal }, (_, i) => ({
    id: `edu-${fran + i}`,
    title: `Utbildning ${fran + i}`,
    provider: 'Anordnaren',
    type: 'yrkeshogskola',
    typeLabel: 'Yrkeshögskola',
  }))
}

function svar(offset: number, total = 60): SearchResult {
  return {
    educations: traffar(offset, 20),
    total,
    hasMore: offset + 20 < total,
    source: 'jobed-connect',
  }
}

beforeEach(() => {
  sok.mockReset()
  sok.mockImplementation(async (p: { offset?: number }) => svar(p.offset ?? 0))
})

afterEach(() => vi.useRealTimers())

describe('useEducationSearch', () => {
  it('behåller sida två efter "Ladda fler" — även efter debouncefönstret', async () => {
    const { result } = renderHook(() => useEducationSearch({ debounceDelay: 50 }))

    act(() => result.current.setQuery('vård'))
    await waitFor(() => expect(result.current.results).toHaveLength(20))

    await act(async () => { await result.current.loadMore() })
    expect(result.current.results).toHaveLength(40)

    // Det var HÄR listan hoppade tillbaka till 20. Vänta ut hela debouncen
    // med marginal och kontrollera att sida två står kvar.
    await new Promise((r) => setTimeout(r, 300))
    expect(result.current.results).toHaveLength(40)
    expect(result.current.results.at(-1)?.id).toBe('edu-39')
  })

  it('frågar efter rätt offset och kör inte sökningen dubbelt', async () => {
    const { result } = renderHook(() => useEducationSearch({ debounceDelay: 50 }))

    act(() => result.current.setQuery('vård'))
    await waitFor(() => expect(result.current.results).toHaveLength(20))
    await act(async () => { await result.current.loadMore() })
    await new Promise((r) => setTimeout(r, 300))

    const offsets = sok.mock.calls.map((c) => c[0].offset)
    expect(offsets).toEqual([0, 20])
  })

  it('lägger inte till samma utbildning två gånger vid "Ladda fler"', async () => {
    sok.mockImplementation(async () => svar(0)) // samma sida igen
    const { result } = renderHook(() => useEducationSearch({ debounceDelay: 50 }))

    act(() => result.current.setQuery('vård'))
    await waitFor(() => expect(result.current.results).toHaveLength(20))
    await act(async () => { await result.current.loadMore() })

    expect(result.current.results).toHaveLength(20)
  })

  it("skiljer ett avbrott ('error') från ett tomt utbud", async () => {
    sok.mockResolvedValue({ educations: [], total: 0, hasMore: false, source: 'error' })
    const { result } = renderHook(() => useEducationSearch({ debounceDelay: 50 }))

    act(() => result.current.setQuery('vård'))
    await waitFor(() => expect(result.current.hasSearched).toBe(true))

    expect(result.current.error).toBeTruthy()
    expect(result.current.source).toBe('error')
    expect(result.current.results).toEqual([])
  })

  it('ett tomt svar UTAN fel är inget fel', async () => {
    sok.mockResolvedValue({ educations: [], total: 0, hasMore: false, source: 'jobed-connect' })
    const { result } = renderHook(() => useEducationSearch({ debounceDelay: 50 }))

    act(() => result.current.setQuery('qwertyxyz'))
    await waitFor(() => expect(result.current.hasSearched).toBe(true))

    expect(result.current.error).toBeNull()
    expect(result.current.results).toEqual([])
  })

  it('låter inte ett långsamt äldre svar skriva över ett nyare', async () => {
    sok.mockImplementation(async (p: { query?: string }) => {
      if (p.query === 'a') {
        await new Promise((r) => setTimeout(r, 250))
        return { educations: traffar(900, 1), total: 1, hasMore: false, source: 'jobed-connect' }
      }
      return { educations: traffar(0, 1), total: 1, hasMore: false, source: 'jobed-connect' }
    })

    const { result } = renderHook(() => useEducationSearch({ debounceDelay: 20 }))
    act(() => result.current.setQuery('a'))
    await new Promise((r) => setTimeout(r, 60))
    act(() => result.current.setQuery('ab'))

    await waitFor(() => expect(result.current.results).toHaveLength(1))
    await new Promise((r) => setTimeout(r, 350))

    expect(result.current.results[0].id).toBe('edu-0')
  })

  it('söker inte alls när inget filter är satt', async () => {
    renderHook(() => useEducationSearch({ debounceDelay: 20 }))
    await new Promise((r) => setTimeout(r, 120))
    expect(sok).not.toHaveBeenCalled()
  })
})
