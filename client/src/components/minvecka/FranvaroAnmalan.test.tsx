/**
 * FranvaroAnmalan (F1) — fyra tester som kan falla:
 *   1. Ett kommande, omarkerat pass visar knappen; ett pass som redan hänt gör det inte.
 *      Mutation: ta bort datumvillkoret i kanAnmalaFranvaro → faller.
 *   2. Skicka utan vald orsak sparar inget och visar en uppmaning.
 *   3. Skicka med orsak anropar anmal() med passets id, orsaken och noteringen,
 *      och onSaved får det uppdaterade passet.
 *   4. Ett anmält pass visar status + ångra, och ångra anropar angra().
 */
import { useState } from 'react'
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

const skickaTillMinKonsulent = vi.fn()
vi.mock('@/services/konsulentMeddelandeApi', () => ({
  konsulentMeddelandeApi: { skickaTillMinKonsulent: (...a: unknown[]) => skickaTillMinKonsulent(...a) },
}))

const pass = (o: Partial<ActivitySession> & Record<string, unknown>): ActivitySession => ({
  id: 's-1', plan_id: 'p', participant_id: 'u1', date: '2026-09-20', start_time: '09:00', end_time: '12:00',
  title: 'Verkstad', activity_type: 'jobsearch', location: null, notes: null, attendance: null, attendance_note: null,
  sick_certificate_received: false, marked_by: null, marked_at: null, self_checkin_at: null, created_at: '', updated_at: '',
  ...o,
} as ActivitySession)
const nu = new Date('2026-09-14T10:00:00')

beforeEach(() => { anmal.mockReset(); angra.mockReset(); skickaTillMinKonsulent.mockReset() })
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

  /*
   * RD4 (rollspelet 2026-09-27): Anna sjukanmälde sig till morgonpasset, och
   * ingenting sa något om konsulentmötet kl 12 samma dag.
   * Mutation: visa inte frågan efter anmälan → första testet faller.
   */
  describe('RD4: möte med konsulenten samma dag', () => {
    const mote = { id: 'm1', tid: '12:00' }
    const anmaltPass = pass({ absence_reported_at: '2026-09-14T10:05:00Z', absence_reason: 'sick', absence_note: null })

    function Omslag({ onSaved }: { onSaved: (s: ActivitySession) => void }) {
      // Som i Min vecka: föräldern byter ut passet i cachen efter anmälan.
      const [s, setS] = useState(pass({}))
      return <FranvaroAnmalan session={s} motenSammaDag={[mote]} datumText="måndag 21 september" onSaved={(u) => { setS(u); onSaved(u) }} nu={nu} />
    }

    async function anmalSjuk() {
      anmal.mockResolvedValue(anmaltPass)
      render(<Omslag onSaved={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: 'Jag kan inte komma' }))
      await userEvent.click(screen.getByRole('radio', { name: 'Jag är sjuk' }))
      await userEvent.click(screen.getByRole('button', { name: 'Skicka till min konsulent' }))
      return screen.findByText(/Gäller det också mötet med din konsulent kl 12:00\?/)
    }

    it('frågar efter anmälan om mötet samma dag', async () => {
      expect(await anmalSjuk()).toBeInTheDocument()
    })

    it('"Ja" skickar ett meddelande om mötet till konsulenten', async () => {
      skickaTillMinKonsulent.mockResolvedValue({ id: 'msg1' })
      await anmalSjuk()
      await userEvent.click(screen.getByRole('button', { name: /Ja, meddela om mötet/ }))
      await waitFor(() => expect(skickaTillMinKonsulent).toHaveBeenCalledTimes(1))
      expect(skickaTillMinKonsulent.mock.calls[0][0]).toMatch(/möte kl 12:00/)
      expect(await screen.findByText(/har fått besked om mötet också/)).toBeInTheDocument()
    })

    it('"Nej" stänger frågan utan att skicka något', async () => {
      await anmalSjuk()
      await userEvent.click(screen.getByRole('button', { name: /Nej, jag kommer till mötet/ }))
      expect(screen.queryByText(/Gäller det också mötet/)).toBeNull()
      expect(skickaTillMinKonsulent).not.toHaveBeenCalled()
    })

    it('ett fel säger det lugnt och pekar på Min konsulent', async () => {
      skickaTillMinKonsulent.mockImplementation(async () => { throw new Error('42501') })
      await anmalSjuk()
      await userEvent.click(screen.getByRole('button', { name: /Ja, meddela om mötet/ }))
      expect(await screen.findByRole('alert')).toHaveTextContent(/Min konsulent/)
    })

    it('frågar inte när dagen saknar möte', async () => {
      anmal.mockResolvedValue(anmaltPass)
      render(<FranvaroAnmalan session={pass({})} onSaved={vi.fn()} nu={nu} />)
      await userEvent.click(screen.getByRole('button', { name: 'Jag kan inte komma' }))
      await userEvent.click(screen.getByRole('radio', { name: 'Jag är sjuk' }))
      await userEvent.click(screen.getByRole('button', { name: 'Skicka till min konsulent' }))
      await waitFor(() => expect(anmal).toHaveBeenCalled())
      expect(screen.queryByText(/Gäller det också mötet/)).toBeNull()
    })
  })
})
