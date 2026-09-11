/**
 * JobbsokTidKort — tre tester som kan falla (kontrollerat 2026-09-11):
 *   1. Veckans tal ur deltagarensJobbsok ska skrivas ut, inte planens mål.
 *      Mutation: skriv `0 jobb` oavsett svar → faller.
 *   2. `null` (RLS släpper inget) ska ge "ser deltagaren själv", aldrig 0.
 *      Mutation: rendera "0 jobb sparade" vid null → faller.
 *   3. CV-datumet kommer ur dashboardvyn, inte ur jobbsökningen.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@/test/utils'
import { JobbsokTidKort } from './JobbsokTidKort'
import { jobbsokAktivitetApi } from '@/services/jobbsokAktivitet'

vi.mock('@/services/jobbsokAktivitet', () => ({
  jobbsokAktivitetApi: { deltagarensJobbsok: vi.fn() },
}))
vi.mock('@/pages/consultant/consultantParticipantsQuery', () => ({
  fetchCachedConsultantParticipants: vi.fn(async () => [
    { participant_id: 'p1', has_cv: true, cv_updated_at: '2026-09-03T10:00:00Z' },
  ]),
}))

const plan = { id: 'plan-1', jobsearch_hours_per_week: 5 } as never

describe('JobbsokTidKort', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('visar veckans sparade jobb och ansökningar, målet och CV-datumet', async () => {
    vi.mocked(jobbsokAktivitetApi.deltagarensJobbsok).mockResolvedValue({ vecka: '2026-09-07', sparadeJobb: 3, ansokningar: 1 })
    render(<JobbsokTidKort participantId="p1" plan={plan} vecka="2026-09-07" />)
    expect(await screen.findByText('3 jobb sparade · 1 ansökan skickad')).toBeInTheDocument()
    expect(screen.getByText('5 h/vecka avsatt i planen.')).toBeInTheDocument()
    expect(screen.getByText(/CV uppdaterat 3 sep\./)).toBeInTheDocument()
    expect(jobbsokAktivitetApi.deltagarensJobbsok).toHaveBeenCalledWith('p1', '2026-09-07')
  })

  it('säger att bara deltagaren ser siffrorna när ingenting går att läsa — aldrig 0', async () => {
    vi.mocked(jobbsokAktivitetApi.deltagarensJobbsok).mockResolvedValue(null)
    render(<JobbsokTidKort participantId="p1" plan={plan} vecka="2026-09-07" />)
    expect(await screen.findByText(/Veckans siffror ser deltagaren själv/)).toBeInTheDocument()
    expect(screen.queryByText(/0 jobb/)).not.toBeInTheDocument()
  })

  it('visar fel i klartext när hämtningen kastar', async () => {
    vi.mocked(jobbsokAktivitetApi.deltagarensJobbsok).mockRejectedValue(new Error('42501'))
    render(<JobbsokTidKort participantId="p1" plan={plan} vecka="2026-09-07" />)
    expect(await screen.findByRole('alert')).toHaveTextContent('42501')
  })
})
