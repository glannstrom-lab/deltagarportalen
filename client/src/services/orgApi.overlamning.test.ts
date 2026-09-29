/**
 * CH6/CH13: överlämning av en deltagare går via RPC:erna i PENDING-migrationen.
 * Saknas de ska felet vara ärligt, inte "PGRST202".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const rpc = vi.fn()
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }))
vi.mock('@/lib/anvandareFranSession', () => ({
  anvandareFranSession: async () => ({ data: { user: { id: 'u1' } }, error: null }),
}))

import { orgApi, rpcFelText } from './orgApi'

describe('orgApi.handoverParticipant', () => {
  beforeEach(() => rpc.mockReset())

  it('anropar overlamna_deltagare med org, deltagare, från och till', async () => {
    rpc.mockResolvedValue({ data: 1, error: null })
    await orgApi.handoverParticipant('o1', 'p1', 'u2', 'u3')
    expect(rpc).toHaveBeenCalledWith('overlamna_deltagare', {
      p_org_id: 'o1',
      p_participant_id: 'p1',
      p_from_consultant_id: 'u2',
      p_to_consultant_id: 'u3',
    })
  })

  it('saknad RPC ger ett ärligt svenskt fel', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'Could not find the function' } })
    await expect(orgApi.handoverParticipant('o1', 'p1', 'u2', 'u3')).rejects.toThrow(/inte påslaget än/)
    expect(rpcFelText({ code: '42501', message: 'Bara chef eller administratör' })).toBe('Bara chef eller administratör')
  })

  it('overlamningsdeltagare returnerar id och namn', async () => {
    rpc.mockResolvedValue({ data: [{ participant_id: 'p1', namn: 'Amina A' }], error: null })
    expect(await orgApi.overlamningsdeltagare('o1', 'u2')).toEqual([{ participant_id: 'p1', namn: 'Amina A' }])
  })
})
