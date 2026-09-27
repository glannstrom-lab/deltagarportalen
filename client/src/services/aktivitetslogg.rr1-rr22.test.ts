/**
 * Rollspelet 2026-09-27, RR1 och RR22.
 *
 * RR1: aktivitetsloggen räknade deltagarens eget jobbsökande (jobsearch_own)
 * som aktivitetstid. Jonas Demo stod på "3 av 4 veckor uppfyllda" fast varje
 * uppfylld vecka bestod av en timmes eget jobbsökande hemifrån, medan alla
 * leverantörens pass var ogiltig frånvaro. Fixturen nedan är hans september i
 * prod (activity_sessions, deltagare …0003, läst 2026-09-27).
 *
 * RR22: "Avslutade veckor" tog med innevarande vecka på söndagen.
 */
import { describe, it, expect } from 'vitest'
import { avtalskravPerDeltagare, senasteAvslutadeSondag } from './aktivitetslogg'

const plan = { id: 'plan-jonas', participant_id: 'jonas', start_date: '2026-08-24', end_date: null }
const pass = (date: string, activity_type: string, attendance: string | null, location: string | null = null) => ({
  plan_id: 'plan-jonas', date, start_time: activity_type === 'jobsearch_own' ? '10:00' : '13:00',
  end_time: activity_type === 'jobsearch_own' ? '11:00' : '14:00', attendance, activity_type, location,
}) as never

// Jonas Demo i prod: leverantörens pass missade, egen jobbsökning "närvarande".
const jonas = [
  pass('2026-08-28', 'jobsearch', 'absent_invalid', 'Leverantörens kontor'),
  pass('2026-08-27', 'jobsearch_own', 'present'),
  pass('2026-09-03', 'jobsearch_own', 'absent_invalid'),
  pass('2026-09-10', 'jobsearch_own', 'present'),
  pass('2026-09-11', 'jobsearch', 'absent_invalid', 'Leverantörens kontor'),
  pass('2026-09-17', 'jobsearch_own', 'present'),
  pass('2026-09-24', 'jobsearch_own', 'present'),
  pass('2026-09-25', 'jobsearch', 'absent_invalid', 'Leverantörens kontor'),
]

describe('RR1: eget jobbsökande räknas inte som aktivitet mot avtalet', () => {
  const r = avtalskravPerDeltagare(plan, jonas, { from: '2026-09-01', to: '2026-09-27' })

  it('ingen vecka är uppfylld när bara eget jobbsökande har närvaro', () => {
    expect(r.veckorTotalt).toBe(4)
    expect(r.veckorUppfyllda).toBe(0) // var 3 före rättelsen
    expect(r.veckor.map((v) => v.narvaroTimmar)).toEqual([0, 0, 0, 0])
  })

  it('andelen fysiska saknar underlag — —, inte 0 % — när inget leverantörspass hade närvaro', () => {
    expect(r.passNarvaro).toBe(0)
    expect(r.andelFysiska).toBeNull()
  })

  it('ett anvisat pass räknas som förut, bredvid eget jobbsökande som inte gör det', () => {
    const blandat = avtalskravPerDeltagare(plan, [
      pass('2026-09-10', 'jobsearch_own', 'present'),
      pass('2026-09-11', 'jobsearch', 'present', 'Leverantörens kontor'),
    ], { from: '2026-09-07', to: '2026-09-13' })
    expect(blandat.veckor[0].narvaroTimmar).toBe(1)
    expect(blandat.passNarvaro).toBe(1)
    expect(blandat.andelFysiska).toBe(1)
  })
})

describe('RR22: en vecka är avslutad först när den är över', () => {
  it('på söndagen är innevarande vecka inte avslutad', () => {
    // Söndag 27 sep 2026 — dagen rollspelet kördes.
    expect(senasteAvslutadeSondag('2026-09-27')).toBe('2026-09-20')
  })
  it('på måndagen är gårdagens vecka avslutad', () => {
    expect(senasteAvslutadeSondag('2026-09-28')).toBe('2026-09-27')
  })
})
