/**
 * Läsfel på sparade jobb är "okänt", inte "noll". `savedJobsApi.getAll().catch(() => [])`
 * gav `jobs.savedCount === 0` vid varje fel — samma vana som "ett påhittat värde
 * framför ett tomt fält".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getAll = vi.fn()

vi.mock('@/services/jobsApi', () => ({ savedJobsApi: { getAll: (...a: unknown[]) => getAll(...a) } }))
vi.mock('@/services/cvApi', () => ({
  cvApi: {
    getCV: vi.fn().mockResolvedValue(null),
    getATSAnalysis: vi.fn().mockResolvedValue(null),
    getVersions: vi.fn().mockResolvedValue([]),
  },
}))
vi.mock('@/services/interestApi', () => ({ interestApi: { getResult: vi.fn().mockResolvedValue(null) } }))
vi.mock('@/services/coverLetterApi', () => ({ coverLetterApi: { getAll: vi.fn().mockResolvedValue([]) } }))
vi.mock('@/services/activityApi', () => ({
  activityApi: {
    getActivities: vi.fn().mockResolvedValue([]),
    getCount: vi.fn().mockResolvedValue(0),
  },
}))
vi.mock('@/services/cloudStorage', () => ({
  moodApi: {
    getTodaysMood: vi.fn().mockResolvedValue(null),
    getStreak: vi.fn().mockResolvedValue(0),
  },
}))
vi.mock('@/lib/anvandareFranSession', () => ({
  anvandareFranSession: vi.fn().mockResolvedValue({ data: { user: null } }),
}))
vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

import { fetchDashboardData, getDefaultDashboardData } from './useDashboardData'

describe('useDashboardData: sparade jobb', () => {
  beforeEach(() => { getAll.mockReset() })

  it('läsfel -> savedCount är null (okänt), aldrig 0', async () => {
    getAll.mockImplementation(() => Promise.reject(new Error('nätverk')))
    const data = await fetchDashboardData()
    expect(data.jobs.savedCount).toBeNull()
    expect(data.jobs.recentSavedJobs).toEqual([])
  })

  it('tomt svar -> savedCount är 0 (ett faktiskt svar)', async () => {
    getAll.mockResolvedValue([])
    const data = await fetchDashboardData()
    expect(data.jobs.savedCount).toBe(0)
  })

  it('två sparade -> 2', async () => {
    getAll.mockResolvedValue([
      { id: 'a', job_id: 'a', job_data: { headline: 'X' } },
      { id: 'b', job_id: 'b', job_data: { headline: 'Y' } },
    ])
    const data = await fetchDashboardData()
    expect(data.jobs.savedCount).toBe(2)
  })

  it('reservdatan påstår inte 0 sparade jobb', () => {
    expect(getDefaultDashboardData().jobs.savedCount).toBeNull()
  })
})
