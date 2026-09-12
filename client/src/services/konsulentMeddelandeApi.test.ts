import { describe, it, expect, vi, beforeEach } from 'vitest'

const rpc = vi.fn()
const insert = vi.fn()
const select = vi.fn()
const single = vi.fn()
const getUser = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: (...a: unknown[]) => getUser(...a) },
    rpc: (...a: unknown[]) => rpc(...a),
    from: () => ({ insert: (...a: unknown[]) => { insert(...a); return { select: (...b: unknown[]) => { select(...b); return { single: () => single() } } } } }),
  },
}))

import { konsulentMeddelandeApi } from './konsulentMeddelandeApi'

describe('konsulentMeddelandeApi (F8)', () => {
  beforeEach(() => {
    rpc.mockReset(); insert.mockReset(); select.mockReset(); single.mockReset(); getUser.mockReset()
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  })

  it('läser konsulenten ur get_my_consultant och sätter ihop namnet', async () => {
    rpc.mockResolvedValue({ data: { id: 'k1', first_name: 'Kim', last_name: 'Konsulent' }, error: null })
    expect(await konsulentMeddelandeApi.minKonsulent()).toEqual({ id: 'k1', namn: 'Kim Konsulent' })
    expect(rpc).toHaveBeenCalledWith('get_my_consultant')
  })

  it('returnerar null utan koppling och kastar vid sändning', async () => {
    rpc.mockResolvedValue({ data: null, error: null })
    expect(await konsulentMeddelandeApi.minKonsulent()).toBeNull()
    await expect(konsulentMeddelandeApi.skickaTillMinKonsulent('hej')).rejects.toThrow(/ingen konsulent/i)
    expect(insert).not.toHaveBeenCalled()
  })

  it('skickar med sender = jag, receiver = konsulenten, is_read false, trimmad text', async () => {
    rpc.mockResolvedValue({ data: { id: 'k1', first_name: 'Kim', last_name: null }, error: null })
    single.mockResolvedValue({ data: { id: 'm1', content: 'hej', created_at: '', receiver_id: 'k1' }, error: null })
    const r = await konsulentMeddelandeApi.skickaTillMinKonsulent('  hej  ')
    expect(insert).toHaveBeenCalledWith({ sender_id: 'u1', receiver_id: 'k1', content: 'hej', is_read: false })
    expect(r.id).toBe('m1')
  })

  it('kastar vid tomt meddelande och vid RLS-fel — sväljer inget', async () => {
    await expect(konsulentMeddelandeApi.skickaTillMinKonsulent('   ')).rejects.toThrow(/tomt/i)
    rpc.mockResolvedValue({ data: { id: 'k1', first_name: 'Kim' }, error: null })
    single.mockResolvedValue({ data: null, error: { code: '42501', message: 'nekad' } })
    await expect(konsulentMeddelandeApi.skickaTillMinKonsulent('hej')).rejects.toMatchObject({ code: '42501' })
  })
})
