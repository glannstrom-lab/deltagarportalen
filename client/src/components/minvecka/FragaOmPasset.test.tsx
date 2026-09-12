import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor, userEvent } from '@/test/utils'
import { FragaOmPasset } from './FragaOmPasset'
import type { ActivitySession } from '@/services/aktivitetApi'

const skicka = vi.fn()
const minKonsulent = vi.fn()
vi.mock('@/services/konsulentMeddelandeApi', () => ({
  konsulentMeddelandeApi: {
    skickaTillMinKonsulent: (...a: unknown[]) => skicka(...a),
    minKonsulent: (...a: unknown[]) => minKonsulent(...a),
  },
}))

const session: ActivitySession = {
  id: 's1', plan_id: 'p', participant_id: 'u', date: '2026-10-07', start_time: '09:00', end_time: '12:00', title: 'Jobbsökarverkstad',
  activity_type: 'jobsearch', location: 'Hjernet', notes: null, attendance: null, attendance_note: null, sick_certificate_received: false,
  marked_by: null, marked_at: null, self_checkin_at: null, created_at: '', updated_at: '',
}

describe('FragaOmPasset (F8)', () => {
  beforeEach(() => {
    skicka.mockReset()
    minKonsulent.mockReset()
    minKonsulent.mockResolvedValue({ id: 'k1', namn: 'Kim Konsulent' })
  })
  afterEach(cleanup)

  it('förifyller frågan med passets titel, datum och tid och skickar via samma API som Min konsulent', async () => {
    skicka.mockResolvedValue({ id: 'm1', content: 'x', created_at: '', receiver_id: 'k1' })
    const onSent = vi.fn()
    render(<FragaOmPasset session={session} datumText="7 oktober" onSent={onSent} />)
    await userEvent.click(screen.getByRole('button', { name: /fråga om passet/i }))
    const ruta = screen.getByRole('textbox', { name: /din fråga/i }) as HTMLTextAreaElement
    expect(ruta.value).toContain('Jobbsökarverkstad')
    expect(ruta.value).toContain('7 oktober')
    expect(ruta.value).toContain('09:00')
    await userEvent.type(ruta, 'Ska jag ta med datorn?')
    await userEvent.click(screen.getByRole('button', { name: /^skicka$/i }))
    await waitFor(() => expect(skicka).toHaveBeenCalledTimes(1))
    expect(String(skicka.mock.calls[0][0])).toContain('Ska jag ta med datorn?')
    expect(await screen.findByRole('status')).toHaveTextContent('Skickat till Kim Konsulent')
    expect(onSent).toHaveBeenCalledWith('Kim Konsulent')
  })

  it('skickar inte en tom fråga — bara inledningen räcker inte', async () => {
    render(<FragaOmPasset session={session} datumText="7 oktober" />)
    await userEvent.click(screen.getByRole('button', { name: /fråga om passet/i }))
    await userEvent.click(screen.getByRole('button', { name: /^skicka$/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/skriv din fråga/i)
    expect(skicka).not.toHaveBeenCalled()
  })

  it('visar ett fel som pekar på Min konsulent när sändningen nekas', async () => {
    skicka.mockRejectedValue(new Error('42501'))
    render(<FragaOmPasset session={session} datumText="7 oktober" />)
    await userEvent.click(screen.getByRole('button', { name: /fråga om passet/i }))
    await userEvent.type(screen.getByRole('textbox'), 'Hej?')
    await userEvent.click(screen.getByRole('button', { name: /^skicka$/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/min konsulent/i)
  })
})
