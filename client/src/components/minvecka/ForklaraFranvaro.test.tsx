/**
 * ForklaraFranvaro (RD11, rollspelet 2026-09-27) — deltagaren förklarar en
 * frånvaro som konsulenten redan markerat.
 *   1. Knappen finns bara på markerad frånvaro, och bara när raden bär kolumnen
 *      (före PENDING-migrationen syns ingen knapp som bara kan misslyckas).
 *      Mutation: ta bort hasOwnProperty-villkoret i kanForklaraFranvaro → faller.
 *   2. Skicka anropar forklara() med passets id och texten; kvittensen säger
 *      att konsulenten ser den och att den står på intyget.
 *   3. Ett fel behåller texten och säger det lugnt (RD26: inget tyst fel).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor, userEvent } from '@/test/utils'
import { ForklaraFranvaro } from './ForklaraFranvaro'
import type { ActivitySession } from '@/services/aktivitetApi'

const forklara = vi.fn()
vi.mock('@/services/franvaroApi', async () => {
  const riktig = await vi.importActual<typeof import('@/services/franvaroApi')>('@/services/franvaroApi')
  return { ...riktig, franvaroApi: { ...riktig.franvaroApi, forklara: (...a: unknown[]) => forklara(...a) } }
})

const pass = (o: Record<string, unknown>): ActivitySession => ({
  id: 's-17', plan_id: 'p', participant_id: 'u1', date: '2026-09-17', start_time: '09:00', end_time: '12:00',
  title: 'Jobbsökarverkstad', activity_type: 'jobsearch', location: null, notes: null, attendance: 'absent_invalid', attendance_note: null,
  sick_certificate_received: false, marked_by: 'k1', marked_at: '2026-09-17T13:00:00Z', self_checkin_at: null, created_at: '', updated_at: '',
  participant_explanation: null, participant_explanation_at: null,
  ...o,
} as ActivitySession)

beforeEach(() => { forklara.mockReset() })
afterEach(cleanup)

describe('ForklaraFranvaro', () => {
  it('finns bara på markerad frånvaro, och bara när kolumnen finns', () => {
    const { unmount } = render(<ForklaraFranvaro session={pass({})} onSaved={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Förklara frånvaron' })).toBeInTheDocument()
    unmount()
    render(<ForklaraFranvaro session={pass({ attendance: 'present' })} onSaved={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Förklara frånvaron' })).toBeNull()
    cleanup()
    const utanKolumn = pass({}) as unknown as Record<string, unknown>
    delete utanKolumn.participant_explanation
    delete utanKolumn.participant_explanation_at
    render(<ForklaraFranvaro session={utanKolumn as unknown as ActivitySession} onSaved={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Förklara frånvaron' })).toBeNull()
  })

  it('skickar förklaringen och lämnar tillbaka passet', async () => {
    const onSaved = vi.fn()
    const uppdaterat = pass({ participant_explanation: 'Bussen ställdes in.', participant_explanation_at: '2026-09-27T12:00:00Z' })
    forklara.mockResolvedValue(uppdaterat)
    render(<ForklaraFranvaro session={pass({})} onSaved={onSaved} />)
    await userEvent.click(screen.getByRole('button', { name: 'Förklara frånvaron' }))
    expect(screen.getByText(/står med på ditt närvarointyg/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/Vad hände/), 'Bussen ställdes in.')
    await userEvent.click(screen.getByRole('button', { name: 'Skicka förklaringen' }))
    await waitFor(() => expect(forklara).toHaveBeenCalledWith('s-17', 'Bussen ställdes in.'))
    expect(onSaved).toHaveBeenCalledWith(uppdaterat)
  })

  it('visar en sparad förklaring som hennes egen', () => {
    render(<ForklaraFranvaro session={pass({ participant_explanation: 'Bussen ställdes in.', participant_explanation_at: '2026-09-27T12:00:00Z' })} onSaved={vi.fn()} />)
    expect(screen.getByText(/Din förklaring/)).toBeInTheDocument()
    expect(screen.getByText(/Bussen ställdes in\./)).toBeInTheDocument()
  })

  it('ett fel behåller texten', async () => {
    forklara.mockImplementation(async () => { throw new Error('42501') })
    render(<ForklaraFranvaro session={pass({})} onSaved={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Förklara frånvaron' }))
    await userEvent.type(screen.getByLabelText(/Vad hände/), 'Jag var sjuk')
    await userEvent.click(screen.getByRole('button', { name: 'Skicka förklaringen' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Din text är kvar/)
    expect(screen.getByLabelText(/Vad hände/)).toHaveValue('Jag var sjuk')
  })
})
