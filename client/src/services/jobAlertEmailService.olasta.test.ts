/**
 * getUnreadCount — brickan "N nya" på bevakningsfliken.
 *
 * 2026-09-22: ett läsfel blev `0`, alltså samma besked som "inga nya jobb".
 * Nu kastar funktionen; anroparen visar då ingen bricka i stället för en
 * påhittad nolla. Mutation: återställ `return 0` i felgrenen → test 2 faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

let svar: { count: number | null; error: { message: string } | null }

vi.mock('@/lib/supabase', () => {
  const builder: Record<string, unknown> = {}
  builder.select = () => builder
  builder.eq = () => builder
  builder.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(svar).then(res, rej)
  return {
    supabase: {
      auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
      from: () => builder,
    },
  }
})

import { getUnreadCount } from './jobAlertEmailService'

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('getUnreadCount', () => {
  it('returnerar antalet olästa', async () => {
    svar = { count: 4, error: null }
    await expect(getUnreadCount()).resolves.toBe(4)
  })

  it('kastar vid läsfel — ett fel är inte "inga nya jobb"', async () => {
    svar = { count: null, error: { message: 'boom' } }
    await expect(getUnreadCount()).rejects.toThrow()
  })
})
