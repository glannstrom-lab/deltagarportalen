/**
 * IvoUnderlagSektion — kvartalsunderlag + AF-checklista (KM7).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { IvoUnderlagSektion } from './IvoUnderlagSektion'

const plan = (o: Record<string, unknown>) => ({
  id: 'plan1', participant_id: 'p1', consultant_id: 'c1', org_id: null, template_id: 't1', template_name: 'Verkstad',
  start_date: '2026-10-05', end_date: null, weekly_hours_target: 30, jobsearch_hours_per_week: 0, target_reason: null,
  status: 'active', plan_text: null, decided_at: null, forsorjningshinder: 'arbetslos', nedsattning_underlag_lamnat_at: null,
  created_at: '', updated_at: '', ...o,
})

vi.mock('@/services/aktivitetApi', () => ({
  aktivitetsplanApi: { listAll: vi.fn(), listSessionsBetween: vi.fn(), update: vi.fn() },
  FORSORJNINGSHINDER: ['arbetslos', 'sjukskriven_med_intyg', 'sjuk_eller_aktivitetsersattning', 'arbetshinder_sociala_skal', 'foraldraledig', 'arbetar_deltid', 'sprakhinder', 'utan_forsorjningshinder', 'annat'],
  FORSORJNINGSHINDER_ETIKETT: { arbetslos: 'Arbetslös', sjukskriven_med_intyg: 'Sjukskriven med läkarintyg', sjuk_eller_aktivitetsersattning: 'Sjuk- eller aktivitetsersättning', arbetshinder_sociala_skal: 'Arbetshinder, sociala skäl', foraldraledig: 'Föräldraledig', arbetar_deltid: 'Arbetar deltid', sprakhinder: 'Språkhinder', utan_forsorjningshinder: 'Utan försörjningshinder', annat: 'Annat' },
}))
vi.mock('@/pages/consultant/consultantParticipantsQuery', () => ({
  fetchCachedConsultantParticipants: vi.fn(async () => [{ participant_id: 'p1', first_name: 'Anna', last_name: 'Andersson' }]),
}))

function renderMedQuery() {
  const qc = new QueryClient()
  return render(<QueryClientProvider client={qc}><IvoUnderlagSektion /></QueryClientProvider>)
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 12, 10, 0, 0)) // 12 nov 2026 → Q4
  localStorage.clear()
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers() })

describe('IvoUnderlagSektion', () => {
  it('räknar innevarande kvartal per försörjningshinder och visar AF-checklistan med namn', async () => {
    const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
    vi.mocked(aktivitetsplanApi.listAll).mockResolvedValue([plan({}), plan({ id: 'plan2', participant_id: 'p2', forsorjningshinder: null })] as never)
    vi.mocked(aktivitetsplanApi.listSessionsBetween).mockResolvedValue([
      { plan_id: 'plan1', date: '2026-10-06', attendance: 'absent_invalid' },
    ] as never)

    renderMedQuery()
    expect(await screen.findByText('Arbetslös')).toBeInTheDocument()
    expect(aktivitetsplanApi.listSessionsBetween).toHaveBeenCalledWith('2026-10-01', '2026-12-31')
    const arbetslos = screen.getByText('Arbetslös').closest('tr')!
    expect(arbetslos).toHaveTextContent('Arbetslös110')
    expect(screen.getByText('Ej angivet').closest('tr')).toHaveTextContent('Ej angivet100')
    expect(screen.getByText('Summa').closest('tr')).toHaveTextContent('Summa210')
    // AF-checklistan
    expect(screen.getByLabelText(/Anna Andersson/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Deltagare p2/)).toBeInTheDocument()
  })

  it('sparar AF-registreringen på planen med dagens datum, och nollar den vid avbock', async () => {
    const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
    vi.mocked(aktivitetsplanApi.listAll).mockResolvedValue([plan({})] as never)
    vi.mocked(aktivitetsplanApi.listSessionsBetween).mockResolvedValue([] as never)
    vi.mocked(aktivitetsplanApi.update).mockImplementation(async (_id, patch) => ({ ...plan({}), ...patch }) as never)
    renderMedQuery()
    const bock = await screen.findByLabelText(/Anna Andersson/)
    fireEvent.click(bock)
    await waitFor(() => expect(aktivitetsplanApi.update).toHaveBeenCalledWith('plan1', { af_registered_at: '2026-11-12' }))
    expect(await screen.findByText(/Registrerad 12 nov/)).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText(/Anna Andersson/))
    await waitFor(() => expect(aktivitetsplanApi.update).toHaveBeenLastCalledWith('plan1', { af_registered_at: null }))
    // Inget ligger kvar i webbläsaren — bocken bor på planen nu.
    expect(localStorage.getItem('af-anvisning-registrerad:plan1')).toBeFalsy()
  })

  it('visar — och spärrar nedladdningen när inga planer finns i kvartalet', async () => {
    const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
    vi.mocked(aktivitetsplanApi.listAll).mockResolvedValue([] as never)
    vi.mocked(aktivitetsplanApi.listSessionsBetween).mockResolvedValue([] as never)
    renderMedQuery()
    expect(await screen.findByText(/Inga anvisade planer i kvartalet/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ladda ner som TSV' })).toBeDisabled()
    expect(screen.queryByText('Summa')).not.toBeInTheDocument()
  })
})
