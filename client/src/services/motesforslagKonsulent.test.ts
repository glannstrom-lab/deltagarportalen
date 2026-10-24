import { describe, it, expect, vi, beforeEach } from 'vitest'

let svar: { data: unknown; error: unknown }
const eq = vi.fn()
const gte = vi.fn()
vi.mock('@/lib/supabase', () => {
  const b: Record<string, unknown> = {
    select: vi.fn(() => b),
    eq: (...a: unknown[]) => { eq(...a); return b },
    gte: (...a: unknown[]) => { gte(...a); return b },
    order: vi.fn(() => b),
    then: (f: (v: unknown) => unknown, r?: (e: unknown) => unknown) => Promise.resolve(svar).then(f, r),
  }
  return { supabase: { from: vi.fn(() => b) } }
})
vi.mock('@/lib/anvandareFranSession', () => ({
  anvandareFranSession: vi.fn(() => Promise.resolve({ data: { user: { id: 'k1' } }, error: null })),
}))

import { hamtaForslagForKonsulent } from './motesforslagKonsulent'

const NU = new Date(2026, 9, 24, 9, 0)
const rad = (o: Record<string, unknown>) => ({ id: 'a', participant_id: 'p', scheduled_at: new Date(2026, 9, 27, 14).toISOString(), meeting_type: 'video', status: 'proposed', proposed_note: null, ...o })

beforeEach(() => { eq.mockClear(); gte.mockClear() })

describe('hamtaForslagForKonsulent', () => {
  it('frågar bara konsulentens egna förslag, framåt i tiden', async () => {
    svar = { data: [rad({})], error: null }
    const r = await hamtaForslagForKonsulent(NU)
    expect(eq).toHaveBeenCalledWith('consultant_id', 'k1')
    expect(eq).toHaveBeenCalledWith('status', 'proposed')
    expect(gte).toHaveBeenCalledWith('scheduled_at', NU.toISOString())
    expect(r).toHaveLength(1)
    expect(r[0]).not.toHaveProperty('status')
  })

  it('släpper inte igenom bokade möten eller förslag vars tid passerat', async () => {
    svar = { data: [rad({ id: 'b', status: 'scheduled' }), rad({ id: 'c', scheduled_at: new Date(2026, 9, 24, 8).toISOString() }), rad({ id: 'd' })], error: null }
    const r = await hamtaForslagForKonsulent(NU)
    expect(r.map((x) => x.id)).toEqual(['d'])
  })

  it('ett läsfel kastas — det blir aldrig en tom lista', async () => {
    svar = { data: null, error: { message: 'timeout' } }
    await expect(hamtaForslagForKonsulent(NU)).rejects.toEqual({ message: 'timeout' })
  })
})
