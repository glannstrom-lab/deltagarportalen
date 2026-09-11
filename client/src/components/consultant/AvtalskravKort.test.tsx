/**
 * AvtalskravKort — aktivitetsloggen mot avtalskravet (RM4).
 * Klockan står på onsdag 12 nov 2026: senaste avslutade vecka slutar söndag 8 nov.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AvtalskravKort } from './AvtalskravKort'

const plan = (o: Record<string, unknown> = {}) => ({
  id: 'plan1', participant_id: 'p1', consultant_id: 'c1', org_id: null, template_id: null, template_name: null,
  start_date: '2026-10-05', end_date: null, weekly_hours_target: 30, jobsearch_hours_per_week: 0, target_reason: null,
  status: 'active', plan_text: null, decided_at: null, forsorjningshinder: null, nedsattning_underlag_lamnat_at: null,
  af_registered_at: null, created_at: '', updated_at: '', ...o,
})
const pass = (date: string, o: Record<string, unknown> = {}) => ({
  id: `s-${date}-${Math.random()}`, plan_id: 'plan1', participant_id: 'p1', date, start_time: '09:00', end_time: '10:00',
  title: 'Pass', activity_type: 'jobsearch', location: null, notes: null, attendance: 'present', attendance_note: null,
  sick_certificate_received: false, marked_by: null, marked_at: null, self_checkin_at: null, created_at: '', updated_at: '', ...o,
})

vi.mock('@/services/aktivitetApi', () => ({
  aktivitetsplanApi: { listAll: vi.fn(), listSessionsBetween: vi.fn() },
}))
vi.mock('@/pages/consultant/consultantParticipantsQuery', () => ({
  fetchCachedConsultantParticipants: vi.fn(async () => [
    { participant_id: 'p1', first_name: 'Anna', last_name: 'Andersson' },
    { participant_id: 'p2', first_name: 'Bo', last_name: 'Berg' },
  ]),
}))

function renderMedQuery() {
  const qc = new QueryClient()
  return render(<QueryClientProvider client={qc}><AvtalskravKort /></QueryClientProvider>)
}

async function mocka(plans: unknown[], sessions: unknown[]) {
  const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
  vi.mocked(aktivitetsplanApi.listAll).mockResolvedValue(plans as never)
  vi.mocked(aktivitetsplanApi.listSessionsBetween).mockResolvedValue(sessions as never)
  return aktivitetsplanApi
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 12, 10, 0, 0)) // onsdag 12 nov 2026
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers() })

describe('AvtalskravKort', () => {
  it('visar laddning först, sedan en rad per plan med veckor, andel fysiska och krav', async () => {
    const api = await mocka(
      [plan(), plan({ id: 'plan2', participant_id: 'p2', start_date: '2026-11-03' })],
      [
        // Anna: vecka 26 okt–1 nov (hör till november eftersom den överlappar) 1 h, vecka 2–8 nov 0 h
        pass('2026-10-27', { activity_type: 'workplace' }),
        // Bo: vecka 2–8 nov 2 h fördelat på två pass, ett fysiskt
        pass('2026-11-04', { plan_id: 'plan2', participant_id: 'p2', location: 'Jobbcenter' }),
        pass('2026-11-05', { plan_id: 'plan2', participant_id: 'p2', attendance: 'external' }),
      ],
    )
    renderMedQuery()
    expect(screen.getByText('Räknar aktivitetsloggen…')).toBeInTheDocument()
    expect(await screen.findByText('Anna Andersson')).toBeInTheDocument()
    // Hela veckorna runt november hämtas: måndag 26 okt – söndag 6 dec.
    expect(api.listSessionsBetween).toHaveBeenCalledWith('2026-10-26', '2026-12-06')
    // Bara avslutade veckor: 1 nov – 8 nov.
    expect(screen.getByText(/Avslutade veckor 1 november 2026 – 8 november 2026/)).toBeInTheDocument()

    const anna = screen.getByText('Anna Andersson').closest('tr')!
    expect(anna).toHaveTextContent('1 av 2')
    expect(anna).toHaveTextContent('100 % (1 av 1 pass)')
    expect(anna).toHaveTextContent('1 h/vecka (månad 1)') // månad 2 börjar 5 nov; veckans måndag 2 nov avgör
    expect(anna).toHaveTextContent('timkravet är inte uppfyllt alla veckor')

    const bo = screen.getByText('Bo Berg').closest('tr')!
    expect(bo).toHaveTextContent('1 av 1')
    expect(bo).toHaveTextContent('50 % (1 av 2 pass)')
    expect(bo).not.toHaveTextContent('under 50 %')
  })

  it('markerar andel under 50 % och visar — utan närvaropass, aldrig 0 %', async () => {
    await mocka(
      [plan(), plan({ id: 'plan2', participant_id: 'p2' })],
      [
        pass('2026-11-03'), pass('2026-11-04'), pass('2026-11-05', { activity_type: 'workplace' }),
        pass('2026-11-03', { plan_id: 'plan2', participant_id: 'p2', attendance: 'absent_invalid', activity_type: 'workplace' }),
      ],
    )
    renderMedQuery()
    const anna = (await screen.findByText('Anna Andersson')).closest('tr')!
    expect(anna).toHaveTextContent('33 % (1 av 3 pass)')
    expect(anna).toHaveTextContent('under 50 %')
    const bo = screen.getByText('Bo Berg').closest('tr')!
    expect(bo).toHaveTextContent('inget närvaropass i perioden')
    expect(bo).not.toHaveTextContent('0 %')
    expect(bo).toHaveTextContent('0 av 2')
  })

  it('säger att ingen plan var aktiv när planerna ligger utanför månaden', async () => {
    await mocka([plan({ start_date: '2026-12-01' })], [])
    renderMedQuery()
    expect(await screen.findByText(/Ingen plan var aktiv i en avslutad vecka i november 2026/)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('byter månad och hämtar om; en månad utan avslutad vecka bedöms inte', async () => {
    const api = await mocka([plan()], [pass('2026-10-06')])
    renderMedQuery()
    await screen.findByText('Anna Andersson')
    fireEvent.change(screen.getByLabelText('Månad'), { target: { value: '2026-10' } })
    expect(await screen.findByText(/Avslutade veckor 1 oktober 2026 – 31 oktober 2026/)).toBeInTheDocument()
    expect(api.listSessionsBetween).toHaveBeenLastCalledWith('2026-09-28', '2026-11-01')
    expect((await screen.findByText('Anna Andersson')).closest('tr')).toHaveTextContent('1 av 4')
  })

  it('visar fel med försök igen när hämtningen faller', async () => {
    const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
    vi.mocked(aktivitetsplanApi.listAll).mockRejectedValueOnce(new Error('RLS sa nej'))
    vi.mocked(aktivitetsplanApi.listSessionsBetween).mockResolvedValue([] as never)
    renderMedQuery()
    expect(await screen.findByText('Aktivitetsloggen kunde inte hämtas')).toBeInTheDocument()
    expect(screen.getByText('RLS sa nej')).toBeInTheDocument()
    vi.mocked(aktivitetsplanApi.listAll).mockResolvedValue([] as never)
    fireEvent.click(screen.getByRole('button', { name: /försök igen/i }))
    expect(await screen.findByText(/Ingen plan var aktiv/)).toBeInTheDocument()
  })
})
