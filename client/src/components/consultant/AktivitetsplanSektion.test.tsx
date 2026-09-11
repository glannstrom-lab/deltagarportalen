/**
 * AktivitetsplanSektion — tomtillstånd, närvaro och saldo (KM3/KM4/KM6).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { screen, fireEvent, cleanup } from '@testing-library/react'
// JobbsokTidKort (KM9) läser QueryClient — den delade rendern ger en.
import { render } from '@/test/utils'
import { AktivitetsplanSektion } from './AktivitetsplanSektion'

const plan = {
  id: 'plan1', participant_id: 'p1', consultant_id: 'c1', org_id: null, template_id: 't1', template_name: 'Verkstad 30 h',
  start_date: '2026-10-05', end_date: '2026-12-27', weekly_hours_target: 30, jobsearch_hours_per_week: 5, target_reason: null,
  status: 'active', plan_text: null, decided_at: '2026-10-01', forsorjningshinder: null, nedsattning_underlag_lamnat_at: null, created_at: '', updated_at: '',
}
const pass = (o: Record<string, unknown>) => ({
  id: 's1', plan_id: 'plan1', participant_id: 'p1', date: '2026-10-05', start_time: '09:00', end_time: '12:00', title: 'Jobbsökarverkstad',
  activity_type: 'jobsearch', location: 'Hjernet', notes: null, attendance: null, attendance_note: null, sick_certificate_received: false,
  marked_by: null, marked_at: null, self_checkin_at: null, created_at: '', updated_at: '', ...o,
})

vi.mock('@/services/aktivitetApi', () => ({
  aktivitetsplanApi: {
    getForParticipant: vi.fn(),
    listAllSessions: vi.fn(),
    markAttendance: vi.fn(),
    end: vi.fn(),
    addSession: vi.fn(),
    removeSession: vi.fn(),
    update: vi.fn(),
  },
  schemamallApi: { list: vi.fn(async () => []) },
  FORSORJNINGSHINDER: ['arbetslos', 'sjukskriven_med_intyg', 'sjuk_eller_aktivitetsersattning', 'arbetshinder_sociala_skal', 'foraldraledig', 'arbetar_deltid', 'sprakhinder', 'utan_forsorjningshinder', 'annat'],
  FORSORJNINGSHINDER_ETIKETT: { arbetslos: 'Arbetslös', sjukskriven_med_intyg: 'Sjukskriven med läkarintyg', sjuk_eller_aktivitetsersattning: 'Sjuk- eller aktivitetsersättning', arbetshinder_sociala_skal: 'Arbetshinder, sociala skäl', foraldraledig: 'Föräldraledig', arbetar_deltid: 'Arbetar deltid', sprakhinder: 'Språkhinder', utan_forsorjningshinder: 'Utan försörjningshinder', annat: 'Annat' },
}))
vi.mock('@/components/ui/ConfirmDialog', () => ({ useConfirmDialog: () => ({ confirm: vi.fn(async () => true) }) }))
vi.mock('@/services/aktivitetsplanPdf', () => ({ downloadAktivitetsplanPDF: vi.fn(async () => undefined) }))
vi.mock('@/services/jobbsokAktivitet', () => ({ jobbsokAktivitetApi: { deltagarensJobbsok: vi.fn(async () => null) } }))
vi.mock('@/pages/consultant/consultantParticipantsQuery', () => ({ fetchCachedConsultantParticipants: vi.fn(async () => []) }))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 7, 10, 0, 0)) // onsdag 7 okt 2026
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers() })

describe('AktivitetsplanSektion', () => {
  it('visar EmptyState med EN väg vidare när planen saknas', async () => {
    const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
    vi.mocked(aktivitetsplanApi.getForParticipant).mockResolvedValue(null)
    render(<AktivitetsplanSektion participantId="p1" participantName="Anna Andersson" />)
    expect(await screen.findByText('Ingen aktivitetsplan än')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tillämpa schemamall' })).toBeInTheDocument()
    expect(aktivitetsplanApi.listAllSessions).not.toHaveBeenCalled()
  })

  it('visar saldo och markerar ogiltig frånvaro via API:t', async () => {
    const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
    vi.mocked(aktivitetsplanApi.getForParticipant).mockResolvedValue(plan as never)
    vi.mocked(aktivitetsplanApi.listAllSessions).mockResolvedValue([
      pass({ id: 's1', attendance: 'present' }),
      pass({ id: 's2', date: '2026-10-07', start_time: '13:00', end_time: '16:00', title: 'Språkcafé', activity_type: 'language' }),
    ] as never)
    vi.mocked(aktivitetsplanApi.markAttendance).mockImplementation(async (id, input) => pass({ id, date: '2026-10-07', attendance: input.attendance }) as never)

    render(<AktivitetsplanSektion participantId="p1" participantName="Anna Andersson" />)
    expect(await screen.findByText('Verkstad 30 h')).toBeInTheDocument()
    // Saldo: 6 h planerat av 30, 3 h närvaro
    expect(screen.getByText('6 h / 30 h')).toBeInTheDocument()
    expect(screen.getByText('Under veckomålet')).toBeInTheDocument()
    expect(screen.getByText(/Beslut om nedsättning fattas av socialnämnden/)).toBeInTheDocument()

    // Öppna närvaro på språkcaféet och markera ogiltig frånvaro
    const knappar = screen.getAllByRole('button', { name: 'Närvaro' })
    fireEvent.click(knappar[1])
    fireEvent.click(screen.getByRole('button', { name: 'Ogiltig frånvaro' }))
    await vi.waitFor(() => expect(aktivitetsplanApi.markAttendance).toHaveBeenCalledWith('s2', expect.objectContaining({ attendance: 'absent_invalid' })))
    expect(await screen.findByText('Ogiltig frånvaro i veckan')).toBeInTheDocument()
    expect(screen.getByText('1 pass')).toBeInTheDocument()
  })

  it('visar — i saldot när veckan saknar pass', async () => {
    const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
    vi.mocked(aktivitetsplanApi.getForParticipant).mockResolvedValue(plan as never)
    vi.mocked(aktivitetsplanApi.listAllSessions).mockResolvedValue([pass({ date: '2026-10-19' })] as never)
    render(<AktivitetsplanSektion participantId="p1" participantName="Anna" />)
    expect(await screen.findByText('Inga pass den här veckan')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3)
    expect(screen.queryByText(/0 h \//)).not.toBeInTheDocument()
  })

  it('sparar försörjningshinder, markerar underlag lämnat och laddar ner plan-PDF (KM5/KM7)', async () => {
    const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
    const { downloadAktivitetsplanPDF } = await import('@/services/aktivitetsplanPdf')
    vi.mocked(aktivitetsplanApi.getForParticipant).mockResolvedValue(plan as never)
    vi.mocked(aktivitetsplanApi.listAllSessions).mockResolvedValue([pass({})] as never)
    vi.mocked(aktivitetsplanApi.update).mockImplementation(async (_id, patch) => ({ ...plan, ...patch }) as never)

    render(<AktivitetsplanSektion participantId="p1" participantName="Anna Andersson" />)
    await screen.findByText('Verkstad 30 h')

    fireEvent.change(screen.getByLabelText('Försörjningshinder'), { target: { value: 'arbetslos' } })
    await vi.waitFor(() => expect(aktivitetsplanApi.update).toHaveBeenCalledWith('plan1', { forsorjningshinder: 'arbetslos' }))

    fireEvent.click(screen.getByRole('button', { name: 'Underlag lämnat till handläggaren' }))
    await vi.waitFor(() => expect(aktivitetsplanApi.update).toHaveBeenCalledWith('plan1', { nedsattning_underlag_lamnat_at: '2026-10-07' }))
    expect(await screen.findByText(/Lämnat 7 oktober 2026/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Plan som PDF' }))
    await vi.waitFor(() => expect(downloadAktivitetsplanPDF).toHaveBeenCalledWith(expect.objectContaining({ participantName: 'Anna Andersson', plan: expect.objectContaining({ id: 'plan1' }) })))
  })
})
