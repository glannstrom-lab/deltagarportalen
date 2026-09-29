/**
 * KH5/KH12 — "Skapa plan" var ett dött klick när motiveringsfältet längre ned
 * var tomt. Motprov: ta bort <FelSammanfattning> ur TillampaMallDialog → första
 * testet faller (ingen role="alert" med fältlistan, fokus ligger kvar på knappen).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { TillampaMallDialog } from './TillampaMallDialog'
import { FelSammanfattning } from './FelSammanfattning'

const mall = {
  id: 't1', owner_id: 'c1', org_id: null, name: 'Verkstad', description: null, is_public: false, is_starred: false, usage_count: 0,
  created_at: '', updated_at: '',
  items: [
    { id: 'i1', template_id: 't1', weekday: 1, start_time: '09:00', end_time: '12:00', title: 'Verkstad', activity_type: 'jobsearch', location: null, notes: null, sort_order: 0 },
  ],
}

vi.mock('@/services/aktivitetApi', () => ({
  schemamallApi: { list: vi.fn(async () => [mall]) },
  aktivitetsplanApi: { createFromTemplate: vi.fn() },
  FORSORJNINGSHINDER: ['arbetslos'],
  FORSORJNINGSHINDER_ETIKETT: { arbetslos: 'Arbetslös' },
}))

afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('felsammanfattning i Tillämpa schemamall', () => {
  it('visar en alert med länk till det tomma fältet och flyttar fokus dit', async () => {
    render(<TillampaMallDialog isOpen onClose={() => {}} participantId="p1" participantName="Anna" onCreated={() => {}} />)
    const mal = await screen.findByLabelText('Veckomål, timmar')
    fireEvent.change(mal, { target: { value: '20' } })
    expect(screen.queryByText(/fält behöver fyllas i/)).toBeNull()
    const knapp = screen.getByRole('button', { name: 'Skapa plan' })
    knapp.focus()
    fireEvent.click(knapp)

    const alert = (await screen.findAllByRole('alert')).find((a) => /fält behöver fyllas i/.test(a.textContent ?? ''))!
    expect(alert).toBeTruthy()
    expect(alert).toHaveFocus()
    const lank = screen.getByRole('button', { name: 'Motivera varför målet avviker från lagens förslag' })
    fireEvent.click(lank)
    expect(document.getElementById('tillampa-motivering')).toHaveFocus()
  })

  it('en giltig plan visar ingen sammanfattning', async () => {
    render(<TillampaMallDialog isOpen onClose={() => {}} participantId="p1" participantName="Anna" onCreated={() => {}} />)
    await screen.findByLabelText('Veckomål, timmar')
    expect(screen.queryByText(/fält behöver fyllas i/)).toBeNull()
  })
})

describe('FelSammanfattning', () => {
  it('flyttar fokus vid varje nytt försök, även med samma fel', () => {
    const fel = [{ faltId: 'x', text: 'Ange namn' }]
    const { rerender } = render(<><input id="x" aria-label="namn" /><FelSammanfattning signal={0} fel={fel} /></>)
    expect(screen.queryByRole('alert')).toBeNull()
    rerender(<><input id="x" aria-label="namn" /><FelSammanfattning signal={1} fel={fel} /></>)
    expect(screen.getByRole('alert')).toHaveFocus()
    screen.getByLabelText('namn').focus()
    rerender(<><input id="x" aria-label="namn" /><FelSammanfattning signal={2} fel={fel} /></>)
    expect(screen.getByRole('alert')).toHaveFocus()
    expect(screen.getByText('1 fält behöver fyllas i eller rättas')).toBeInTheDocument()
  })
})
