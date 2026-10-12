/**
 * diary_streaks hade en skrivare (diaryStreaksApi.updateAfterEntry) men noll läsare.
 * Att spara ett inlägg ska inte längre röra tabellen.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const tabeller: string[] = []

function builder(table: string): Record<string, unknown> {
  tabeller.push(table)
  const b: Record<string, unknown> = {
    insert: () => b,
    select: () => b,
    update: () => b,
    eq: () => b,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: { id: 'e1', content: 'hej' }, error: null }),
  }
  return b
}

vi.mock('@/lib/supabase', () => ({ supabase: { from: (t: string) => builder(t) } }))
vi.mock('@/lib/anvandareFranSession', () => ({
  anvandareFranSession: async () => ({ data: { user: { id: 'u1' } } }),
}))

import * as diaryApiModul from './diaryApi'
import { diaryEntriesApi } from './diaryApi'

describe('diaryApi: skrivsviten', () => {
  beforeEach(() => { tabeller.length = 0 })

  it('att spara ett inlägg skriver till diary_entries men inte diary_streaks', async () => {
    const utfall = await diaryEntriesApi.skapa({ content: 'ett två tre' } as unknown as Parameters<typeof diaryEntriesApi.skapa>[0])
    expect(utfall.ok).toBe(true)
    expect(tabeller).toContain('diary_entries')
    expect(tabeller).not.toContain('diary_streaks')
  })

  it('diaryStreaksApi finns inte längre', () => {
    expect((diaryApiModul as Record<string, unknown>).diaryStreaksApi).toBeUndefined()
  })
})
