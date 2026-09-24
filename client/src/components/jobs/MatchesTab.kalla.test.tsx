/**
 * MatchesTab — vald källa ska stå kvar när orten byts.
 *
 * `loadData` körs om vid varje ortbyte och satte tidigare alltid förvald
 * källa till den första tillgängliga ("Mitt CV"). Den som stod på
 * intresseguidens eller karriärmålens matchningar och bytte ort hamnade
 * tyst på CV-listan — med ortens CV-jobb under en rubrik hon inte valt.
 *
 * Mutation: återställ de villkorslösa `setActiveSource('cv')`-raderna → RÖD.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/services/cvApi', () => ({
  cvApi: { getCV: vi.fn().mockResolvedValue({ skills: [{ id: 's1', name: 'Truckkort', level: 3, category: 'x' }], workExperience: [{ title: 'Lagerarbetare' }] }) },
}))
vi.mock('@/services/cloudStorage', () => ({ interestGuideApi: { getProgress: vi.fn().mockResolvedValue(null) } }))
vi.mock('@/services/unifiedProfileApi', () => ({
  unifiedProfileApi: { getProfile: vi.fn().mockResolvedValue({ career: { preferredRoles: ['Truckförare'] } }) },
}))
vi.mock('@/services/userApi', () => ({ userApi: { getPreferences: vi.fn().mockResolvedValue(null) } }))
vi.mock('@/services/jobMatching', async () => {
  const actual = await vi.importActual<typeof import('@/services/jobMatching')>('@/services/jobMatching')
  return { ...actual, prefetchJobSearches: vi.fn().mockResolvedValue(new Map()) }
})
vi.mock('@/hooks/useSavedJobs', () => ({
  useSavedJobs: () => ({ saveJob: vi.fn(), removeJob: vi.fn(), isSaved: () => false }),
}))
vi.mock('./matches/LocationSelector', () => ({
  LocationSelector: ({ onChange }: { onChange: (l: string[]) => void }) => (
    <button type="button" onClick={() => onChange(['Malmö'])}>byt-ort</button>
  ),
}))

import { MatchesTab } from './MatchesTab'

beforeEach(() => vi.clearAllMocks())

describe('MatchesTab — källan står kvar vid ortbyte', () => {
  it('karriärmål förblir vald källa efter att orten bytts', async () => {
    render(<MemoryRouter><MatchesTab /></MemoryRouter>)

    const karriar = await screen.findByRole('button', { name: /karriär/i })
    fireEvent.click(karriar)
    await waitFor(() => expect(screen.getByRole('button', { name: /karriär/i })).toHaveAttribute('aria-pressed', 'true'))

    fireEvent.click(screen.getByRole('button', { name: 'byt-ort' }))

    // Omladdningen byter ut hela fliken mot en spinner och tillbaka.
    await waitFor(() => expect(screen.getByRole('button', { name: 'byt-ort' })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /karriär/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /CV/ })).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('MatchesTab — ortbyte laddar om', () => {
  // 2026-09-24: de två laddningseffekterna slogs ihop till en på [loadData].
  // Mutation: sätt beroendet till [] → ingen omladdning, testet faller.
  it('hämtar om underlaget när orten byts', async () => {
    const { cvApi } = await import('@/services/cvApi')
    render(<MemoryRouter><MatchesTab /></MemoryRouter>)
    await screen.findByRole('button', { name: 'byt-ort' })
    expect(cvApi.getCV).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'byt-ort' }))
    await waitFor(() => expect(cvApi.getCV).toHaveBeenCalledTimes(2))
  })
})
