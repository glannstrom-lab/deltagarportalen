/**
 * Rollspelet 2026-09-27, Aktivitet-fliken EFTER PENDING_20260927d_plan_och_pass
 * (konstanten mockad till true):
 *   RK40  ärendenummer på planen — personnummer nekas
 *   RK37  ändra ett pass och alla kommande i serien; lägg in en plats ur Platser
 *   RR27  märkningen fysisk/digital och leverantörsledd/egen i "Lägg till pass"
 *   RR28  leverantörens avvikelserapport med "AF underrättad"
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { screen, fireEvent, cleanup, within } from '@testing-library/react'
import { render } from '@/test/utils'
import { AktivitetsplanSektion } from './AktivitetsplanSektion'

let platser: unknown[] = []
const plan = (o: Record<string, unknown> = {}) => ({
  id: 'plan1', participant_id: 'p1', consultant_id: 'c1', org_id: null, template_id: 't1', template_name: 'Demomall',
  start_date: '2026-09-21', end_date: '2026-12-13', weekly_hours_target: 11, jobsearch_hours_per_week: 3, target_reason: null,
  status: 'active', plan_text: null, decided_at: '2026-09-18', forsorjningshinder: null, nedsattning_underlag_lamnat_at: null, af_registered_at: null,
  case_reference: null, created_at: '', updated_at: '', ...o,
})
const pass = (o: Record<string, unknown>) => ({
  id: 's1', plan_id: 'plan1', participant_id: 'p1', date: '2026-09-29', start_time: '09:00', end_time: '11:00', title: 'Jobbsökarverkstad',
  activity_type: 'jobsearch', location: 'Rum 3', notes: null, attendance: null, attendance_note: null, sick_certificate_received: false,
  marked_by: null, marked_at: null, self_checkin_at: null, created_at: '', updated_at: '', ...o,
})

vi.mock('@/services/planMarkning', async (orig) => ({ ...(await orig<typeof import('@/services/planMarkning')>()), PLAN_PASS_KOLUMNER_FINNS: true }))
vi.mock('@/services/aktivitetApi', () => ({
  aktivitetsplanApi: {
    getForParticipant: vi.fn(),
    listAllSessions: vi.fn(),
    markAttendance: vi.fn(),
    saveAttendanceNote: vi.fn(),
    end: vi.fn(),
    addSession: vi.fn(async () => ({})),
    addWeeklySessions: vi.fn(async () => []),
    addSessionsOnDates: vi.fn(async (_p: string, _d: string, _i: unknown, datum: string[]) => datum.map((d) => ({ date: d }))),
    updateSessions: vi.fn(async (ids: string[]) => ids.map((id) => ({ id }))),
    sattArendenummer: vi.fn(),
    sattAfUnderrattad: vi.fn(),
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
  platser = []
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 28, 14, 0, 0)) // måndag 28 sep 2026
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

describe('RK40: ärendenummer på planen', () => {
  it('nekar ett personnummer utan att spara och sparar ett ärendenummer', async () => {
    const api = await montera(plan(), [])
    vi.mocked(api.sattArendenummer).mockImplementation(async (_id, v) => plan({ case_reference: v }) as never)
    const rad = screen.getByTestId('rad-arende')
    expect(rad).toHaveTextContent('Ärendenummer i verksamhetssystemet')
    expect(rad).toHaveTextContent('inte angivet')
    fireEvent.click(within(rad).getByRole('button', { name: 'Ange' }))
    const falt = within(rad).getByLabelText('Ärendenummer i verksamhetssystemet')
    fireEvent.change(falt, { target: { value: '850101-1234' } })
    fireEvent.click(within(rad).getByRole('button', { name: 'Spara' }))
    expect(await within(rad).findByRole('alert')).toHaveTextContent(/personnummer/)
    expect(api.sattArendenummer).not.toHaveBeenCalled()
    fireEvent.change(falt, { target: { value: ' KS-2026/0042 ' } })
    fireEvent.click(within(rad).getByRole('button', { name: 'Spara' }))
    await vi.waitFor(() => expect(api.sattArendenummer).toHaveBeenCalledWith('plan1', 'KS-2026/0042'))
    expect(await within(rad).findByText('KS-2026/0042')).toBeInTheDocument()
  })

  it('leverantören får AF:s ärende-id som etikett', async () => {
    const { orgApi } = await import('@/services/orgApi')
    vi.mocked(orgApi.myMemberships).mockResolvedValue([{ id: 'm1', org_id: 'org1', user_id: 'c1', role: 'chef', organization: { id: 'org1', name: 'X', kind: 'leverantor' } }] as never)
    await montera(plan({ org_id: 'org1', case_reference: 'A-778899' }), [])
    await vi.waitFor(() => expect(screen.getByTestId('rad-arende')).toHaveTextContent('Ärende-id hos Arbetsförmedlingen'))
    expect(screen.getByTestId('rad-arende')).toHaveTextContent('A-778899')
  })
})

describe('RK37: ändra ett pass och alla kommande i serien', () => {
  it('ändrar passet och de senare omarkerade passen i serien — aldrig det markerade', async () => {
    const serie = [
      pass({ id: 'a', date: '2026-09-29' }),
      pass({ id: 'b', date: '2026-10-06', attendance: 'present' }),
      pass({ id: 'c', date: '2026-10-13' }),
      pass({ id: 'd', date: '2026-10-14' }),
    ]
    const api = await montera(plan(), serie)
    fireEvent.click(screen.getByRole('button', { name: /Ändra Jobbsökarverkstad 29 sep/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByLabelText(/Det här och alla kommande i serien \(2 pass, det sista 13 okt\)/))
    fireEvent.change(within(dialog).getByLabelText('Start'), { target: { value: '10:00' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Ändra 2 pass' }))
    await vi.waitFor(() => expect(api.updateSessions).toHaveBeenCalledTimes(1))
    const [ids, andring, extra] = vi.mocked(api.updateSessions).mock.calls[0]
    expect(ids).toEqual(['a', 'c'])
    expect(andring).toMatchObject({ start_time: '10:00', end_time: '11:00', title: 'Jobbsökarverkstad', location: 'Rum 3' })
    // Märkningen rördes inte — ett omärkt pass får inte härledningen inskriven.
    expect(extra).toEqual({})
  })

  it('"bara det här passet" är förvalt', async () => {
    const api = await montera(plan(), [pass({ id: 'a' }), pass({ id: 'c', date: '2026-10-06' })])
    fireEvent.click(screen.getByRole('button', { name: /Ändra Jobbsökarverkstad 29 sep/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Form'), { target: { value: 'digitalt' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Spara' }))
    await vi.waitFor(() => expect(api.updateSessions).toHaveBeenCalledWith(['a'], expect.anything(), { is_provider_led: true, is_physical: false }))
  })
})

describe('RR27: märkningen när ett pass läggs till', () => {
  it('förväljs ur typ och plats och går att ändra', async () => {
    const api = await montera(plan(), [])
    fireEvent.click(screen.getByRole('button', { name: 'Lägg till pass' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Rubrik'), { target: { value: 'Digital verkstad' } })
    fireEvent.change(within(dialog).getByLabelText('Plats'), { target: { value: 'Rum 3' } })
    expect(within(dialog).getByLabelText('Form')).toHaveValue('fysiskt')
    fireEvent.change(within(dialog).getByLabelText('Form'), { target: { value: 'digitalt' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lägg till' }))
    await vi.waitFor(() => expect(api.addSession).toHaveBeenCalledWith('plan1', 'p1', expect.objectContaining({ title: 'Digital verkstad' }), { is_provider_led: true, is_physical: false }))
  })

  it('passet visar sin märkning och säger när den är härledd', async () => {
    await montera(plan(), [pass({ id: 'a' }), pass({ id: 'b', date: '2026-09-30', is_physical: false, is_provider_led: true })])
    const markningar = screen.getAllByTestId('pass-markning').map((e) => e.textContent)
    expect(markningar).toEqual(['Verksamheten · fysiskt (härlett)', 'Verksamheten · digitalt'])
  })
})

describe('RK37: platsen ur Platser in i planen', () => {
  it('lägger arbetsplatspass på valda veckodagar, kopplade till platsen', async () => {
    platser = [{ id: 'w1', company_name: 'Nordfrakt AB', status: 'pagaende', start_date: '2026-10-05', end_date: '2026-10-18', hours_per_week: 30, placement_type: 'praktik' }]
    const api = await montera(plan(), [])
    fireEvent.click(await screen.findByRole('button', { name: /Lägg in i planen/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByLabelText('Mån'))
    fireEvent.click(within(dialog).getByLabelText('Ons'))
    expect(within(dialog).getByText(/4 pass, 8 h\/vecka mot 30 h\/vecka under Platser/)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lägg in 4 pass' }))
    await vi.waitFor(() => expect(api.addSessionsOnDates).toHaveBeenCalledTimes(1))
    const [planId, deltagare, input, datum, extra] = vi.mocked(api.addSessionsOnDates).mock.calls[0]
    expect([planId, deltagare]).toEqual(['plan1', 'p1'])
    expect(input).toMatchObject({ activity_type: 'workplace', title: 'Nordfrakt AB', location: 'Nordfrakt AB' })
    expect(datum).toEqual(['2026-10-05', '2026-10-07', '2026-10-12', '2026-10-14'])
    expect(extra).toEqual({ work_placement_id: 'w1', is_physical: true, is_provider_led: true })
  })
})

describe('RR28: leverantörens avvikelserapport', () => {
  it('visar avvikelserna med orsak och markerar AF som underrättad', async () => {
    const { orgApi } = await import('@/services/orgApi')
    vi.mocked(orgApi.myMemberships).mockResolvedValue([{ id: 'm1', org_id: 'org1', user_id: 'c1', role: 'chef', organization: { id: 'org1', name: 'X', kind: 'leverantor' } }] as never)
    const franvaro = pass({ id: 'f1', date: '2026-09-22', attendance: 'absent_invalid', attendance_note: 'Kom inte' })
    const api = await montera(plan({ org_id: 'org1' }), [franvaro])
    vi.mocked(api.sattAfUnderrattad).mockImplementation(async (id, nar) => ({ ...franvaro, id, af_notified_at: nar }) as never)
    const kort = await screen.findByTestId('avvikelserapport')
    expect(kort).toHaveTextContent('22 sep · Ogiltig frånvaro')
    expect(kort).toHaveTextContent('Orsak: Kom inte')
    expect(kort).toHaveTextContent('AF inte underrättad')
    expect(kort).toHaveTextContent('Portalen skickar ingenting till Arbetsförmedlingen')
    fireEvent.click(within(kort).getByRole('button', { name: 'Markera som underrättad' }))
    await vi.waitFor(() => expect(api.sattAfUnderrattad).toHaveBeenCalledWith('f1', expect.stringMatching(/^2026-09-28T/)))
    expect(await within(kort).findByText(/AF underrättad 28 sep/)).toBeInTheDocument()
  })

  it('kommunen ser ingen avvikelserapport', async () => {
    const { orgApi } = await import('@/services/orgApi')
    vi.mocked(orgApi.myMemberships).mockResolvedValue([{ id: 'm1', org_id: 'org1', user_id: 'c1', role: 'chef', organization: { id: 'org1', name: 'X', kind: 'kommun' } }] as never)
    await montera(plan({ org_id: 'org1' }), [pass({ attendance: 'absent_invalid' })])
    await vi.waitFor(() => expect(screen.getByTestId('rad-forsorjningshinder')).toBeInTheDocument())
    expect(screen.queryByTestId('avvikelserapport')).toBeNull()
  })
})
