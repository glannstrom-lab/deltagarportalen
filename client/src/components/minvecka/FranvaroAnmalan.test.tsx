/**
 * FranvaroAnmalan (F1) — fyra tester som kan falla:
 *   1. Ett kommande, omarkerat pass visar knappen; ett pass som redan hänt gör det inte.
 *      Mutation: ta bort datumvillkoret i kanAnmalaFranvaro → faller.
 *   2. Skicka utan vald orsak sparar inget och visar en uppmaning.
 *   3. Skicka med orsak anropar anmal() med passets id, orsaken och noteringen,
 *      och onSaved får det uppdaterade passet.
 *   4. Ett anmält pass visar status + ångra, och ångra anropar angra().
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor, userEvent } from '@/test/utils'
import { FranvaroAnmalan } from './FranvaroAnmalan'
import type { ActivitySession } from '@/services/aktivitetApi'

const anmal = vi.fn()
const angra = vi.fn()
vi.mock('@/services/franvaroApi', async () => {
  const riktig = await vi.importActual<typeof import('@/services/franvaroApi')>('@/services/franvaroApi')
  return { ...riktig, franvaroApi: { anmal: (...a: unknown[]) => anmal(...a), angra: (...a: unknown[]) => angra(...a) } }
})

const pass = (o: Partial<ActivitySession> & Record<string, unknown>): ActivitySession => ({
  id: 's-1', plan_id: 'p', participant_id: 'u1', date: '2026-09-20', start_time: '09:00', end_time: '12:00',
  title: 'Verkstad', activity_type: 'jobsearch', location: null, notes: null, attendance: null, attendance_note: null,
  sick_certificate_received: false, marked_by: null, marked_at: null, self_checkin_at: null, created_at: '', updated_at: '',
  ...o,
} as ActivitySession)
const nu = new Date('2026-09-14T10:00:00')

beforeEach(() => { anmal.mockReset(); angra.mockReset() })
afterEach(cleanup)

describe('FranvaroAnmalan', () => {
  it('visar knappen bara för kommande, omarkerade pass', () => {
    const onSaved = vi.fn()
    const { unmount } = render(<FranvaroAnmalan session={pass({})} onSaved={onSaved} nu={nu} />)
    expect(screen.getByRole('button', { name: 'Jag kan inte komma' })).toBeInTheDocument()
    unmount()
    render(<FranvaroAnmalan session={pass({ date: '2026-09-10' })} onSaved={onSaved} nu={nu} />)
    expect(screen.queryByRole('button', { name: 'Jag kan inte komma' })).not.toBeInTheDocument()
    cleanup()
    render(<FranvaroAnmalan session={pass({ attendance: 'present' })} onSaved={onSaved} nu={nu} />)
    expect(screen.queryByRole('button', { name: 'Jag kan inte komma' })).not.toBeInTheDocument()
  })

  it('skickar inte utan orsak', async () => {
    render(<FranvaroAnmalan session={pass({})} onSaved={vi.fn()} nu={nu} />)
    await userEvent.click(screen.getByRole('button', { name: 'Jag kan inte komma' }))
    await userEvent.click(screen.getByRole('button', { name: 'Skicka till min konsulent' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Välj vad som hindrar dig.')
    expect(anmal).not.toHaveBeenCalled()
  })

  it('anmäler med orsak och notering och lämnar tillbaka det uppdaterade passet', async () => {
    const onSaved = vi.fn()
    const uppdaterat = pass({ absence_reported_at: '2026-09-14T10:05:00Z', absence_reason: 'sick', absence_note: 'Feber' })
    anmal.mockResolvedValue(uppdaterat)
    render(<FranvaroAnmalan session={pass({})} onSaved={onSaved} nu={nu} />)
    await userEvent.click(screen.getByRole('button', { name: 'Jag kan inte komma' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Jag är sjuk' }))
    await userEvent.type(screen.getByLabelText(/Vill du säga något mer/), 'Feber')
    await userEvent.click(screen.getByRole('button', { name: 'Skicka till min konsulent' }))
    await waitFor(() => expect(anmal).toHaveBeenCalledWith('s-1', { orsak: 'sick', notering: 'Feber' }))
    expect(onSaved).toHaveBeenCalledWith(uppdaterat)
  })

  it('ett anmält pass visar status och kan ångras', async () => {
    const onSaved = vi.fn()
    const anmalt = pass({ absence_reported_at: '2026-09-14T10:05:00Z', absence_reason: 'child_care', absence_note: null })
    angra.mockResolvedValue(pass({}))
    render(<FranvaroAnmalan session={anmalt} onSaved={onSaved} nu={nu} />)
    expect(screen.getByText(/Anmält: Vård av barn\./)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Jag kan inte komma' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Ångra anmälan' }))
    await waitFor(() => expect(angra).toHaveBeenCalledWith('s-1'))
    expect(onSaved).toHaveBeenCalled()
  })
})
