import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { PeriodiskRapportUnderlag } from './PeriodiskRapportUnderlag'

const plan = { id: 'pl', participant_id: 'p1', start_date: '2026-09-01', end_date: null } as never
const sessions = [
  { id: 'a', plan_id: 'pl', participant_id: 'p1', date: '2026-10-05', start_time: '09:00', end_time: '11:00', title: 'Gruppträff', activity_type: 'jobsearch', location: 'Kontoret', attendance: 'present', sick_certificate_received: false, is_provider_led: true, is_physical: true },
]
vi.mock('@/services/aktivitetApi', () => ({ aktivitetsplanApi: { listSessionsBetween: vi.fn(async () => sessions) } }))
vi.mock('@/services/moteskadens', () => ({ hamtaMotenIPeriod: vi.fn(async () => []), MOTE_GRANS_DAGAR: 14, FYSISKT_GRANS_DAGAR: 28 }))
vi.mock('@/services/periodiskRapportPdf', () => ({ laddaNerPeriodiskRapportPdf: vi.fn() }))

const skriv = vi.fn(async () => undefined)
beforeEach(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: skriv }, configurable: true }) })
afterEach(() => { cleanup(); vi.clearAllMocks() })

const rendera = () => render(<PeriodiskRapportUnderlag plans={[plan]} namn={() => 'Jonas'} forvaltFran="2026-10-01" forvaltTill="2026-10-31" />)

describe('PeriodiskRapportUnderlag', () => {
  it('säger att fältordningen inte är verifierad och hämtar inget förrän man trycker', () => {
    rendera()
    expect(screen.getByText(/fältordningen är inte verifierad/i)).toBeTruthy()
    expect(screen.queryByTestId('periodrapport-resultat')).toBeNull()
  })

  it('visar fälten med källa och kopierar ett fält', async () => {
    rendera()
    fireEvent.click(screen.getByRole('button', { name: 'Ta fram underlag' }))
    await waitFor(() => expect(screen.getByTestId('periodrapport-resultat')).toBeTruthy())
    expect(screen.getByText(/100 % \(1 av 1 pass\)/)).toBeTruthy()
    expect(screen.getAllByText(/Källa: 1 rad/).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Kopiera andel fysiska aktiviteter' }))
    await waitFor(() => expect(skriv).toHaveBeenCalledWith(expect.stringContaining('Andel fysiska aktiviteter:\n100 %')))
  })

  it('felaktigt intervall ger ett fel och ingen hämtning', async () => {
    rendera()
    fireEvent.change(screen.getByLabelText('Från'), { target: { value: '2026-11-05' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ta fram underlag' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/efter/)
  })
})
