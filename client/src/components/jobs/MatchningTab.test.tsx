/**
 * EN matchning med valbara faktorer (2026-10-18). Det deltagaren kryssar ur ska
 * verkligen lämna sökningen — och valet sparas på kontot.
 * Mutation: låt `soktermer` ignorera `aktiva` → testet "kryssar ur" faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const m = vi.hoisted(() => ({
  prefetch: vi.fn(async (termer: string[]) => new Map(termer.map((t) => [t, []]))),
  spara: vi.fn(async () => {}),
}))

vi.mock('@/services/cvApi', () => ({
  cvApi: { getCV: vi.fn().mockResolvedValue({ skills: [{ name: 'WMS' }], workExperience: [{ title: 'Kassabiträde' }], education: [] }) },
}))
vi.mock('@/services/cloudStorage', () => ({ interestGuideApi: { getProgress: vi.fn().mockResolvedValue(null) } }))
vi.mock('@/services/unifiedProfileApi', () => ({ unifiedProfileApi: { getProfile: vi.fn().mockResolvedValue(null) } }))
vi.mock('@/services/userApi', () => ({
  userApi: { getPreferences: vi.fn().mockResolvedValue({ desired_jobs: [{ label: 'Lagerarbetare', priority: 1 }], consultant_data: { targetIndustries: ['transport'] } }) },
}))
vi.mock('@/services/jobMatching', async (orig) => ({ ...(await orig<typeof import('@/services/jobMatching')>()), prefetchJobSearches: m.prefetch }))
vi.mock('@/services/matchning', async (orig) => {
  const riktig = await orig<typeof import('@/services/matchning')>()
  return { ...riktig, faktorValApi: { hamta: vi.fn(async () => new Set()), spara: m.spara } }
})
vi.mock('@/hooks/useSavedJobs', () => ({ useSavedJobs: () => ({ saveJob: vi.fn(), removeJob: vi.fn(), isSaved: () => false }) }))
vi.mock('./matches/LocationSelector', () => ({ LocationSelector: () => null }))

import { MatchningTab } from './MatchningTab'

const rendera = () => render(<MemoryRouter><MatchningTab /></MemoryRouter>)

describe('MatchningTab — faktorer i stället för tre matchningar', () => {
  beforeEach(() => { m.prefetch.mockClear(); m.spara.mockClear() })

  it('söker på alla valda underlag i en och samma matchning', async () => {
    rendera()
    await waitFor(() => expect(m.prefetch).toHaveBeenCalled())
    expect(m.prefetch.mock.calls.at(-1)![0]).toEqual(['Lagerarbetare', 'Kassabiträde', 'WMS'])
    // inga källflikar längre
    expect(screen.queryByRole('button', { name: /intresseguiden/i })).toBeNull()
  })

  it('ett urkryssat underlag lämnar sökningen och valet sparas', async () => {
    rendera()
    const ruta = await screen.findByRole('checkbox', { name: /Yrken jag haft/ })
    await userEvent.click(ruta)
    await waitFor(() => expect(m.prefetch.mock.calls.at(-1)![0]).toEqual(['Lagerarbetare', 'WMS']))
    expect(m.spara).toHaveBeenCalledWith(new Set(['tidigareYrken']))
  })

  it('en faktor utan data går inte att kryssa i och säger vad som saknas', async () => {
    rendera()
    const ruta = await screen.findByRole('checkbox', { name: /Intresseguidens förslag/ })
    expect(ruta).toBeDisabled()
    expect(screen.getByText('Du har inte gjort intresseguiden.')).toBeInTheDocument()
    // branschen läses nu ur profilens riktiga fält (consultant_data.targetIndustries)
    expect(screen.getByRole('checkbox', { name: /Min bransch/ })).toBeEnabled()
  })
})
