/**
 * integrationChecklistApi.getProgress — ett läsfel är inte "inget kryssat".
 *
 * Före 2026-09-24 gav ett databasfel `null` (eller webbläsarens gamla cache),
 * och IntegrationTab skrev vid nästa bock hela mängden över molnets rad.
 * Mutation: återställ `return null` i felgrenen → test 2 faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

let svar: { data: unknown; error: { code?: string; message: string } | null }
let anvandare: { id: string } | null

vi.mock('@/lib/supabase', () => {
  const builder: Record<string, unknown> = {}
  builder.select = () => builder
  builder.eq = () => builder
  builder.maybeSingle = () => Promise.resolve(svar)
  return {
    supabase: {
      auth: { getUser: async () => ({ data: { user: anvandare } }) },
      from: () => builder,
    },
  }
})
vi.mock('@/lib/logger', () => ({
  storageLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { integrationChecklistApi } from './integration'

beforeEach(() => {
  anvandare = { id: 'u1' }
  localStorage.clear()
})

describe('integrationChecklistApi.getProgress', () => {
  it('returnerar den sparade raden i prod-formen', async () => {
    const rad = {
      items: { folkbokforing: { id: 'folkbokforing', completed: true, completedAt: '2026-09-01T10:00:00.000Z' } },
      lastUpdated: '2026-09-01T10:00:00.000Z',
    }
    svar = { data: { integration_checklist: rad }, error: null }
    await expect(integrationChecklistApi.getProgress()).resolves.toEqual(rad)
  })

  it('kastar vid läsfel — också när det finns en gammal cache', async () => {
    localStorage.setItem('integration-checklist', JSON.stringify({ gammal: { id: 'gammal', completed: true } }))
    svar = { data: null, error: { code: 'XX000', message: 'boom' } }
    await expect(integrationChecklistApi.getProgress()).rejects.toThrow()
  })

  it('ingen rad än är inget fel — det är null', async () => {
    svar = { data: null, error: null }
    await expect(integrationChecklistApi.getProgress()).resolves.toBeNull()
  })
})
