/**
 * RR8 (rollspelet 2026-09-27): ingen väg från aktivitetsloggen till den
 * periodiska rapporten. Fälten ska säga samma sak som kortets rad, och bara
 * genomförda möten och anvisade pass räknas.
 */
import { describe, it, expect } from 'vitest'
import { avtalskravPerDeltagare, periodiskaFalt, type MoteIPeriod } from './aktivitetslogg'
import type { ActivitySession } from './aktivitetApi'

const plan = { id: 'pl', participant_id: 'p1', start_date: '2026-08-03', end_date: null }
const pass = (o: Partial<ActivitySession>) => ({
  plan_id: 'pl', date: '2026-09-08', start_time: '09:00', end_time: '11:00', title: 'Gruppträff', attendance: 'present',
  activity_type: 'jobsearch', location: 'Kontoret', sick_certificate_received: false, ...o,
}) as ActivitySession
const period = { from: '2026-09-07', to: '2026-09-20' }

describe('periodiskaFalt', () => {
  const sessions = [
    pass({}),
    pass({ date: '2026-09-15', attendance: 'absent_invalid' }),
    pass({ date: '2026-09-16', attendance: 'present', activity_type: 'jobsearch', location: null, title: 'Digitalt pass' }),
    pass({ date: '2026-09-17', attendance: 'present', activity_type: 'jobsearch_own', title: 'Eget jobbsökande' }),
  ]
  const moten: MoteIPeriod[] = [
    { participant_id: 'p1', scheduled_at: new Date(2026, 8, 10, 10).toISOString(), meeting_type: 'physical', status: 'completed' },
    { participant_id: 'p1', scheduled_at: new Date(2026, 8, 18, 10).toISOString(), meeting_type: 'video', status: 'scheduled' },
    { participant_id: 'p2', scheduled_at: new Date(2026, 8, 11, 10).toISOString(), meeting_type: 'video', status: 'completed' },
  ]
  const krav = avtalskravPerDeltagare(plan, sessions, period)
  const falt = Object.fromEntries(periodiskaFalt(krav, sessions, moten, period).map((f) => [f.id, f.text]))

  it('timmar per vecka följer bedömningen i tabellen', () => {
    expect(falt.veckor).toBe('7/9–13/9: 2 h (krav 1 h) — uppfyllt\n14/9–20/9: 2 h (krav 1 h) — uppfyllt')
  })
  it('andel fysiska räknas som i tabellen (eget jobbsökande utanför)', () => {
    expect(falt.fysiska).toBe('50 % (1 av 2 pass)')
  })
  it('bara deltagarens genomförda möten, med datum och typ', () => {
    expect(falt.moten).toBe('1 möte (varav 1 fysiskt): 10/9 fysiskt')
  })
  it('avvikelser med datum, pass och utfall', () => {
    expect(falt.avvikelser).toBe('15/9 Gruppträff: ogiltig frånvaro')
  })
})
