import { describe, it, expect, vi, beforeEach } from 'vitest'

const insertMock = vi.fn()
const getUserMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: () => getUserMock() },
    from: () => ({ insert: (...args: unknown[]) => insertMock(...args) }),
  },
}))

describe('personalBrandAuditsApi.create (DATA-02)', () => {
  beforeEach(() => {
    insertMock.mockReset()
    getUserMock.mockReset()
    insertMock.mockResolvedValue({ error: null })
  })

  it('inserts row with user_id, score, dimensions, summary', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    const { personalBrandAuditsApi } = await import('./personalBrandAuditsApi')
    await personalBrandAuditsApi.create({
      score: 78.5,
      dimensions: { online: 80, content: 70, network: 75, consistency: 82 },
      summary: 'Stark online-närvaro',
    })
    expect(insertMock).toHaveBeenCalledTimes(1)
    const payload = insertMock.mock.calls[0][0]
    expect(payload).toMatchObject({
      user_id: 'user-123',
      score: 78.5,
      dimensions: { online: 80, content: 70, network: 75, consistency: 82 },
      summary: 'Stark online-närvaro',
    })
  })

  it('throws when no authenticated user', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    const { personalBrandAuditsApi } = await import('./personalBrandAuditsApi')
    await expect(personalBrandAuditsApi.create({ score: 50, dimensions: {} })).rejects.toThrow(/inloggad/)
  })
})
