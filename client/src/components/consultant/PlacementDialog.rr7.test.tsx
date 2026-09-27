/**
 * RR7 (rollspelet 2026-09-27): "Registrera placering" saknade R&M:s utfall —
 * studier, omfattning, slutdatum och nivå A/B/C. Före PENDING_20260927b
 * sparas omfattning/slutdatum/nivå som en läsbar rad i anteckningen och inga
 * nya kolumner skickas; efter migrationen går de i egna kolumner.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { PlacementDialog } from './PlacementDialog'
import { consultantService } from '@/services/consultantService'
import { extraKolumner, anteckningMedExtra, valbaraTyper, placeringLage } from '@/services/placeringUtfall'

vi.mock('@/services/consultantService', () => ({ consultantService: { recordPlacement: vi.fn() } }))
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'k1' } } }) },
    from: () => ({ select: () => ({ eq: async () => ({ data: [] }) }) }),
  },
}))

afterEach(() => { cleanup(); vi.clearAllMocks() })

const anna = { participant_id: 'p1', first_name: 'Anna', last_name: 'A', email: 'a@example.com' }

describe('RR7 — dialogen', () => {
  it('omfattning, slutdatum och nivå sparas i egna kolumner (migrationen körd 2026-09-27)', async () => {
    vi.mocked(consultantService.recordPlacement).mockResolvedValue({} as never)
    render(<PlacementDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} preselectedParticipant={anna} />)
    fireEvent.change(await screen.findByLabelText(/Arbetsgivare/), { target: { value: 'Demobageriet AB' } })
    fireEvent.change(screen.getByLabelText('Omfattning'), { target: { value: '30' } })
    fireEvent.change(screen.getByLabelText(/Slutdatum/), { target: { value: '2099-12-31' } })
    fireEvent.change(screen.getByLabelText(/Nivå enligt avtalet/), { target: { value: 'B' } })
    fireEvent.click(screen.getByRole('button', { name: /Spara placering/i }))
    await waitFor(() => expect(consultantService.recordPlacement).toHaveBeenCalledTimes(1))
    const skickat = vi.mocked(consultantService.recordPlacement).mock.calls[0][0] as unknown as Record<string, unknown>
    expect(skickat).toMatchObject({ hours_per_week: 30, outcome_level: 'B', end_date: '2099-12-31' })
    expect(String(skickat.notes ?? '')).not.toContain('Omfattning:')
  })

  it('en orimlig omfattning stoppas med ett begripligt fel', async () => {
    render(<PlacementDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} preselectedParticipant={anna} />)
    fireEvent.change(await screen.findByLabelText(/Arbetsgivare/), { target: { value: 'X AB' } })
    fireEvent.change(screen.getByLabelText('Omfattning'), { target: { value: '80' } })
    fireEvent.click(screen.getByRole('button', { name: /Spara placering/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('mellan 1 och 60 timmar')
    expect(consultantService.recordPlacement).not.toHaveBeenCalled()
  })

  it('Studier går att välja sedan migrationen', async () => {
    render(<PlacementDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} preselectedParticipant={anna} />)
    const typ = await screen.findByLabelText('Utfall')
    expect([...(typ as HTMLSelectElement).options].map((o) => o.value)).toEqual(['permanent', 'temp', 'trial', 'studies'])
  })
})

describe('RR7 — efter migrationen', () => {
  it('Studier är valbart och uppgifterna går i egna kolumner, inte i anteckningen', () => {
    expect(valbaraTyper(true)).toContain('studies')
    const extra = { end_date: '2027-01-31', hours_per_week: 30, scope_percent: null, outcome_level: 'B' as const }
    expect(extraKolumner(extra, true)).toEqual({ end_date: '2027-01-31', hours_per_week: 30, outcome_level: 'B' })
    expect(anteckningMedExtra('Hej', extra, true)).toBe('Hej')
  })
})

describe('RR6/RR7 — placeringens läge', () => {
  it('ett startdatum i framtiden är kommande, inte pågående', () => {
    expect(placeringLage({ start_date: '2026-10-19' }, '2026-09-27')).toBe('kommande')
    expect(placeringLage({ start_date: '2026-07-09' }, '2026-09-27')).toBe('pagaende')
    expect(placeringLage({ start_date: '2026-01-01', end_date: '2026-06-30' }, '2026-09-27')).toBe('avslutad')
  })
})
