/**
 * TillampaMallDialog — veckomålet följer lagen (KM3/KM5) och mallen (RK2).
 *
 * RK2 (rollspelet 2026-09-27): målet förifylldes med lagens 40 h mot mallens
 * 6 h anvisat, utan varning. Nu förifylls det ur mallen (högst lagens förslag);
 * lagens förslag står kvar som hint, och en avvikelse kräver motivering.
 * Motprov: förifyll med `forslag` igen → första testet faller på '6'.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { TillampaMallDialog } from './TillampaMallDialog'

const mall = {
  id: 't1', owner_id: 'c1', org_id: null, name: 'Verkstad', description: null, is_public: false, is_starred: false, usage_count: 0,
  created_at: '', updated_at: '',
  items: [
    { id: 'i1', template_id: 't1', weekday: 1, start_time: '09:00', end_time: '12:00', title: 'Verkstad', activity_type: 'jobsearch', location: null, notes: null, sort_order: 0 },
    { id: 'i2', template_id: 't1', weekday: 3, start_time: '09:00', end_time: '12:00', title: 'Språk', activity_type: 'language', location: null, notes: null, sort_order: 1 },
  ],
}

vi.mock('@/services/aktivitetApi', () => ({
  schemamallApi: { list: vi.fn(async () => [mall]) },
  aktivitetsplanApi: { createFromTemplate: vi.fn() },
  FORSORJNINGSHINDER: ['arbetslos', 'sjukskriven_med_intyg', 'sjuk_eller_aktivitetsersattning', 'arbetshinder_sociala_skal', 'foraldraledig', 'arbetar_deltid', 'sprakhinder', 'utan_forsorjningshinder', 'annat'],
  FORSORJNINGSHINDER_ETIKETT: { arbetslos: 'Arbetslös', sjukskriven_med_intyg: 'Sjukskriven med läkarintyg', sjuk_eller_aktivitetsersattning: 'Sjuk- eller aktivitetsersättning', arbetshinder_sociala_skal: 'Arbetshinder, sociala skäl', foraldraledig: 'Föräldraledig', arbetar_deltid: 'Arbetar deltid', sprakhinder: 'Språkhinder', utan_forsorjningshinder: 'Utan försörjningshinder', annat: 'Annat' },
}))

afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('TillampaMallDialog', () => {
  it('förifyller målet ur mallen (6 h), med lagens förslag som hint', async () => {
    render(<TillampaMallDialog isOpen onClose={() => {}} participantId="p1" participantName="Anna Andersson" onCreated={() => {}} />)
    const mal = await screen.findByLabelText('Veckomål, timmar') as HTMLInputElement
    expect(mal.value).toBe('6')
    expect(screen.getByText('Förslag enligt lagen: 40 h')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Barn under 8 år i hushållet'))
    expect(screen.getByText('Förslag enligt lagen: 30 h')).toBeInTheDocument()
    expect(mal.value).toBe('6')
  })

  it('varnar när schemat inte räcker till målet', async () => {
    render(<TillampaMallDialog isOpen onClose={() => {}} participantId="p1" participantName="Anna" onCreated={() => {}} />)
    const mal = await screen.findByLabelText('Veckomål, timmar')
    expect(screen.queryByText(/Veckan kan inte nå målet/)).toBeNull()
    fireEvent.change(mal, { target: { value: '20' } })
    expect(screen.getByText(/Veckan kan inte nå målet/)).toBeInTheDocument()
  })

  it('kräver motivering när målet avviker från förslaget', async () => {
    const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
    render(<TillampaMallDialog isOpen onClose={() => {}} participantId="p1" participantName="Anna" onCreated={() => {}} />)
    const mal = await screen.findByLabelText('Veckomål, timmar')
    fireEvent.change(mal, { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Skapa plan' }))
    expect((await screen.findAllByText('Motivera varför målet avviker från lagens förslag')).length).toBeGreaterThan(0)
    expect(aktivitetsplanApi.createFromTemplate).not.toHaveBeenCalled()
  })

  it('räknar passen ur mallen innan bekräftelse och skickar rätt indata', async () => {
    const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
    vi.mocked(aktivitetsplanApi.createFromTemplate).mockResolvedValue({ plan: { id: 'plan1' }, sessions: [] } as never)
    const onCreated = vi.fn()
    render(<TillampaMallDialog isOpen onClose={() => {}} participantId="p1" participantName="Anna" onCreated={onCreated} />)
    await screen.findByLabelText('Veckomål, timmar')
    fireEvent.change(screen.getByLabelText('Startdatum'), { target: { value: '2026-10-05' } })
    fireEvent.change(screen.getByLabelText('Slutdatum'), { target: { value: '2026-10-18' } })
    expect(screen.getByText(/4 pass genereras/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Motivering till avvikelsen'), { target: { value: 'Mallens schema, 6 h anvisat.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Skapa plan' }))
    await vi.waitFor(() => expect(onCreated).toHaveBeenCalled())
    expect(aktivitetsplanApi.createFromTemplate).toHaveBeenCalledWith(expect.objectContaining({
      participantId: 'p1', templateId: 't1', startDate: '2026-10-05', endDate: '2026-10-18', weeklyHoursTarget: 6, targetReason: 'Mallens schema, 6 h anvisat.', jobsearchHoursPerWeek: 0,
      forsorjningshinder: null,
    }))
  })

  it('skickar valt försörjningshinder till planen (KM7)', async () => {
    const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
    vi.mocked(aktivitetsplanApi.createFromTemplate).mockResolvedValue({ plan: { id: 'plan1' }, sessions: [] } as never)
    render(<TillampaMallDialog isOpen onClose={() => {}} participantId="p1" participantName="Anna" onCreated={vi.fn()} />)
    await screen.findByLabelText('Veckomål, timmar')
    fireEvent.change(screen.getByLabelText('Försörjningshinder (för IVO-underlaget)'), { target: { value: 'sprakhinder' } })
    fireEvent.change(screen.getByLabelText('Motivering till avvikelsen'), { target: { value: 'Mallens schema.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Skapa plan' }))
    await vi.waitFor(() => expect(aktivitetsplanApi.createFromTemplate).toHaveBeenCalled())
    expect(aktivitetsplanApi.createFromTemplate).toHaveBeenCalledWith(expect.objectContaining({ forsorjningshinder: 'sprakhinder' }))
  })
})
