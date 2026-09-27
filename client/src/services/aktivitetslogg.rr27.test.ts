/**
 * RR27 (rollspelet 2026-09-27): avtalsloggen räknar på passets märkning —
 * leverantörsledd/egen och fysisk/digital — när den finns, och säger hur
 * många pass som fortfarande bygger på härledningen.
 */
import { describe, it, expect } from 'vitest'
import { avtalskravPerDeltagare, periodiskaFalt } from './aktivitetslogg'

const plan = { id: 'pl', participant_id: 'p1', start_date: '2026-09-07', end_date: null }
const period = { from: '2026-09-07', to: '2026-09-13' }
const pass = (o: Record<string, unknown>) => ({
  id: 'x', plan_id: 'pl', date: '2026-09-08', start_time: '09:00', end_time: '11:00', attendance: 'present' as const,
  location: null as string | null, activity_type: 'jobsearch' as const, title: 'Pass', sick_certificate_received: false, ...o,
})

describe('RR27: märkningen i avtalsloggen', () => {
  it('ett arbetsplatspass märkt digitalt räknas som digitalt', () => {
    const krav = avtalskravPerDeltagare(plan, [pass({ activity_type: 'workplace', location: 'Nordfrakt', is_physical: false })], period)
    expect(krav.passNarvaro).toBe(1)
    expect(krav.passFysiska).toBe(0)
    expect(krav.andelFysiska).toBe(0)
    expect(krav.passHarleddFysisk).toBe(0)
  })

  it('ett pass märkt som deltagarens egen aktivitet räknas inte mot timkravet', () => {
    const krav = avtalskravPerDeltagare(plan, [pass({ is_provider_led: false })], period)
    expect(krav.veckor[0].narvaroTimmar).toBe(0)
    expect(krav.veckorUppfyllda).toBe(0)
    expect(krav.passHarleddLedning).toBe(0)
  })

  it('ett eget jobbsökande märkt leverantörsledd räknas', () => {
    const krav = avtalskravPerDeltagare(plan, [pass({ activity_type: 'jobsearch_own', is_provider_led: true })], period)
    expect(krav.veckor[0].narvaroTimmar).toBe(2)
  })

  it('omärkta pass räknas på härledningen och räknas som härledda', () => {
    const krav = avtalskravPerDeltagare(plan, [
      pass({ id: 'a', location: 'Rum 3' }),
      pass({ id: 'b', is_physical: false, is_provider_led: true }),
      pass({ id: 'c', activity_type: 'jobsearch_own' }),
    ], period)
    expect(krav.passNarvaro).toBe(2)
    expect(krav.passFysiska).toBe(1)
    expect(krav.passHarleddFysisk).toBe(1)
    // a och c saknar ledningsmärkning; c föll bort som eget men räknas ändå som härlett.
    expect(krav.passHarleddLedning).toBe(2)
  })

  it('avvikelserna i rapportunderlaget följer ledningsmärkningen', () => {
    const sessions = [
      pass({ id: 'a', title: 'Verkstad', attendance: 'absent_invalid' }),
      pass({ id: 'b', title: 'Hemma', attendance: 'absent_invalid', is_provider_led: false }),
    ]
    const krav = avtalskravPerDeltagare(plan, sessions, period)
    const avv = periodiskaFalt(krav, sessions, [], period).find((f) => f.id === 'avvikelser')!
    expect(avv.text).toContain('Verkstad')
    expect(avv.text).not.toContain('Hemma')
  })
})
