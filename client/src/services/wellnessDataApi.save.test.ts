/**
 * wellnessDataApi.save skrev till localStorage vid skrivfel och återvände som
 * om allt gått bra. Nu kastas felet så anroparen kan visa det.
 * Mutation: återinför `localStorage.setItem` i stället för kastaLagringsFel
 * (maende.ts) -> första testet faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const upsert = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
    from: () => ({ upsert: (...a: unknown[]) => upsert(...a) }),
  },
}))
vi.mock('@/lib/logger', () => ({
  storageLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { wellnessDataApi, LagringsFel } from './cloudStorage'

beforeEach(() => {
  upsert.mockReset()
  vi.mocked(window.localStorage.setItem).mockClear()
})

describe('wellnessDataApi.save', () => {
  it('kastar vid skrivfel i stället för att låtsas att det sparats', async () => {
    upsert.mockResolvedValue({ error: { code: 'XX000', message: 'boom' } })
    await expect(wellnessDataApi.save({ reflections: ['hej'] })).rejects.toBeInstanceOf(LagringsFel)
    expect(window.localStorage.setItem).not.toHaveBeenCalled()
  })

  it('kastar även vid RLS-nekande (42501)', async () => {
    upsert.mockResolvedValue({ error: { code: '42501', message: 'rls' } })
    await expect(wellnessDataApi.save({ reflections: ['hej'] })).rejects.toThrow()
  })

  it('lyckas tyst när skrivningen går igenom', async () => {
    upsert.mockResolvedValue({ error: null })
    await expect(wellnessDataApi.save({ reflections: ['hej'] })).resolves.toBeUndefined()
  })
})
