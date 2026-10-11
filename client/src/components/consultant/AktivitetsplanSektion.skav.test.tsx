/**
 * SKAV-fynden i konsulentens Aktivitet-flik, rollspelet 2026-09-27.
 *  RK25/RR19: Försörjningshinder-väljaren låg i en halv kolumn och växte in
 *             över "Underlag till handläggaren"; "Avsluta plan" saknade mörk färg.
 *  RK26:      "1 pass i veckan är inte markerade", "CV uppdaterat 27 sep..".
 *  RK27:      "Vecka 21 sep – 27 sep" utan veckonummer.
 *  RK28:      nytt pass förifylldes med veckans passerade måndag, inget "upprepa".
 *  RK30:      "Lagen kräver intyg vid sjukfrånvaro" — utan källa, och inte sant generellt.
 *  RR15:      journalvarningen sa "att hon läser" även om män.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { screen, fireEvent, cleanup, within, render as rtlRender } from '@testing-library/react'
import { render } from '@/test/utils'
import { AktivitetsplanSektion } from './AktivitetsplanSektion'
import { cvRad, omarkeradeText } from './aktivitetEtiketter'
import { ParticipantJournal } from './ParticipantJournal'

const plan = (o: Record<string, unknown> = {}) => ({
  id: 'plan1', participant_id: 'p1', consultant_id: 'c1', org_id: null, template_id: 't1', template_name: 'Demomall',
  start_date: '2026-09-21', end_date: '2026-10-18', weekly_hours_target: 11, jobsearch_hours_per_week: 3, target_reason: null,
  status: 'active', plan_text: null, decided_at: '2026-09-18', forsorjningshinder: null, nedsattning_underlag_lamnat_at: null, af_registered_at: null, created_at: '', updated_at: '', ...o,
})
const pass = (o: Record<string, unknown>) => ({
  id: 's1', plan_id: 'plan1', participant_id: 'p1', date: '2026-09-22', start_time: '09:00', end_time: '11:00', title: 'Jobbsökarverkstad',
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
    addSession: vi.fn(async () => ({})),
    addWeeklySessions: vi.fn(async () => [{}, {}, {}, {}]),
    removeSession: vi.fn(),
    update: vi.fn(),
  },
  underlagApi: { list: vi.fn(async () => []), listIPeriod: vi.fn(async () => []), lamna: vi.fn(), angra: vi.fn() },
  kanAngraUnderlag: () => false,
  sammanfattaNarvaro: () => ({ pass: 0, present: 0, absent_valid: 0, absent_invalid: 0, sick_certified: 0, sjuk_utan_intyg: 0, external: 0, omarkerade: 0, anmald_franvaro: 0 }),
  schemamallApi: { list: vi.fn(async () => []) },
  FORSORJNINGSHINDER: ['arbetslos'],
  FORSORJNINGSHINDER_ETIKETT: { arbetslos: 'Arbetslös' },
}))
vi.mock('@/components/ui/ConfirmDialog', () => ({ useConfirmDialog: () => ({ confirm: vi.fn(async () => true) }) }))
vi.mock('@/services/aktivitetsplanPdf', () => ({ downloadAktivitetsplanPDF: vi.fn(async () => undefined) }))
vi.mock('@/services/orgApi', () => ({ orgApi: { myMemberships: vi.fn(async () => []) } }))
vi.mock('@/services/jobbsokAktivitet', () => ({ jobbsokAktivitetApi: { deltagarensJobbsok: vi.fn(async () => null) } }))
vi.mock('@/pages/consultant/consultantParticipantsQuery', () => ({ fetchCachedConsultantParticipants: vi.fn(async () => []) }))
vi.mock('@/lib/toast', () => ({ notifications: { success: vi.fn(), error: vi.fn() } }))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 24, 14, 0, 0)) // torsdag 24 sep 2026, vecka 39
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

// Omtaget 2026-10-11: försörjningshinder och underlag står i högerspalten, var
// för sig, och väljaren kan aldrig bli bredare än spalten. "Avsluta plan" ligger
// i deltagarsidans Mer-meny, sist och i varningsfärg (DeltagarHuvud.test.tsx).
describe('RK25/RR19 — planens fält i högerspalten', () => {
  it('försörjningshinder och underlag har egna ytor i spalten, och väljaren är spaltens bredd', async () => {
    await montera(plan(), [])
    const spalt = screen.getByRole('complementary', { name: 'Underlag och plan' })
    expect(within(spalt).getByTestId('rad-forsorjningshinder')).toBeInTheDocument()
    expect(within(spalt).getByTestId('rad-underlag')).toBeInTheDocument()
    const valjare = screen.getByLabelText('Försörjningshinder')
    expect(valjare.className).toContain('w-full')
    expect(valjare.className).toContain('max-w-full')
  })
  it('sektionen har ingen egen "Avsluta plan" bredvid de vardagliga knapparna', async () => {
    await montera(plan(), [])
    expect(screen.queryByRole('button', { name: 'Avsluta plan' })).toBeNull()
  })
})

describe('RK26 — böjning', () => {
  it('ett pass är "markerat", flera är "markerade"', async () => {
    expect(omarkeradeText(1)).toBe('1 pass i veckan är inte markerat än.')
    expect(omarkeradeText(3)).toBe('3 pass i veckan är inte markerade än.')
    await montera(plan(), [pass({})])
    expect(screen.getByText(/1 pass i veckan är inte markerat än\./)).toBeInTheDocument()
  })
  it('CV-datumet får en punkt, inte två', () => {
    expect(cvRad(true, '2026-09-27T10:00:00')).toBe('CV uppdaterat 27 sep.')
    expect(cvRad(false, null)).toBe('Inget CV skapat än.')
  })
})

describe('RK27 — veckonummer', () => {
  it('veckan heter "Vecka 39 · 21–27 sep"', async () => {
    await montera(plan(), [])
    expect(screen.getByRole('heading', { name: 'Vecka 39 · 21–27 sep' })).toBeInTheDocument()
  })
})

describe('RK28 — Lägg till pass', () => {
  it('förifyller dagens datum, inte veckans passerade måndag', async () => {
    await montera(plan(), [])
    fireEvent.click(screen.getByRole('button', { name: 'Lägg till pass' }))
    expect(screen.getByLabelText('Datum')).toHaveValue('2026-09-24')
  })
  it('kan upprepas varje vecka till planens slut', async () => {
    const api = await montera(plan(), [])
    fireEvent.click(screen.getByRole('button', { name: 'Lägg till pass' }))
    fireEvent.change(screen.getByLabelText('Rubrik'), { target: { value: 'Språkcafé' } })
    fireEvent.click(screen.getByLabelText(/Upprepa varje vecka till planens slut/))
    expect(screen.getByText('4 pass, det sista 15 okt.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Lägg till' }))
    await vi.waitFor(() => expect(api.addWeeklySessions).toHaveBeenCalledWith('plan1', 'p1', expect.objectContaining({ date: '2026-09-24', title: 'Språkcafé' }), '2026-10-18', expect.anything()))
    expect(api.addSession).not.toHaveBeenCalled()
  })
  it('utan slutdatum går det inte att upprepa, och det sägs varför', async () => {
    await montera(plan({ end_date: null }), [])
    fireEvent.click(screen.getByRole('button', { name: 'Lägg till pass' }))
    expect(screen.getByLabelText(/Upprepa varje vecka/)).toBeDisabled()
    expect(screen.getByText(/Planen har inget slutdatum/)).toBeInTheDocument()
  })
  it('de utökade typerna syns sedan migrationen (brytaren på)', async () => {
    await montera(plan(), [])
    fireEvent.click(screen.getByRole('button', { name: 'Lägg till pass' }))
    const typer = [...(screen.getByLabelText('Aktivitetstyp') as HTMLSelectElement).options].map((o) => o.textContent)
    expect(typer).toContain('SFI')
    expect(typer).toContain('Jobbsökande')
  })
})

describe('RK30 — intyg vid sjukfrånvaro', () => {
  it('påstår inte att lagen kräver intyg', async () => {
    await montera(plan(), [pass({})])
    fireEvent.click(screen.getByRole('button', { name: 'Anteckning' }))
    expect(screen.queryByText(/Lagen kräver intyg/)).toBeNull()
    expect(screen.getByText(/Om och från vilken dag intyg krävs följer er riktlinje/)).toBeInTheDocument()
  })
})

describe('RR15 — journalvarningen är könsneutral', () => {
  it('säger "deltagaren", inte "hon"', () => {
    rtlRender(
      <ParticipantJournal
        participantName="Jonas Demo"
        entries={[]}
        loadError={null}
        onRetryLoad={vi.fn()}
        onAddEntry={vi.fn(async () => ({ ok: true as const }))}
        onUpdateEntry={vi.fn(async () => ({ ok: true as const }))}
        onDeleteEntry={vi.fn(async () => ({ ok: true as const }))}
      />,
    )
    expect(screen.getByText(/Skriv inget du inte kan stå för att deltagaren läser\./)).toBeInTheDocument()
    expect(screen.queryByText(/att hon läser/)).toBeNull()
  })
})
