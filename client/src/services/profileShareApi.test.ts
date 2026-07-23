/**
 * Tester för profileShareApi.getSharedProfile (A7, 2026-07-23) —
 * verifierar att uppslaget går via SECURITY DEFINER-RPC:n
 * get_shared_profile (inte direktläsning av profile_shares, vars öppna
 * SELECT-policy är borttagen) och att fel/ogiltiga svar blir null,
 * aldrig ett halvt resultat.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { profileShareApi } from './profileEnhancementsApi'

const mockRpc = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}))

beforeEach(() => {
  mockRpc.mockReset()
})

describe('profileShareApi.getSharedProfile', () => {
  it('anropar get_shared_profile-RPC:n med delningskoden', async () => {
    mockRpc.mockResolvedValue({
      data: {
        profile: { first_name: 'Anna' },
        share: { id: 's1', show_contact: true, view_count: 3 },
      },
      error: null,
    })

    const result = await profileShareApi.getSharedProfile('abc123')

    expect(mockRpc).toHaveBeenCalledWith('get_shared_profile', { p_share_code: 'abc123' })
    expect(result?.profile.first_name).toBe('Anna')
    expect(result?.share.view_count).toBe(3)
  })

  it('returnerar null vid RPC-fel', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    expect(await profileShareApi.getSharedProfile('abc123')).toBeNull()
  })

  it('returnerar null när delningen är ogiltig/utgången (RPC ger null)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })
    expect(await profileShareApi.getSharedProfile('finns-inte')).toBeNull()
  })

  it('returnerar null vid ofullständigt svar (saknad profile eller share)', async () => {
    mockRpc.mockResolvedValue({ data: { profile: null, share: null }, error: null })
    expect(await profileShareApi.getSharedProfile('abc123')).toBeNull()
  })
})
