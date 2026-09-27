/**
 * Rollspelet 2026-09-27 i konsulentens Aktivitet-flik.
 *
 * RK4: en passanteckning som skrevs efter markeringen följde bara med nästa
 * markering — stängde man panelen var den borta vid omladdning, utan varning.
 * RK1: ampeln kunde aldrig bli grön när veckomålet innehåller eget jobbsökande.
 * RK2: veckan varnar när schemat inte räcker till målet.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { screen, fireEvent, cleanup } from '@testing-library/react'
import { render } from '@/test/utils'
import { AktivitetsplanSektion } from './AktivitetsplanSektion'

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

describe('RK4: anteckning skriven efter markeringen', () => {
  it('sparas när panelen stängs, utan att markeringen görs om', async () => {
    const markerat = pass({ attendance: 'absent_valid', marked_by: 'c1' })
    const api = await montera(plan(), [markerat])
    vi.mocked(api.saveAttendanceNote).mockImplementation(async (id, note) => ({ ...markerat, id, attendance_note: note }) as never)

    const narvaro = screen.getByRole('button', { name: 'Närvaro' })
    fireEvent.click(narvaro)
    fireEvent.change(screen.getByLabelText('Anteckning'), { target: { value: 'Tandläkare, anmält i förväg per telefon.' } })
    expect(screen.getByText('Anteckningen är inte sparad')).toBeInTheDocument()

    fireEvent.click(narvaro) // stäng panelen
    await vi.waitFor(() => expect(api.saveAttendanceNote).toHaveBeenCalledWith('s1', 'Tandläkare, anmält i förväg per telefon.'))
    expect(api.markAttendance).not.toHaveBeenCalled()
    await vi.waitFor(() => expect(screen.queryByLabelText('Anteckning')).not.toBeInTheDocument())
  })

  it('visar ett fel och behåller texten när sparandet misslyckas', async () => {
    const api = await montera(plan(), [pass({ attendance: 'absent_valid' })])
    vi.mocked(api.saveAttendanceNote).mockRejectedValue(new Error('nätverket svarar inte'))

    const narvaro = screen.getByRole('button', { name: 'Närvaro' })
    fireEvent.click(narvaro)
    fireEvent.change(screen.getByLabelText('Anteckning'), { target: { value: 'Ringde in 08:15.' } })
    fireEvent.click(narvaro)

    expect(await screen.findByRole('alert')).toHaveTextContent('Anteckningen kunde inte sparas — texten finns kvar här.')
    expect(screen.getByLabelText('Anteckning')).toHaveValue('Ringde in 08:15.')
  })

  it('kan sparas med en egen knapp', async () => {
    const markerat = pass({ attendance: 'absent_invalid' })
    const api = await montera(plan(), [markerat])
    vi.mocked(api.saveAttendanceNote).mockImplementation(async (id, note) => ({ ...markerat, id, attendance_note: note }) as never)
    fireEvent.click(screen.getByRole('button', { name: 'Närvaro' }))
    fireEvent.change(screen.getByLabelText('Anteckning'), { target: { value: 'Kom inte, svarade inte i telefon.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Spara anteckning' }))
    await vi.waitFor(() => expect(api.saveAttendanceNote).toHaveBeenCalledWith('s1', 'Kom inte, svarade inte i telefon.'))
    await vi.waitFor(() => expect(screen.queryByText('Anteckningen är inte sparad')).not.toBeInTheDocument())
  })
})

describe('RK1 och RK2 i veckovyn', () => {
  const fyraPass = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24'].map((date, i) =>
    pass({ id: `a${i}`, date, attendance: 'present', activity_type: ['jobsearch', 'motivation', 'language', 'workplace'][i] }))

  it('full närvaro på en plan med eget jobbsökande i målet är "På veckomålet"', async () => {
    await montera(plan(), [...fyraPass, pass({ id: 'e1', date: '2026-09-25', start_time: '09:00', end_time: '12:00', activity_type: 'jobsearch_own' })])
    expect(screen.getByText('På veckomålet')).toBeInTheDocument()
    expect(screen.getByText('8 h / 8 h')).toBeInTheDocument()
    expect(screen.queryByText(/Veckan kan inte nå målet/)).not.toBeInTheDocument()
  })

  it('varnar när schemat inte räcker till målet (Omar: 40 h mål, 8 h anvisat)', async () => {
    await montera(plan({ weekly_hours_target: 40, jobsearch_hours_per_week: 5 }), fyraPass)
    expect(screen.getByText(/Schemat har 8 h anvisad aktivitet, men veckomålet kräver 35 h/)).toBeInTheDocument()
  })
})

// RR2 (rollspelet 2026-09-27): kommunens juridik syntes för en R&M-leverantör.
// Motprov: sätt arLeverantor = false → leverantörstestet faller.
describe('RR2: kundtypen styr planens fält', () => {
  const medlemskap = (kind: string) => [{ id: 'm1', org_id: 'org1', user_id: 'c1', role: 'chef', organization: { id: 'org1', name: 'X', kind } }]

  it('leverantören ser inte försörjningshinder, underlag till handläggaren eller socialnämnden', async () => {
    const { orgApi } = await import('@/services/orgApi')
    vi.mocked(orgApi.myMemberships).mockResolvedValue(medlemskap('leverantor') as never)
    await montera(plan({ org_id: 'org1' }), [])
    await vi.waitFor(() => expect(screen.getByText(/avvikelserapporteringen till Arbetsförmedlingen/)).toBeInTheDocument())
    expect(screen.queryByText('Försörjningshinder')).toBeNull()
    expect(screen.queryByText(/socialnämnden/)).toBeNull()
  })

  it('kommunen ser dem som förut', async () => {
    const { orgApi } = await import('@/services/orgApi')
    vi.mocked(orgApi.myMemberships).mockResolvedValue(medlemskap('kommun') as never)
    await montera(plan({ org_id: 'org1' }), [])
    expect(await screen.findByText('Försörjningshinder')).toBeInTheDocument()
    expect(screen.getByText(/socialnämnden/)).toBeInTheDocument()
  })
})
