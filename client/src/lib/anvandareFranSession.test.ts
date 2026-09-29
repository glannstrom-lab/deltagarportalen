import { describe, it, expect, vi, beforeEach } from 'vitest'

const getSession = vi.fn()
const getUser = vi.fn()
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession: () => getSession(), getUser: () => getUser() } } }))

import { anvandareFranSession } from './anvandareFranSession'

describe('anvandareFranSession (SFT1)', () => {
  beforeEach(() => { getSession.mockReset(); getUser.mockReset() })

  it('tar användaren ur sessionen utan att fråga auth-servern', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null })
    const svar = await anvandareFranSession()
    expect(svar.data.user?.id).toBe('u1')
    expect(svar.error).toBeNull()
    expect(getUser).not.toHaveBeenCalled()
  })

  it('frågar servern när ingen session finns — den utloggade får samma fel som förut', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null })
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Auth session missing!' } })
    const svar = await anvandareFranSession()
    expect(getUser).toHaveBeenCalledTimes(1)
    expect(svar.data.user).toBeNull()
    expect(svar.error).not.toBeNull()
  })

  it('frågar servern när getSession kastar', async () => {
    getSession.mockRejectedValue(new Error('lagring'))
    getUser.mockResolvedValue({ data: { user: { id: 'u2' } }, error: null })
    expect((await anvandareFranSession()).data.user?.id).toBe('u2')
  })
})
