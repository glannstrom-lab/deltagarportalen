/**
 * UX12 — deltagarens uppslag av sin egen konsulent.
 *
 * Buggen var att `/my-consultant` läste `profiles` direkt, blev blockerad av
 * RLS (406 PGRST116) och visade "Ingen konsulent tilldelad ännu" för samtliga
 * 31 kopplade deltagare i prod. Testerna låser tre saker:
 *
 *  1. Läsningen går via RPC:n `get_my_consultant` — inte via `profiles`.
 *  2. "Ingen konsulent" (null) och "anropet gick fel" hålls isär. Att svälja
 *     felet till null var det som gjorde buggen osynlig i ett halvår.
 *  3. RPC:n anropas utan argument — den utgår från auth.uid() server-side, så
 *     ingen kan be om någon annans konsulent.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMyConsultant, getMyConsultantName } from './myConsultantApi'

const mockRpc = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: () => {
      throw new Error('myConsultantApi får inte läsa tabeller direkt — RLS blockerar profiles')
    },
  },
}))

beforeEach(() => {
  mockRpc.mockReset()
})

const KONSULENT = {
  id: 'c-1',
  first_name: 'Anna',
  last_name: 'Svensson',
  email: 'anna@example.se',
  phone: '070-1234567',
  avatar_url: null,
}

describe('getMyConsultant', () => {
  it('anropar RPC:n get_my_consultant utan argument', async () => {
    mockRpc.mockResolvedValue({ data: KONSULENT, error: null })

    await getMyConsultant()

    expect(mockRpc).toHaveBeenCalledWith('get_my_consultant')
    expect(mockRpc.mock.calls[0].length).toBe(1)
  })

  it('returnerar konsulentens kontaktuppgifter', async () => {
    mockRpc.mockResolvedValue({ data: KONSULENT, error: null })

    await expect(getMyConsultant()).resolves.toEqual(KONSULENT)
  })

  it('returnerar null när ingen konsulent är tilldelad', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })

    await expect(getMyConsultant()).resolves.toBeNull()
  })

  it('KASTAR vid anropsfel i stället för att låtsas att ingen konsulent finns', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'permission denied' } })

    await expect(getMyConsultant()).rejects.toThrow('permission denied')
  })
})

describe('getMyConsultantName', () => {
  it('sätter ihop för- och efternamn', async () => {
    mockRpc.mockResolvedValue({ data: KONSULENT, error: null })

    await expect(getMyConsultantName()).resolves.toBe('Anna Svensson')
  })

  it('klarar att efternamnet saknas', async () => {
    mockRpc.mockResolvedValue({ data: { ...KONSULENT, last_name: null }, error: null })

    await expect(getMyConsultantName()).resolves.toBe('Anna')
  })

  it('ger null när namnet är tomt — inte en tom sträng som ser ut som ett namn', async () => {
    mockRpc.mockResolvedValue({ data: { ...KONSULENT, first_name: null, last_name: null }, error: null })

    await expect(getMyConsultantName()).resolves.toBeNull()
  })

  it('ger null när ingen konsulent är tilldelad', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })

    await expect(getMyConsultantName()).resolves.toBeNull()
  })
})
