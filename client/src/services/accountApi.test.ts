/**
 * Tester för accountApi — GDPR-radering (Art. 17).
 * Verifierar grace-period-flödet, omedelbar radering, och att auth-cleanup
 * är icke-fatalt om edge function failar (profile-data har redan gått).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  requestDeletion,
  cancelDeletion,
  executeImmediateDeletion,
} from './accountApi'

const mockRpc = vi.fn()
const mockGetSession = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}))

const mockFetch = vi.fn()

beforeEach(() => {
  mockRpc.mockReset()
  mockGetSession.mockReset()
  mockFetch.mockReset()
  global.fetch = mockFetch
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
})

describe('requestDeletion', () => {
  it('returnerar scheduled_at och grace_period_days vid framgång', async () => {
    mockRpc.mockResolvedValue({
      data: { success: true, scheduled_at: '2026-05-12', grace_period_days: 14 },
      error: null,
    })

    const result = await requestDeletion('Inte längre arbetslös')

    expect(mockRpc).toHaveBeenCalledWith('request_account_deletion', {
      p_reason: 'Inte längre arbetslös',
      p_grace_period_days: 14,
    })
    expect(result).toEqual({
      success: true,
      scheduled_at: '2026-05-12',
      grace_period_days: 14,
    })
  })

  it('skickar null som reason om ingen anges', async () => {
    mockRpc.mockResolvedValue({ data: { success: true }, error: null })
    await requestDeletion()
    expect(mockRpc).toHaveBeenCalledWith('request_account_deletion', {
      p_reason: null,
      p_grace_period_days: 14,
    })
  })

  it('kastar fel vid Supabase-error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'rpc failed' } })
    await expect(requestDeletion()).rejects.toMatchObject({ message: 'rpc failed' })
  })

  it('kastar fel om data.success är false', async () => {
    mockRpc.mockResolvedValue({
      data: { success: false, error: 'Konto har redan en pending request' },
      error: null,
    })
    await expect(requestDeletion()).rejects.toThrow(
      'Konto har redan en pending request'
    )
  })
})

describe('cancelDeletion', () => {
  it('returnerar success vid framgångsrik cancel', async () => {
    mockRpc.mockResolvedValue({ data: { success: true }, error: null })
    const result = await cancelDeletion()
    expect(mockRpc).toHaveBeenCalledWith('cancel_account_deletion')
    expect(result).toEqual({ success: true })
  })

  it('kastar fel vid Supabase-error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'no pending' } })
    await expect(cancelDeletion()).rejects.toMatchObject({ message: 'no pending' })
  })
})

describe('executeImmediateDeletion', () => {
  it('kastar fel om ingen session finns', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    await expect(executeImmediateDeletion()).rejects.toThrow('Ingen aktiv session')
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('anropar RPC och edge function vid lyckad radering', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'tok-abc' } },
    })
    mockRpc.mockResolvedValue({ data: { success: true }, error: null })
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })

    const result = await executeImmediateDeletion()

    expect(mockRpc).toHaveBeenCalledWith('execute_account_deletion_immediate')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.supabase.co/functions/v1/delete-account',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer tok-abc',
        }),
      })
    )
    expect(result).toEqual({ success: true, authDeleted: true })
  })

  it('returnerar authDeleted=false om edge function failar (icke-fatalt)', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'tok-abc' } },
    })
    mockRpc.mockResolvedValue({ data: { success: true }, error: null })
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'admin api failed' }) })

    const result = await executeImmediateDeletion()
    expect(result).toEqual({ success: true, authDeleted: false })
  })

  it('returnerar authDeleted=false om fetch kastar (network-fel)', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'tok-abc' } },
    })
    mockRpc.mockResolvedValue({ data: { success: true }, error: null })
    mockFetch.mockRejectedValue(new Error('network down'))

    const result = await executeImmediateDeletion()
    expect(result).toEqual({ success: true, authDeleted: false })
  })

  it('kastar fel om profile-radering misslyckas (data.success=false)', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'tok-abc' } },
    })
    mockRpc.mockResolvedValue({
      data: { success: false, error: 'foreign key constraint' },
      error: null,
    })

    await expect(executeImmediateDeletion()).rejects.toThrow(
      'foreign key constraint'
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
