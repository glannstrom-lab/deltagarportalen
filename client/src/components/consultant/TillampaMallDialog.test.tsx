/**
 * TillampaMallDialog — veckomålet följer lagen (KM3/KM5).
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
}))

afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('TillampaMallDialog', () => {
  it('föreslår 40 h, och 30 h när barn under 8 bockas i', async () => {
    render(<TillampaMallDialog isOpen onClose={() => {}} participantId="p1" participantName="Anna Andersson" onCreated={() => {}} />)
    const mal = await screen.findByLabelText('Veckomål, timmar') as HTMLInputElement
    expect(mal.value).toBe('40')
    fireEvent.click(screen.getByLabelText('Barn under 8 år i hushållet'))
    expect(mal.value).toBe('30')
    expect(screen.getByText('Förslag enligt lagen: 30 h')).toBeInTheDocument()
  })

  it('kräver motivering när målet avviker från förslaget', async () => {
    const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
    render(<TillampaMallDialog isOpen onClose={() => {}} participantId="p1" participantName="Anna" onCreated={() => {}} />)
    const mal = await screen.findByLabelText('Veckomål, timmar')
    fireEvent.change(mal, { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Skapa plan' }))
    expect(await screen.findByText('Motivera varför målet avviker från lagens förslag')).toBeInTheDocument()
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
    expect(screen.getByRole('status')).toHaveTextContent('4 pass genereras')
    fireEvent.click(screen.getByRole('button', { name: 'Skapa plan' }))
    await vi.waitFor(() => expect(onCreated).toHaveBeenCalled())
    expect(aktivitetsplanApi.createFromTemplate).toHaveBeenCalledWith(expect.objectContaining({
      participantId: 'p1', templateId: 't1', startDate: '2026-10-05', endDate: '2026-10-18', weeklyHoursTarget: 40, targetReason: null,
    }))
  })
})
