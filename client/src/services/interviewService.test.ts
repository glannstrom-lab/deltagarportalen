import { describe, it, expect, vi, beforeEach } from 'vitest'

const createMock = vi.fn()
const updateMock = vi.fn()

vi.mock('./cloudStorage', () => ({
  interviewSessionsApi: {
    create: (...args: unknown[]) => createMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
    getAll: vi.fn(),
  },
}))

describe('saveInterviewSessionWithScore (DATA-01)', () => {
  beforeEach(() => {
    createMock.mockReset()
    updateMock.mockReset()
    createMock.mockResolvedValue({ id: 'session-123' })
    updateMock.mockResolvedValue(undefined)
  })

  it('inserts session and updates with score + breakdown when score provided', async () => {
    const { saveInterviewSessionWithScore } = await import('./interviewService')
    await saveInterviewSessionWithScore(
      { mockInterviewId: 'mi-1', startTime: '2026-04-28', answers: [], completed: true },
      84,
      { q1: 25, q2: 25, q3: 17, q4: 17 }
    )
    expect(createMock).toHaveBeenCalledTimes(1)
    expect(updateMock).toHaveBeenCalledTimes(1)
    const updatePayload = updateMock.mock.calls[0][1]
    expect(updatePayload).toMatchObject({ score: 84 })
    expect(updatePayload.score_breakdown).toMatchObject({ q1: 25, q2: 25, q3: 17, q4: 17 })
  })

  it('does NOT call update when score is null (backward-compat path)', async () => {
    const { saveInterviewSessionWithScore } = await import('./interviewService')
    await saveInterviewSessionWithScore(
      { mockInterviewId: 'mi-2', startTime: '2026-04-28', answers: [], completed: true },
      null
    )
    expect(createMock).toHaveBeenCalledTimes(1)
    expect(updateMock).not.toHaveBeenCalled()
  })
})
