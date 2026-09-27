/**
 * RR24 (rollspelet 2026-09-27): MSFA-vyn — AF:s ärende-id överst (RK40),
 * markeringen "förd över" per plan och månad, och RR27:s härledda pass.
 * Konstanterna för PENDING_20260927d mockade till true.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AvtalskravKort } from './AvtalskravKort'

const plan = { id: 'pl', participant_id: 'p1', consultant_id: 'k1', org_id: 'org1', template_id: null, template_name: null, start_date: '2026-08-03', end_date: null, weekly_hours_target: 5, jobsearch_hours_per_week: 0, target_reason: null, status: 'active', plan_text: null, decided_at: null, forsorjningshinder: null, nedsattning_underlag_lamnat_at: null, af_registered_at: null, case_reference: 'A-778899', created_at: '', updated_at: '' }
const pass = (o: Record<string, unknown>) => ({ id: String(Math.random()), plan_id: 'pl', participant_id: 'p1', date: '2026-09-08', start_time: '09:00', end_time: '11:00', title: 'Gruppträff', activity_type: 'jobsearch', location: 'Kontoret', notes: null, attendance: 'present', attendance_note: null, sick_certificate_received: false, marked_by: null, marked_at: null, self_checkin_at: null, created_at: '', updated_at: '', ...o })

vi.mock('@/services/planMarkning', async (orig) => ({ ...(await orig<typeof import('@/services/planMarkning')>()), PLAN_PASS_KOLUMNER_FINNS: true }))
const overforda: Array<Record<string, unknown>> = []
vi.mock('@/services/resultatklocka', () => ({
  RESULTAT_MSFA_FINNS: true,
  msfaApi: {
    listForManad: vi.fn(async () => overforda),
    markera: vi.fn(async (p: { id: string; participant_id: string }, ym: string) => ({ id: 'o1', plan_id: p.id, participant_id: p.participant_id, consultant_id: 'k1', period_month: ym, transferred_at: '2026-09-27T08:00:00Z', transferred_by: 'k1' })),
    angra: vi.fn(async () => undefined),
  },
}))
vi.mock('@/stores/authStore', () => ({ useAuthStore: (sel: (s: unknown) => unknown) => sel({ profile: { id: 'k1' } }) }))
vi.mock('@/services/aktivitetApi', () => ({
  aktivitetsplanApi: {
    listAll: vi.fn(async () => [plan]),
    listSessionsBetween: vi.fn(async () => [pass({}), pass({ date: '2026-09-09', location: null, is_physical: true, is_provider_led: true })]),
  },
}))
vi.mock('@/pages/consultant/consultantParticipantsQuery', () => ({
  fetchCachedConsultantParticipants: vi.fn(async () => [{ participant_id: 'p1', first_name: 'Jonas', last_name: 'Demo' }]),
}))
vi.mock('@/services/moteskadens', () => ({ hamtaMotenIPeriod: vi.fn(async () => []) }))

beforeEach(() => {
  overforda.length = 0
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 27, 10, 0, 0))
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers() })

function rendera() {
  return render(<QueryClientProvider client={new QueryClient()}><AvtalskravKort /></QueryClientProvider>)
}

describe('RR24 — MSFA-vyn', () => {
  it('ärende-id:t står överst i underlaget och går att kopiera', async () => {
    rendera()
    fireEvent.click(await screen.findByRole('button', { name: /Underlag för rapporten/ }))
    const panel = screen.getByTestId('rapportunderlag')
    const etiketter = [...panel.querySelectorAll('dt')].map((d) => d.textContent)
    expect(etiketter[0]).toBe('Ärende-id hos Arbetsförmedlingen')
    expect(panel).toHaveTextContent('A-778899')
    expect(within(panel).getByRole('button', { name: 'Kopiera ärende-id hos arbetsförmedlingen' })).toBeInTheDocument()
  })

  it('markerar månaden som förd över och kan ångra den egna markeringen', async () => {
    const { msfaApi } = await import('@/services/resultatklocka')
    rendera()
    fireEvent.click(await screen.findByRole('button', { name: /Underlag för rapporten/ }))
    const rad = screen.getByTestId('msfa-overforing')
    fireEvent.click(within(rad).getByRole('button', { name: 'Markera som förd över till MSFA' }))
    await vi.waitFor(() => expect(msfaApi.markera).toHaveBeenCalledWith(expect.objectContaining({ id: 'pl' }), '2026-09'))
    expect(await within(rad).findByText('Förd över till MSFA 27 september 2026 av dig')).toBeInTheDocument()
    expect(screen.getByTestId('overford')).toHaveTextContent('Förd över 27 sep')
    fireEvent.click(within(rad).getByRole('button', { name: 'Ångra' }))
    await vi.waitFor(() => expect(msfaApi.angra).toHaveBeenCalledWith('o1'))
    expect(await within(rad).findByRole('button', { name: 'Markera som förd över till MSFA' })).toBeInTheDocument()
  })

  it('en kollegas markering visas men kan inte ångras härifrån', async () => {
    overforda.push({ id: 'o2', plan_id: 'pl', participant_id: 'p1', consultant_id: 'k2', period_month: '2026-09', transferred_at: '2026-10-05T08:00:00Z', transferred_by: 'k2' })
    rendera()
    fireEvent.click(await screen.findByRole('button', { name: /Underlag för rapporten/ }))
    const rad = screen.getByTestId('msfa-overforing')
    expect(rad).toHaveTextContent('Förd över till MSFA 5 oktober 2026 av en kollega')
    expect(within(rad).queryByRole('button')).toBeNull()
  })

  it('går markeringarna inte att läsa står det — tabellen visas ändå', async () => {
    const { msfaApi } = await import('@/services/resultatklocka')
    vi.mocked(msfaApi.listForManad).mockRejectedValueOnce(new Error('nätverk'))
    rendera()
    fireEvent.click(await screen.findByRole('button', { name: /Underlag för rapporten/ }))
    expect(screen.getByTestId('rapportunderlag')).toHaveTextContent('Markeringen "förd över" kunde inte hämtas')
  })
})

describe('RR27 — märkningen i loggen', () => {
  it('säger hur många närvaropass som bygger på härledningen', async () => {
    rendera()
    expect(await screen.findByTestId('harledda')).toHaveTextContent('varav 1 härledda')
    expect(screen.getByText(/Fysiskt och leverantörsledd = passets märkning/)).toBeInTheDocument()
  })
})
