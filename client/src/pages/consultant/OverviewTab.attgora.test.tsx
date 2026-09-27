/**
 * Översikt — "Att göra i dag" kopplad till riktiga data (RK35/RR26,
 * rollspelet 2026-09-27).
 *
 *   · en kvittens i listan går genom aktivitetsplanApi.markAttendance och
 *     punkten försvinner utan att Översikten laddas om
 *   · leverantörens rad visas bara när organisationen är leverantör (regelverk)
 *   · "Boka fysiskt möte" öppnar mötesdialogen på rätt deltagare med fysiskt förvalt
 *   · pass i en kollegas plan blir ingen punkt (UPDATE-policyn skulle neka knappen)
 *
 * Motprov (körda): (1) ta bort `uppdateraPass(...)` i markeraPass → kvittenstestet
 * faller (punkten står kvar). (2) byt `=== 'leverantor'` mot `!== 'leverantor'`
 * → båda regelverkstesterna faller. (3) ta bort egnaPlanIds-filtret → kollegatestet faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from '@/i18n/config'

type Svar = { data: unknown; error: unknown }
function byggare(svar: Svar) {
  const b: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'neq', 'gt', 'gte', 'lte', 'lt', 'order', 'limit', 'range', 'in', 'or', 'not', 'is']) b[m] = vi.fn(() => b)
  b.then = (ok: (v: Svar) => unknown, fel?: (e: unknown) => unknown) => Promise.resolve(svar).then(ok, fel)
  return b
}
const tabeller = vi.hoisted(() => ({ svar: {} as Record<string, { data: unknown; error: unknown }> }))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'k1' } } })) },
    from: vi.fn((t: string) => byggare(tabeller.svar[t] ?? { data: [], error: null })),
  },
}))

const api = vi.hoisted(() => ({
  listSessionsBetween: vi.fn(),
  listAll: vi.fn(),
  markAttendance: vi.fn(),
  saveAttendanceNote: vi.fn(),
  myMemberships: vi.fn(),
  getMinaPlaceringar: vi.fn(),
  hamtaMoten: vi.fn(),
}))

vi.mock('@/services/aktivitetApi', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/aktivitetApi')>('@/services/aktivitetApi')
  return {
    ...faktisk,
    aktivitetsplanApi: {
      ...faktisk.aktivitetsplanApi,
      listSessionsBetween: api.listSessionsBetween,
      listAll: api.listAll,
      markAttendance: api.markAttendance,
      saveAttendanceNote: api.saveAttendanceNote,
    },
  }
})
vi.mock('@/services/orgApi', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/orgApi')>('@/services/orgApi')
  return { ...faktisk, orgApi: { ...faktisk.orgApi, myMemberships: api.myMemberships } }
})
vi.mock('@/services/consultantService', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/consultantService')>('@/services/consultantService')
  return { ...faktisk, consultantService: { ...faktisk.consultantService, getMinaPlaceringar: api.getMinaPlaceringar } }
})
vi.mock('@/services/moteskadens', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/moteskadens')>('@/services/moteskadens')
  return { ...faktisk, hamtaMotenForKonsulent: api.hamtaMoten }
})
vi.mock('@/components/consultant/DagensPass', () => ({ DagensPass: () => null }))
vi.mock('@/components/consultant/MeetingSchedulerDialog', () => ({
  MeetingSchedulerDialog: (p: { isOpen: boolean; preselectedParticipant?: { first_name: string }; forvaldTyp?: string }) =>
    p.isOpen ? <div data-testid="motesdialog">{p.preselectedParticipant?.first_name} · {p.forvaldTyp}</div> : null,
}))

import { OverviewTab } from './OverviewTab'

const lokal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const idag = lokal(new Date())

const egenRedovisning = {
  id: 's-egen', plan_id: 'plan-anna', participant_id: 'anna', date: idag, start_time: '08:00', end_time: '17:00',
  title: 'Eget jobbsökande', activity_type: 'jobsearch_own', attendance: null, attendance_note: null,
  sick_certificate_received: false, marked_by: null, marked_at: null, self_checkin_at: null, location: null,
}

function organisation(kind: 'kommun' | 'leverantor') {
  return [{ id: 'm1', org_id: 'o1', user_id: 'k1', role: 'chef', created_at: '', organization: { id: 'o1', name: 'Org', kind } }]
}

function rita() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <OverviewTab />
        </I18nextProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  tabeller.svar = {
    consultant_dashboard_participants: {
      data: [
        { participant_id: 'anna', email: 'a@x.se', first_name: 'Anna', last_name: 'Exempel', status: 'ACTIVE', has_cv: true, ats_score: 70, last_contact_at: new Date().toISOString(), last_login: null, saved_jobs_count: 0 },
        { participant_id: 'omar', email: 'o@x.se', first_name: 'Omar', last_name: 'Demo', status: 'ACTIVE', has_cv: true, ats_score: 70, last_contact_at: new Date().toISOString(), last_login: null, saved_jobs_count: 0 },
      ],
      error: null,
    },
  }
  api.listSessionsBetween.mockResolvedValue([egenRedovisning])
  api.listAll.mockResolvedValue([{ id: 'plan-anna', participant_id: 'anna', consultant_id: 'k1', status: 'active', start_date: '2026-01-05', end_date: null }])
  api.hamtaMoten.mockResolvedValue([])
  api.getMinaPlaceringar.mockResolvedValue([])
  api.myMemberships.mockResolvedValue(organisation('kommun'))
})

describe('Översikt — Att göra i dag', () => {
  it('Kvittera går genom markAttendance och punkten försvinner utan omladdning', async () => {
    api.markAttendance.mockResolvedValue({ ...egenRedovisning, attendance: 'present', marked_at: new Date().toISOString() })
    rita()
    const rubrik = await screen.findByRole('heading', { name: 'Att göra i dag' })
    const lista = rubrik.closest('section')!
    expect(within(lista).getByText(/^Egen redovisning .* väntar på kvittens$/)).toBeInTheDocument()
    fireEvent.click(within(lista).getByRole('button', { name: 'Kvittera' }))
    await waitFor(() => expect(api.markAttendance).toHaveBeenCalledWith('s-egen', { attendance: 'present', note: null, sickCertificateReceived: false }))
    await waitFor(() => expect(screen.queryByText(/väntar på kvittens$/)).not.toBeInTheDocument())
    expect(api.listSessionsBetween).toHaveBeenCalledTimes(1)
  })

  it('ett pass i en kollegas plan blir ingen punkt — knappen skulle nekas av databasen', async () => {
    api.listAll.mockResolvedValue([{ id: 'plan-anna', participant_id: 'anna', consultant_id: 'kollega', status: 'active', start_date: '2026-01-05', end_date: null }])
    rita()
    await screen.findByText('Snitt ATS-poäng')
    await waitFor(() => expect(api.listAll).toHaveBeenCalled())
    expect(screen.queryByText(/väntar på kvittens$/)).not.toBeInTheDocument()
  })

  it('en kommun ser ingen rad om avtalet med Arbetsförmedlingen', async () => {
    rita()
    await screen.findByRole('heading', { name: 'Att göra i dag' })
    await waitFor(() => expect(api.myMemberships).toHaveBeenCalled())
    expect(screen.queryByLabelText('Veckan mot avtalet')).not.toBeInTheDocument()
  })

  it('RR26: en leverantör ser veckan mot avtalet, och "Boka fysiskt möte" öppnar dialogen på rätt deltagare', async () => {
    api.myMemberships.mockResolvedValue(organisation('leverantor'))
    rita()
    const rad = await screen.findByLabelText('Veckan mot avtalet')
    expect(rad).toHaveTextContent('2 utan fysiskt möte')
    const omar = screen.getAllByText('Omar Demo').map((el) => el.closest('li')).find((li) => li && within(li).queryByRole('button', { name: 'Boka fysiskt möte' }))!
    fireEvent.click(within(omar).getByRole('button', { name: 'Boka fysiskt möte' }))
    expect(await screen.findByTestId('motesdialog')).toHaveTextContent('Omar · physical')
  })
})
