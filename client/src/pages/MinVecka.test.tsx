/**
 * Min vecka — tre tester som kan falla (kontrollerat 2026-09-11):
 *   1. `getMyPlan → null` måste ge tomtillståndets rubrik, inte saldoraden.
 *      Mutation: låt sidan rendera saldot även utan plan → faller.
 *   2. Saldoraden ska räkna passens timmar (veckosaldo), inte planens mål.
 *      Mutation: byt `saldo.planeradeTimmar` mot 0 → faller.
 *   3. "Jag är här" ska anropa checkin med DET passets id, bara för dagens pass.
 *      Mutation: skicka första passets id i stället → faller.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor, userEvent } from '@/test/utils'
import MinVecka from './MinVecka'
import { formatLocalDate, veckansMandag, addDays } from '@/services/aktivitetSchema'

vi.mock('@/components/layout/PageLayout', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const getMyPlan = vi.fn()
const listMySessions = vi.fn()
const checkin = vi.fn()

vi.mock('@/services/aktivitetApi', () => ({
  minVeckaApi: {
    getMyPlan: (...a: unknown[]) => getMyPlan(...a),
    listMySessions: (...a: unknown[]) => listMySessions(...a),
    checkin: (...a: unknown[]) => checkin(...a),
  },
}))

const idag = formatLocalDate(new Date())
const mandag = veckansMandag(idag)

const plan = {
  id: 'plan-1',
  participant_id: 'u1',
  consultant_id: 'k1',
  org_id: null,
  template_id: null,
  template_name: 'Jobbsökarverkstad',
  start_date: mandag,
  end_date: null,
  weekly_hours_target: 30,
  jobsearch_hours_per_week: 5,
  target_reason: null,
  status: 'active',
  plan_text: null,
  decided_at: null,
  created_at: '',
  updated_at: '',
}

const pass = (o: Record<string, unknown>) => ({
  id: 's-x',
  plan_id: 'plan-1',
  participant_id: 'u1',
  date: idag,
  start_time: '09:00',
  end_time: '12:00',
  title: 'Verkstad',
  activity_type: 'jobsearch',
  location: 'Hjernet',
  notes: null,
  attendance: null,
  attendance_note: null,
  sick_certificate_received: false,
  marked_by: null,
  marked_at: null,
  self_checkin_at: null,
  created_at: '',
  updated_at: '',
  ...o,
})

beforeEach(() => {
  getMyPlan.mockReset()
  listMySessions.mockReset()
  checkin.mockReset()
})
afterEach(cleanup)

describe('Min vecka', () => {
  it('visar tomtillståndet när ingen plan finns', async () => {
    getMyPlan.mockResolvedValue(null)
    render(<MinVecka />)
    expect(await screen.findByText('Ingen vecka planerad än')).toBeInTheDocument()
    expect(screen.queryByText(/timmar den här veckan/)).not.toBeInTheDocument()
    expect(listMySessions).not.toHaveBeenCalled()
  })

  it('räknar veckans planerade timmar ur passen och listar dem', async () => {
    getMyPlan.mockResolvedValue(plan)
    // Ett pass en annan dag i veckan så att båda ligger inom mån–sön oavsett
    // vilken veckodag testet körs: dagens + måndagen (kan vara samma dag).
    const annanDag = idag === mandag ? addDays(mandag, 1) : mandag
    listMySessions.mockResolvedValue([
      pass({ id: 's-1', date: annanDag, title: 'Språkcafé', activity_type: 'language', start_time: '13:00', end_time: '15:00' }),
      pass({ id: 's-2', title: 'Verkstad' }),
    ])
    render(<MinVecka />)
    expect(await screen.findByText(/Du har 5 av 30 timmar den här veckan\./)).toBeInTheDocument()
    expect(screen.getByText('Språkcafé')).toBeInTheDocument()
    expect(screen.getByText('Verkstad')).toBeInTheDocument()
    expect(screen.getByText(/5 timmar för eget jobbsökande/)).toBeInTheDocument()
  })

  it('"Jag är här" checkar in dagens pass med rätt id, och bara dagens', async () => {
    getMyPlan.mockResolvedValue(plan)
    const imorgon = addDays(idag, 1)
    listMySessions.mockResolvedValue([
      pass({ id: 's-tomorrow', date: imorgon, title: 'Imorgonpass' }),
      pass({ id: 's-today', title: 'Dagens pass' }),
    ])
    checkin.mockResolvedValue(pass({ id: 's-today', self_checkin_at: new Date().toISOString() }))
    render(<MinVecka />)
    const knappar = await screen.findAllByRole('button', { name: 'Jag är här' })
    // Imorgonpasset ligger utanför veckan om i dag är söndag; annars ska det
    // ändå INTE ha någon knapp.
    expect(knappar).toHaveLength(1)
    await userEvent.click(knappar[0])
    await waitFor(() => expect(checkin).toHaveBeenCalledWith('s-today'))
    expect(checkin).not.toHaveBeenCalledWith('s-tomorrow')
  })
})
