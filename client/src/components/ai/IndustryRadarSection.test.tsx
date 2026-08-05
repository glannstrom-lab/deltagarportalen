/**
 * B13 (2026-08-05) — arbetsmarknadssiffrorna får inte vara påhittade.
 *
 * Sektionen visade tidigare `Math.floor(Math.random() * 15) + 5` som
 * tillväxtprocent, "+3-6 % årligen" som lönetrend och en `demandGrowth`
 * uträknad ur ett `demand`-tal som edge-funktionen räknade ned (95, 90, 85 …).
 * Allt låg dessutom under AI-märkningen, som intygade att siffrorna kom ur en
 * AI-analys — trots att ingen AI är inblandad.
 *
 * Testerna låser fast tre saker:
 *   1. de tal som visas kommer ur svaret från Arbetsförmedlingen,
 *   2. inga procenttal uppfinns när källan saknar dem,
 *   3. blocket bär ingen AI-märkning.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Samtyckesgrinden är inte det som testas — släpp igenom barnen.
vi.mock('./AiConsentGate', () => ({
  AiConsentGate: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

const getMarketStatsWithFallback = vi.fn()
const getTrendingSkillsWithFallback = vi.fn()
const getPopularSearchesWithFallback = vi.fn()

vi.mock('@/services/afTrendsApi', () => ({
  trendsApi: {
    getMarketStatsWithFallback: () => getMarketStatsWithFallback(),
    getTrendingSkillsWithFallback: (n: number) => getTrendingSkillsWithFallback(n),
    getPopularSearchesWithFallback: (c: string, n: number) => getPopularSearchesWithFallback(c, n),
  },
}))

import { IndustryRadarSection } from './IndustryRadarSection'

/**
 * Fixturen speglar den form af-trends faktiskt skickar efter B13 — inga
 * `growth_percent`, `trend`, `demand` eller `change_percent`, eftersom AF:s
 * JobSearch-API inte kan belägga något av dem.
 */
const marketStats = {
  total_jobs: 38601,
  new_jobs_today: 1625,
  new_jobs_week: 7839,
  by_region: [
    { region: 'Stockholms län', job_count: 12000 },
    { region: 'Västra Götalands län', job_count: 6000 },
  ],
  by_occupation: [
    { occupation: 'Mjukvaru- och systemutvecklare', job_count: 4200 },
    { occupation: 'Undersköterskor', job_count: 3100 },
  ],
  last_updated: '2026-08-05T00:00:00.000Z',
}

const trendingSkills = [
  { skill: 'Patientvård', occupation_field: 'Hälso- och sjukvård', occupation_field_job_count: 9100 },
]

const popularOccupations = [
  { term: 'Sjuksköterska', count: 2100 },
  { term: 'Lärare', count: 1400 },
]

const renderRadar = () =>
  render(
    <MemoryRouter>
      <IndustryRadarSection defaultExpanded />
    </MemoryRouter>
  )

beforeEach(() => {
  vi.clearAllMocks()
  getMarketStatsWithFallback.mockResolvedValue({ data: marketStats, source: 'api', timestamp: '' })
  getTrendingSkillsWithFallback.mockResolvedValue({ data: trendingSkills, source: 'api', timestamp: '' })
  getPopularSearchesWithFallback.mockResolvedValue({ data: popularOccupations, source: 'api', timestamp: '' })
})

describe('IndustryRadarSection — bara belagda tal', () => {
  it('visar Arbetsförmedlingens faktiska annonsantal per yrkesgrupp', async () => {
    const { container } = renderRadar()

    await waitFor(() => {
      expect(screen.getByText('Mjukvaru- och systemutvecklare')).toBeInTheDocument()
    })

    // 4 200 respektive 3 100 kommer direkt ur by_occupation[].job_count.
    expect(container.textContent).toContain('4 200')
    expect(container.textContent).toContain('3 100')
  })

  it('uppfinner inga procenttal när källan saknar dem', async () => {
    const { container } = renderRadar()

    await waitFor(() => {
      expect(screen.getByText('Mjukvaru- och systemutvecklare')).toBeInTheDocument()
    })

    // Regressionsvakt: den gamla koden renderade "+12%", "-5%", "+3-6% årligen"
    // och "0%" — alla utan källa. Inget procenttecken ska förekomma alls.
    expect(container.textContent).not.toMatch(/\d\s?%/)
    expect(container.textContent).not.toContain('årligen')
  })

  it('bär ingen AI-märkning — innehållet är ren AF-data, inte en AI-analys', async () => {
    const { container } = renderRadar()

    await waitFor(() => {
      expect(screen.getByText('Mjukvaru- och systemutvecklare')).toBeInTheDocument()
    })

    expect(container.querySelector('[data-ai-generated]')).toBeNull()
    expect(container.textContent).not.toMatch(/AI-genererat|AI-generated/i)
  })

  it('anger källan och skiljer live-data från cachad data', async () => {
    getMarketStatsWithFallback.mockResolvedValue({ data: marketStats, source: 'cache', timestamp: '' })
    const { container } = renderRadar()

    await waitFor(() => {
      expect(container.textContent).toContain('Källa: Arbetsförmedlingen')
    })

    // Badgen sa "Realtidsdata" även när svaret kom ur 30-minuterscachen.
    expect(container.textContent).toContain('Sparad data')
    expect(container.textContent).not.toContain('Realtidsdata')
  })

  it('visar ett ärligt tomtillstånd i stället för nollor när AF inte lämnar data', async () => {
    getMarketStatsWithFallback.mockResolvedValue({ data: null, source: 'api', timestamp: '' })
    getTrendingSkillsWithFallback.mockResolvedValue({ data: [], source: 'api', timestamp: '' })
    getPopularSearchesWithFallback.mockResolvedValue({ data: [], source: 'api', timestamp: '' })

    const { container } = renderRadar()

    await waitFor(() => {
      expect(screen.getByText('Inga marknadssiffror just nu')).toBeInTheDocument()
    })

    expect(container.textContent).not.toMatch(/\b0\s*(lediga jobb|tjänster tillgängliga)/)
  })

  it('tillskriver kompetenssiffran yrkesområdet, inte kompetensen', async () => {
    const { container } = renderRadar()

    await waitFor(() => {
      expect(screen.getByText('Patientvård')).toBeInTheDocument()
    })

    // 9 100 är yrkesområdets annonsantal — det ska stå bredvid områdets namn.
    expect(container.textContent).toContain('Hälso- och sjukvård: 9 100')
  })
})
