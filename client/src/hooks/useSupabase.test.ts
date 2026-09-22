/**
 * Regression (2026-09-22): `useCV`s första hämtning använde `.single()`,
 * som kräver EXAKT en rad. En deltagare som inte skapat ett CV än (ingen
 * rad i `cvs`) fick PostgREST att svara 406 PGRST116 — hooken fångade felet
 * i try/catch och satte `error`, men gjorde ett onödigt misslyckat anrop
 * varje gång. `useCV` nås i drift via `useAITeamContext`, så det slog
 * igenom varje gång AI-teamet byggde kontext för någon utan CV.
 *
 * `.maybeSingle()` (0 eller 1 rad, inget fel vid tom träff) är rätt verktyg
 * eftersom frågan redan filtrerar på `user_id`.
 */
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

type TableResponse = { data: unknown; error: unknown }

function makeBuilder(response: TableResponse) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(response)),
    single: vi.fn(() => Promise.resolve(response)),
  }
  return builder
}

let tableResponse: TableResponse

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => makeBuilder(tableResponse)),
    channel: vi.fn(() => {
      const chan: Record<string, unknown> = {
        on: vi.fn(() => chan),
        subscribe: vi.fn(() => ({ unsubscribe: vi.fn(() => Promise.resolve('ok')) })),
      }
      return chan
    }),
  },
  getCurrentUser: vi.fn(),
  getProfile: vi.fn(),
}))

import { useCV } from './useSupabase'

describe('useCV', () => {
  it('en deltagare utan CV får cv: null och inget fel — ingen 406-krasch', async () => {
    // maybeSingle() på en tom träff: data null, error null (det .single()
    // INTE ger — där hade PostgREST svarat 406 PGRST116 i stället).
    tableResponse = { data: null, error: null }

    const { result } = renderHook(() => useCV('user-utan-cv'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.cv).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('läser cvs-tabellen via maybeSingle(), inte single()', async () => {
    tableResponse = { data: { id: 'cv-1', user_id: 'u1' }, error: null }
    let calledSingle = false
    let calledMaybeSingle = false

    const { supabase } = await import('../lib/supabase')
    ;(supabase.from as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      const builder: Record<string, unknown> = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        single: vi.fn(() => { calledSingle = true; return Promise.resolve(tableResponse) }),
        maybeSingle: vi.fn(() => { calledMaybeSingle = true; return Promise.resolve(tableResponse) }),
      }
      return builder
    })

    const { result } = renderHook(() => useCV('user-med-cv'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(calledMaybeSingle).toBe(true)
    expect(calledSingle).toBe(false)
  })
})
