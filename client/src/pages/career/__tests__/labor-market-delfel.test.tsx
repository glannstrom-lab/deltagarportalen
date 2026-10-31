/**
 * Avbrott i en enskild AF-del får inte läsas som "AF svarade utan data".
 * af-trends svarar 502/504 vid avbrott och klienten kastar; en tom lista och
 * ett kastat fel måste ge olika text.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('@/services/afTrendsApi', () => ({
  trendsApi: {
    getMarketStats: vi.fn(),
    getTrendingSkills: vi.fn(),
    getPopularSearches: vi.fn(),
  },
}))
vi.mock('@/services/afPrognosApi', async () => {
  const riktig = await vi.importActual<typeof import('@/services/afPrognosApi')>('@/services/afPrognosApi')
  return { ...riktig, sokPrognos: vi.fn().mockResolvedValue(null) }
})

import { trendsApi } from '@/services/afTrendsApi'
import LaborMarketTab from '../LaborMarketTab'

const stats = { total_jobs: 100, new_jobs_today: 1, new_jobs_week: 5, by_region: [], by_occupation: [], last_updated: '2026-10-31T10:00:00Z' }

describe('LaborMarketTab: avbrott i en del', () => {
  beforeEach(() => vi.clearAllMocks())

  it('kastat fel i kompetenser säger inte att AF svarade tomt', async () => {
    vi.mocked(trendsApi.getMarketStats).mockResolvedValue(stats as never)
    vi.mocked(trendsApi.getTrendingSkills).mockRejectedValue(new Error('502'))
    vi.mocked(trendsApi.getPopularSearches).mockResolvedValue([{ term: 'Kock', count: 3 }])
    render(<LaborMarketTab />)
    await waitFor(() => expect(screen.getByText(/kunde inte hämta den här delen/i)).toBeTruthy())
    expect(screen.queryByText(/svarade utan yrkesområden/i)).toBeNull()
  })

  it('en äkta tom lista får fortfarande tomtexten', async () => {
    vi.mocked(trendsApi.getMarketStats).mockResolvedValue(stats as never)
    vi.mocked(trendsApi.getTrendingSkills).mockResolvedValue([])
    vi.mocked(trendsApi.getPopularSearches).mockResolvedValue([{ term: 'Kock', count: 3 }])
    render(<LaborMarketTab />)
    await waitFor(() => expect(screen.getByText(/svarade utan yrkesområden/i)).toBeTruthy())
    expect(screen.queryByText(/kunde inte hämta den här delen/i)).toBeNull()
  })

  it('kastat fel i yrkesgrupper säger inte "ingen yrkesstatistik i svaret"', async () => {
    vi.mocked(trendsApi.getMarketStats).mockResolvedValue(stats as never)
    vi.mocked(trendsApi.getTrendingSkills).mockResolvedValue([{ skill: 'Vård', occupation_field: 'Hälsa' }])
    vi.mocked(trendsApi.getPopularSearches).mockRejectedValue(new Error('504'))
    render(<LaborMarketTab />)
    await waitFor(() => expect(screen.getByText(/kunde inte hämta den här delen/i)).toBeTruthy())
    expect(screen.queryByText(/ingen yrkesstatistik i svaret/i)).toBeNull()
  })
})
