/**
 * RR8 (rollspelet 2026-09-27): ingen väg från aktivitetsloggen till den
 * periodiska rapporten — ingen export, ingen kopiering.
 * RR12: på 390 px var tabellen 602 px bred och "Andel fysiska" syntes inte.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AvtalskravKort } from './AvtalskravKort'

const plan = { id: 'pl', participant_id: 'p1', consultant_id: 'k1', org_id: null, template_id: null, template_name: null, start_date: '2026-08-03', end_date: null, weekly_hours_target: 5, jobsearch_hours_per_week: 0, target_reason: null, status: 'active', plan_text: null, decided_at: null, forsorjningshinder: null, nedsattning_underlag_lamnat_at: null, af_registered_at: null, created_at: '', updated_at: '' }
const pass = (o: Record<string, unknown>) => ({ id: String(Math.random()), plan_id: 'pl', participant_id: 'p1', date: '2026-09-08', start_time: '09:00', end_time: '11:00', title: 'Gruppträff', activity_type: 'jobsearch', location: 'Kontoret', notes: null, attendance: 'present', attendance_note: null, sick_certificate_received: false, marked_by: null, marked_at: null, self_checkin_at: null, created_at: '', updated_at: '', ...o })

vi.mock('@/services/aktivitetApi', () => ({
  aktivitetsplanApi: {
    listAll: vi.fn(async () => [plan]),
    listSessionsBetween: vi.fn(async () => [pass({}), pass({ date: '2026-09-15', attendance: 'absent_invalid' })]),
  },
}))
vi.mock('@/pages/consultant/consultantParticipantsQuery', () => ({
  fetchCachedConsultantParticipants: vi.fn(async () => [{ participant_id: 'p1', first_name: 'Jonas', last_name: 'Demo' }]),
}))
vi.mock('@/services/moteskadens', () => ({
  hamtaMotenIPeriod: vi.fn(async () => [
    { participant_id: 'p1', scheduled_at: new Date(2026, 8, 10, 10).toISOString(), meeting_type: 'physical', status: 'completed' },
  ]),
}))

const skriv = vi.fn(async () => undefined)
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 27, 10, 0, 0))
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: skriv }, configurable: true })
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers() })

function rendera() {
  return render(<QueryClientProvider client={new QueryClient()}><AvtalskravKort /></QueryClientProvider>)
}

describe('RR8 — underlag för den periodiska rapporten', () => {
  it('fälls ut per deltagare med kopierbara fält och säger att portalen inte skickar något', async () => {
    rendera()
    fireEvent.click(await screen.findByRole('button', { name: /Underlag för rapporten/ }))
    const panel = screen.getByTestId('rapportunderlag')
    expect(panel).toHaveTextContent('Underlag för Jonas Demo, september 2026')
    expect(panel).toHaveTextContent('1 möte (varav 1 fysiskt): 10/9 fysiskt')
    expect(panel).toHaveTextContent('15/9 Gruppträff: ogiltig frånvaro')
    expect(panel).toHaveTextContent('Portalen kan inte skicka något till Arbetsförmedlingen')
    fireEvent.click(within(panel).getByRole('button', { name: 'Kopiera individuella möten (datum och typ)' }))
    await vi.waitFor(() => expect(skriv).toHaveBeenCalledWith('1 möte (varav 1 fysiskt): 10/9 fysiskt'))
    expect(await within(panel).findByText('Kopierat')).toBeInTheDocument()
  })
})

describe('RR12 — mobil', () => {
  it('varje värdecell bär sin etikett, så raden går att läsa staplad utan tabellhuvud', async () => {
    rendera()
    await screen.findByRole('button', { name: /Underlag för rapporten/ })
    const etiketter = [...document.querySelectorAll('td[data-label]')].map((td) => td.getAttribute('data-label'))
    expect(etiketter).toEqual(['Veckor med uppfyllt timkrav', 'Andel fysiska', 'Krav just nu'])
    expect(document.getElementById('avtalskrav')?.className).toContain('scroll-mt-28')
  })
})
