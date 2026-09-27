/**
 * Rollspelet 2026-09-27, Aktivitet-fliken.
 * RK15: deltagarens egenrapporterade pass (eget jobbsökande, incheckning)
 *       räknades utan kvittens, och deltagarsidan saknade närvaroknapp för
 *       eget jobbsökande medan Min dag hade tre.
 * RR10: praktiken fanns bara som fritext i passen, inte under Platser.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { screen, fireEvent, cleanup } from '@testing-library/react'
import { render } from '@/test/utils'
import { AktivitetsplanSektion } from './AktivitetsplanSektion'

let platser: unknown[] = []
const plan = (o: Record<string, unknown> = {}) => ({
  id: 'plan1', participant_id: 'p1', consultant_id: 'c1', org_id: null, template_id: 't1', template_name: 'Demomall',
  start_date: '2026-09-21', end_date: '2026-12-13', weekly_hours_target: 11, jobsearch_hours_per_week: 3, target_reason: null,
  status: 'active', plan_text: null, decided_at: '2026-09-18', forsorjningshinder: null, nedsattning_underlag_lamnat_at: null, af_registered_at: null, created_at: '', updated_at: '', ...o,
})
const pass = (o: Record<string, unknown>) => ({
  id: 's1', plan_id: 'plan1', participant_id: 'p1', date: '2026-09-24', start_time: '09:00', end_time: '11:00', title: 'Jobbsökarverkstad',
  activity_type: 'jobsearch', location: 'Rum 3', notes: null, attendance: null, attendance_note: null, sick_certificate_received: false,
  marked_by: null, marked_at: null, self_checkin_at: null, created_at: '', updated_at: '', ...o,
})

vi.mock('@/services/aktivitetApi', () => ({
  aktivitetsplanApi: {
    getForParticipant: vi.fn(),
    listAllSessions: vi.fn(),
    markAttendance: vi.fn(),
    saveAttendanceNote: vi.fn(),
    end: vi.fn(),
    addSession: vi.fn(),
    removeSession: vi.fn(),
    update: vi.fn(),
  },
  underlagApi: { list: vi.fn(async () => []), listIPeriod: vi.fn(async () => []), lamna: vi.fn(), angra: vi.fn() },
  kanAngraUnderlag: () => false,
  sammanfattaNarvaro: () => ({ pass: 0, present: 0, absent_valid: 0, absent_invalid: 0, sick_certified: 0, sjuk_utan_intyg: 0, external: 0, omarkerade: 0, anmald_franvaro: 0 }),
  schemamallApi: { list: vi.fn(async () => []) },
  FORSORJNINGSHINDER: [],
  FORSORJNINGSHINDER_ETIKETT: {},
}))
vi.mock('@/components/ui/ConfirmDialog', () => ({ useConfirmDialog: () => ({ confirm: vi.fn(async () => true) }) }))
vi.mock('@/services/aktivitetsplanPdf', () => ({ downloadAktivitetsplanPDF: vi.fn(async () => undefined) }))
vi.mock('@/services/orgApi', () => ({ orgApi: { myMemberships: vi.fn(async () => []) } }))
vi.mock('@/services/jobbsokAktivitet', () => ({ jobbsokAktivitetApi: { deltagarensJobbsok: vi.fn(async () => null) } }))
vi.mock('@/pages/consultant/consultantParticipantsQuery', () => ({ fetchCachedConsultantParticipants: vi.fn(async () => []) }))
vi.mock('@/services/placeringarApi', () => ({ placeringarApi: { getPlaceringarForDeltagare: vi.fn(async () => platser) } }))
vi.mock('@/lib/toast', () => ({ notifications: { success: vi.fn(), error: vi.fn() } }))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 24, 14, 0, 0)) // torsdag 24 sep 2026
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers() })

async function montera(planen: unknown, sessions: unknown[]) {
  const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
  vi.mocked(aktivitetsplanApi.getForParticipant).mockResolvedValue(planen as never)
  vi.mocked(aktivitetsplanApi.listAllSessions).mockResolvedValue(sessions as never)
  render(<AktivitetsplanSektion participantId="p1" participantName="Anna Andersson" />)
  await screen.findByText('Demomall')
  return aktivitetsplanApi
}

describe('RK15: egenrapport väntar på kvittens', () => {
  it('ett passerat eget jobbsökande räknas inte förrän det kvitterats, och kan kvitteras', async () => {
    const eget = pass({ id: 'e1', date: '2026-09-23', start_time: '08:00', end_time: '17:00', title: 'Eget jobbsökande', activity_type: 'jobsearch_own', location: null })
    const api = await montera(plan(), [eget])
    vi.mocked(api.markAttendance).mockImplementation(async (id) => ({ ...eget, id, attendance: 'present' }) as never)
    expect(screen.getByTestId('vantar-kvittens')).toHaveTextContent('1 pass väntar på din kvittens (varav 9 h eget jobbsökande)')
    expect(screen.getByText('Eget jobbsökande, kvitterat').nextElementSibling).toHaveTextContent('0 h')
    expect(screen.getByText(/Egen redovisning · väntar på kvittens/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Kvittera' }))
    await vi.waitFor(() => expect(api.markAttendance).toHaveBeenCalledWith('e1', expect.objectContaining({ attendance: 'present' })))
    await vi.waitFor(() => expect(screen.queryByTestId('vantar-kvittens')).toBeNull())
    expect(screen.getByText('Eget jobbsökande, kvitterat').nextElementSibling).toHaveTextContent('9 h')
  })

  it('eget jobbsökande har samma närvaroval som Min dag', async () => {
    await montera(plan(), [pass({ id: 'e2', date: '2026-09-25', activity_type: 'jobsearch_own', title: 'Eget jobbsökande' })])
    expect(screen.getByRole('button', { name: 'Närvaro' })).toBeInTheDocument()
  })

  it('en incheckning på ett anvisat pass väntar också på kvittens', async () => {
    await montera(plan(), [pass({ self_checkin_at: '2026-09-24T07:05:00Z' })])
    expect(screen.getByText(/Incheckad · väntar på kvittens/)).toBeInTheDocument()
  })
})

describe('RR10: praktik i planen och under Platser', () => {
  it('fritext i passen utan registrerad plats, och en plats utan pass, syns båda', async () => {
    platser = [{ id: 'w1', company_name: 'Nordfrakt AB', status: 'planerad', start_date: '2026-10-07', end_date: null, hours_per_week: 30, placement_type: 'praktik' }]
    await montera(plan(), [pass({ activity_type: 'workplace', location: 'Demobageriet', title: 'Praktik' })])
    const kort = await screen.findByTestId('plats-koppling')
    expect(kort).toHaveTextContent('Nordfrakt AB finns under Platser men har inga arbetsplatspass i planen')
    expect(kort).toHaveTextContent('Planen har arbetsplatspass på ”Demobageriet”, men platsen finns inte under Platser')
    platser = []
  })
})
