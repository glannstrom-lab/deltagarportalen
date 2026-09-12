/**
 * konsulentKopplingApi — samtycket och uppsägningen av kopplingen deltagare ↔ konsulent.
 * Utbrutet ur staApi.test.ts 2026-09-12 (STA-ARK); testerna för getActive är
 * desamma, revokeConsultantLink är nytt vaktat (hade inget test i staApi.test.ts).
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- supabase-builder-mock kräver any-typad chainable */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { consultantConsentsApi, konsulentKopplingApi } from './konsulentKopplingApi'

const mockGetUser = vi.fn()
const mockRpc = vi.fn()
const mockFrom = vi.fn()
const mockFromBuilder: any = {}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: (...args: unknown[]) => {
      mockFrom(...args)
      return mockFromBuilder
    },
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}))

beforeEach(() => {
  mockGetUser.mockReset()
  mockRpc.mockReset()
  mockFrom.mockReset()
  for (const m of ['select', 'eq', 'is', 'order', 'limit']) mockFromBuilder[m] = vi.fn(() => mockFromBuilder)
  mockFromBuilder.maybeSingle = vi.fn()
})

describe('consultantConsentsApi.getActive', () => {
  it('returnerar null utan att kasta när ingen session finns', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await consultantConsentsApi.getActive('kons-1')
    expect(result).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('filtrerar på deltagare, konsulent och ej återkallat samtycke', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: { id: 'consent-1' }, error: null })
    const result = await consultantConsentsApi.getActive('kons-1')
    expect(mockFrom).toHaveBeenCalledWith('consultant_consents')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('participant_id', 'user-1')
    expect(mockFromBuilder.eq).toHaveBeenCalledWith('consultant_id', 'kons-1')
    expect(mockFromBuilder.is).toHaveBeenCalledWith('revoked_at', null)
    expect(result).toMatchObject({ id: 'consent-1' })
  })

  it('kastar vidare andra fel än "ingen rad" (PGRST116)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFromBuilder.maybeSingle.mockResolvedValue({ data: null, error: { message: 'RLS denied', code: '42501' } })
    await expect(consultantConsentsApi.getActive('kons-1')).rejects.toThrow('RLS denied')
  })
})

describe('konsulentKopplingApi.revokeConsultantLink', () => {
  it('anropar RPC:n revoke_consultant_link med konsulent-id och skäl', async () => {
    const svar = { success: true, cancelled_enrollments: 0, drafts_deleted: 0, consents_revoked: 1 }
    mockRpc.mockResolvedValue({ data: svar, error: null })
    const result = await konsulentKopplingApi.revokeConsultantLink('kons-1', 'flyttar')
    expect(mockRpc).toHaveBeenCalledWith('revoke_consultant_link', { p_consultant_id: 'kons-1', p_reason: 'flyttar' })
    expect(result).toEqual(svar)
  })

  it('skickar p_reason = null när inget skäl anges, och kastar vid RPC-fel', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'permission denied', code: '42501' } })
    await expect(konsulentKopplingApi.revokeConsultantLink('kons-1')).rejects.toThrow('permission denied')
    expect(mockRpc).toHaveBeenCalledWith('revoke_consultant_link', { p_consultant_id: 'kons-1', p_reason: null })
  })
})
