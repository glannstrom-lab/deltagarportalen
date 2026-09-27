/**
 * RK37 (rollspelet 2026-09-27): återkommande pass ändras för alla kommande
 * veckor på en gång, och praktikens dagar ur Platser blir pass i planen.
 */
import { describe, it, expect } from 'vitest'
import { kommandeISerien, platsPassDatum, platsPassPeriod, platsPassTimmarPerVecka } from './passSerie'
import { platsAvstamning } from './platsKoppling'

const pass = (id: string, date: string, o: Record<string, unknown> = {}) => ({
  id, plan_id: 'pl', date, start_time: '09:00', end_time: '12:00', title: 'Jobbsökarverkstad', activity_type: 'jobsearch', attendance: null as string | null, ...o,
})

describe('kommandeISerien', () => {
  // Tisdagar 29/9, 6/10, 13/10, 20/10.
  const alla = [
    pass('a', '2026-09-29'),
    pass('b', '2026-10-06'),
    pass('c', '2026-10-13', { attendance: 'present' }),
    pass('d', '2026-10-20'),
    pass('e', '2026-10-21'), // onsdag
    pass('f', '2026-10-27', { title: 'Språkcafé' }),
    pass('g', '2026-11-03', { start_time: '10:00' }),
    pass('h', '2026-11-10', { plan_id: 'annan' }),
    pass('i', '2026-09-22'), // före
  ]

  it('tar passet och senare omarkerade pass med samma veckodag, tid, rubrik och typ i samma plan', () => {
    expect(kommandeISerien(alla[1], alla).map((s) => s.id)).toEqual(['b', 'd'])
  })

  it('ett markerat pass är aldrig med i serien, men det valda passet är alltid med', () => {
    expect(kommandeISerien(alla[2], alla).map((s) => s.id)).toEqual(['c', 'd'])
  })

  it('ett pass utan fler i serien är ensamt', () => {
    expect(kommandeISerien(alla[5], alla).map((s) => s.id)).toEqual(['f'])
  })
})

describe('Plats → pass', () => {
  it('lägger passen på valda veckodagar i perioden, båda ändar inräknade', () => {
    expect(platsPassDatum({ veckodagar: [1, 3], from: '2026-10-05', to: '2026-10-14' })).toEqual(['2026-10-05', '2026-10-07', '2026-10-12', '2026-10-14'])
    expect(platsPassDatum({ veckodagar: [], from: '2026-10-05', to: '2026-10-14' })).toEqual([])
    expect(platsPassDatum({ veckodagar: [1], from: '2026-10-14', to: '2026-10-05' })).toEqual([])
  })

  it('perioden börjar vid det senaste av platsens start, planens start och i dag, och slutar vid det tidigaste slutet', () => {
    expect(platsPassPeriod({ start_date: '2026-10-07', end_date: '2027-01-31' }, { start_date: '2026-09-21', end_date: '2026-12-13' }, '2026-09-27'))
      .toEqual({ fran: '2026-10-07', till: '2026-12-13' })
    expect(platsPassPeriod({ start_date: '2026-09-01', end_date: null }, { start_date: '2026-09-21', end_date: null }, '2026-09-27'))
      .toEqual({ fran: '2026-09-27', till: null })
  })

  it('timmar per vecka räknas ur dagar och tider, och är null utan underlag', () => {
    expect(platsPassTimmarPerVecka([1, 2, 3, 4, 5], '08:00', '14:00')).toBe(30)
    expect(platsPassTimmarPerVecka([], '08:00', '14:00')).toBeNull()
    expect(platsPassTimmarPerVecka([1], '14:00', '08:00')).toBeNull()
  })

  it('ett pass inlagt från Platser matchar platsen på id även när platsfältet säger något annat', () => {
    const plats = { id: 'w1', company_name: 'Nordfrakt AB', status: 'pagaende', start_date: null, end_date: null, hours_per_week: 30, placement_type: 'praktik' }
    const utan = platsAvstamning([plats], [{ activity_type: 'workplace', location: 'Lagret', date: '2026-10-07' }])
    expect(utan.platserUtanPass.map((p) => p.id)).toEqual(['w1'])
    const med = platsAvstamning([plats], [{ activity_type: 'workplace', location: 'Lagret', date: '2026-10-07', work_placement_id: 'w1' }])
    expect(med.platserUtanPass).toEqual([])
    expect(med.fritextUtanPlats).toEqual([])
  })
})
