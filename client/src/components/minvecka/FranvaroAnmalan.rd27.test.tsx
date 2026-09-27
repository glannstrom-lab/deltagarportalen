/**
 * RD27 (rollspelet 2026-09-27): sjukanmälan som tänker på hela dagen.
 *   1. Med två pass samma dag erbjuds "Hela dagen"; valet anmäler dagen via anmalPeriod.
 *      Mutation: skicka alltid anmal(session.id) → testet faller.
 *   2. "Flera dagar" kräver ett slutdatum och anmäler perioden.
 *   3. Eget jobbsökande kan anmälas (fanns inte förut).
 *   4. Ett fel behåller valen och Försök igen gör samma anmälan (RD26).
 *   5. Ett möte inom perioden, en annan dag, frågas om efteråt.
 */
import { useState } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor, userEvent, fireEvent } from '@/test/utils'
import { FranvaroAnmalan } from './FranvaroAnmalan'
import type { ActivitySession } from '@/services/aktivitetApi'

const anmal = vi.fn()
const anmalPeriod = vi.fn()
vi.mock('@/services/franvaroApi', async () => {
  const riktig = await vi.importActual<typeof import('@/services/franvaroApi')>('@/services/franvaroApi')
  return {
    ...riktig,
    franvaroApi: { anmal: (...a: unknown[]) => anmal(...a), anmalPeriod: (...a: unknown[]) => anmalPeriod(...a), angra: vi.fn() },
  }
})
vi.mock('@/services/konsulentMeddelandeApi', () => ({ konsulentMeddelandeApi: { skickaTillMinKonsulent: vi.fn() } }))

const pass = (o: Partial<ActivitySession> & Record<string, unknown>): ActivitySession => ({
  id: 's-1', plan_id: 'p', participant_id: 'u1', date: '2026-09-28', start_time: '09:00', end_time: '12:00',
  title: 'Verkstad', activity_type: 'jobsearch', location: null, notes: null, attendance: null, attendance_note: null,
  sick_certificate_received: false, marked_by: null, marked_at: null, self_checkin_at: null, created_at: '', updated_at: '',
  ...o,
} as ActivitySession)
const nu = new Date('2026-09-27T18:00:00')
const morgon = pass({})
const eftermiddag = pass({ id: 's-2', start_time: '13:00', end_time: '16:00', title: 'Eget jobbsökande', activity_type: 'jobsearch_own' })
const anmald = (s: ActivitySession) => ({ ...s, absence_reported_at: '2026-09-27T18:01:00Z', absence_reason: 'sick', absence_note: null }) as ActivitySession

beforeEach(() => { anmal.mockReset(); anmalPeriod.mockReset() })
afterEach(cleanup)

async function oppnaOchValjSjuk() {
  await userEvent.click(screen.getByRole('button', { name: 'Jag kan inte komma' }))
  await userEvent.click(screen.getByRole('radio', { name: 'Jag är sjuk' }))
}

describe('RD27: hela dagen och flera dagar', () => {
  it('"Hela dagen" anmäler alla pass samma dag', async () => {
    const onSavedFlera = vi.fn()
    anmalPeriod.mockResolvedValue([anmald(morgon), anmald(eftermiddag)])
    render(<FranvaroAnmalan session={morgon} passSammaDag={[morgon, eftermiddag]} onSaved={vi.fn()} onSavedFlera={onSavedFlera} nu={nu} />)
    await oppnaOchValjSjuk()
    await userEvent.click(screen.getByRole('radio', { name: 'Hela dagen (2 pass)' }))
    await userEvent.click(screen.getByRole('button', { name: 'Skicka till min konsulent' }))
    await waitFor(() => expect(anmalPeriod).toHaveBeenCalledWith('2026-09-28', '2026-09-28', { orsak: 'sick', notering: '' }, nu))
    expect(anmal).not.toHaveBeenCalled()
    expect(onSavedFlera).toHaveBeenCalledWith([anmald(morgon), anmald(eftermiddag)])
  })

  it('utan fler pass samma dag finns inget "Hela dagen"', async () => {
    render(<FranvaroAnmalan session={morgon} passSammaDag={[morgon]} onSaved={vi.fn()} nu={nu} />)
    await oppnaOchValjSjuk()
    expect(screen.queryByRole('radio', { name: /Hela dagen/ })).toBeNull()
    expect(screen.getByRole('radio', { name: 'Flera dagar' })).toBeInTheDocument()
  })

  it('"Flera dagar" kräver ett slutdatum och anmäler perioden', async () => {
    anmalPeriod.mockResolvedValue([anmald(morgon)])
    render(<FranvaroAnmalan session={morgon} onSaved={vi.fn()} nu={nu} />)
    await oppnaOchValjSjuk()
    await userEvent.click(screen.getByRole('radio', { name: 'Flera dagar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Skicka till min konsulent' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Välj ett datum efter/)
    expect(anmalPeriod).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Till och med'), { target: { value: '2026-09-30' } })
    await userEvent.click(screen.getByRole('button', { name: 'Skicka till min konsulent' }))
    await waitFor(() => expect(anmalPeriod).toHaveBeenCalledWith('2026-09-28', '2026-09-30', { orsak: 'sick', notering: '' }, nu))
  })

  it('eget jobbsökande kan anmälas', () => {
    render(<FranvaroAnmalan session={eftermiddag} onSaved={vi.fn()} nu={nu} />)
    expect(screen.getByRole('button', { name: 'Jag kan inte komma' })).toBeInTheDocument()
  })

  it('ett fel behåller valen, och Försök igen gör samma anmälan (RD26)', async () => {
    anmal.mockRejectedValueOnce(new Error('42501')).mockResolvedValueOnce(anmald(morgon))
    render(<FranvaroAnmalan session={morgon} onSaved={vi.fn()} nu={nu} />)
    await oppnaOchValjSjuk()
    await userEvent.type(screen.getByLabelText(/Vill du säga något mer/), 'Feber')
    await userEvent.click(screen.getByRole('button', { name: 'Skicka till min konsulent' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Din text är kvar')
    expect(screen.getByLabelText(/Vill du säga något mer/)).toHaveValue('Feber')
    expect(screen.getByRole('radio', { name: 'Jag är sjuk' })).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
    await waitFor(() => expect(anmal).toHaveBeenCalledTimes(2))
    expect(anmal).toHaveBeenLastCalledWith('s-1', { orsak: 'sick', notering: 'Feber' })
  })

  it('frågar om ett möte en annan dag inom perioden', async () => {
    function Omslag() {
      const [s, setS] = useState(morgon)
      return (
        <FranvaroAnmalan
          session={s}
          motenSammaDag={[{ id: 'm1', tid: '12:00', datum: '2026-09-29' }, { id: 'm2', tid: '10:00', datum: '2026-10-05' }]}
          onSaved={setS}
          onSavedFlera={(u) => setS(u[0])}
          nu={nu}
        />
      )
    }
    anmalPeriod.mockResolvedValue([anmald(morgon)])
    render(<Omslag />)
    await oppnaOchValjSjuk()
    await userEvent.click(screen.getByRole('radio', { name: 'Flera dagar' }))
    fireEvent.change(screen.getByLabelText('Till och med'), { target: { value: '2026-09-30' } })
    await userEvent.click(screen.getByRole('button', { name: 'Skicka till min konsulent' }))
    const fraga = await screen.findByText(/Gäller det också mötet med din konsulent/)
    expect(fraga).toHaveTextContent(/29 september kl 12:00/)
    expect(fraga).not.toHaveTextContent(/10:00/)
  })
})
