/**
 * Guidernas läge följer kontot (beslut 2026-10-11), med localStorage som cache.
 * Beteenden som kan falla:
 *   1. Flaggan av (före migrationen): kolumnen rörs aldrig.
 *   2. Kontots läge vinner över cachen.
 *   3. Läsfel: cachens värde står kvar — guiden döljs inte, och visas inte igen.
 *   4. Skrivning läser först; går läsningen fel skrivs INGENTING (annars skrevs de
 *      andra guidernas läge över med tomt).
 *   5. En ändrad guide lämnar de andra orörda.
 * Mutationer: ta bort `if (error) throw error` i hamtaGuider → test 4 faller (tom
 * läsning blir {} och upserten körs); låt kontots läge gälla även efter ett
 * handgrepp → test 6 faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

const stat = vi.hoisted(() => ({
  las: { data: null as unknown, error: null as unknown },
  upserts: [] as unknown[],
  fragor: 0,
  vanta: null as null | Promise<void>,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            stat.fragor += 1
            if (stat.vanta) await stat.vanta
            return stat.las
          },
        }),
      }),
      upsert: async (rad: unknown) => {
        stat.upserts.push(rad)
        return { error: null }
      },
    }),
  },
}))

import { hamtaGuider, medGuide, sparaGuideIKonto, tolkaGuider, useGuideStangd, lasGuideStangd } from './guideMinne'

beforeEach(() => {
  localStorage.clear()
  stat.las = { data: null, error: null }
  stat.upserts = []
  stat.fragor = 0
  stat.vanta = null
})

describe('guideMinne', () => {
  it('flaggan av: bara localStorage, ingen fråga mot kontot', async () => {
    const { result } = renderHook(() => useGuideStangd('g', 'u1', false))
    act(() => result.current[1](true))
    expect(result.current[0]).toBe(true)
    expect(lasGuideStangd('g', 'u1')).toBe(true)
    await new Promise((r) => setTimeout(r, 0))
    expect(stat.fragor).toBe(0)
    expect(stat.upserts).toEqual([])
  })

  it('kontots läge vinner över cachen', async () => {
    stat.las = { data: { guider: { g: { stangd: true, at: '2026-10-11T10:00:00Z' } } }, error: null }
    const { result } = renderHook(() => useGuideStangd('g', 'u1', true))
    expect(result.current[0]).toBe(false)
    await waitFor(() => expect(result.current[0]).toBe(true))
    expect(lasGuideStangd('g', 'u1')).toBe(true)
  })

  it('läsfel: cachens värde står kvar', async () => {
    localStorage.setItem('jobin-guide:g:u1', 'stangd')
    stat.las = { data: null, error: { message: 'nät' } }
    const { result } = renderHook(() => useGuideStangd('g', 'u1', true))
    await waitFor(() => expect(stat.fragor).toBe(1))
    await new Promise((r) => setTimeout(r, 0))
    expect(result.current[0]).toBe(true)
    expect(stat.upserts).toEqual([])
  })

  it('skrivning: går läsningen fel skrivs ingenting', async () => {
    stat.las = { data: null, error: { message: 'nät' } }
    await expect(sparaGuideIKonto('g', 'u1', true)).rejects.toBeTruthy()
    expect(stat.upserts).toEqual([])
  })

  it('skrivning: de andra guidernas läge följer med', async () => {
    stat.las = { data: { guider: { annan: { stangd: true, at: 'x' } } }, error: null }
    await sparaGuideIKonto('g', 'u1', true)
    const rad = stat.upserts[0] as { user_id: string; guider: Record<string, { stangd: boolean }> }
    expect(rad.user_id).toBe('u1')
    expect(rad.guider.annan.stangd).toBe(true)
    expect(rad.guider.g.stangd).toBe(true)
  })

  it('ett handgrepp före kontots svar skrivs inte över av svaret', async () => {
    let slapp: () => void = () => {}
    stat.vanta = new Promise<void>((r) => { slapp = r })
    stat.las = { data: { guider: { g: { stangd: false, at: 'x' } } }, error: null }
    const { result } = renderHook(() => useGuideStangd('g', 'u1', true))
    act(() => result.current[1](true))
    await act(async () => { slapp(); await new Promise((r) => setTimeout(r, 0)) })
    expect(result.current[0]).toBe(true)
  })

  it('stängt lokalt men inget i kontot: läget flyttas upp en gång', async () => {
    localStorage.setItem('jobin-guide:g:u1', 'stangd')
    stat.las = { data: { guider: {} }, error: null }
    renderHook(() => useGuideStangd('g', 'u1', true))
    await waitFor(() => expect(stat.upserts.length).toBe(1))
    expect((stat.upserts[0] as { guider: Record<string, { stangd: boolean }> }).guider.g.stangd).toBe(true)
  })

  it('tolkaGuider tål skräp, medGuide rör bara en nyckel', async () => {
    expect(tolkaGuider(null)).toEqual({})
    expect(tolkaGuider([1])).toEqual({})
    expect(tolkaGuider({ a: { stangd: 'ja' }, b: { stangd: false } })).toEqual({ b: { stangd: false, at: '' } })
    const ut = medGuide({ a: { stangd: true, at: 'x' } }, 'b', false, new Date('2026-10-11T00:00:00Z'))
    expect(ut).toEqual({ a: { stangd: true, at: 'x' }, b: { stangd: false, at: '2026-10-11T00:00:00.000Z' } })
    stat.las = { data: null, error: null }
    expect(await hamtaGuider('u1')).toEqual({})
  })
})
