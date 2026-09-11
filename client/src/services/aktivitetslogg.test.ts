/**
 * aktivitetslogg (RM4) — avtalskravet räknat ur planer och pass.
 * 2026-10-05 är en måndag; planen nedan startar då.
 */
import { describe, it, expect } from 'vitest'
import {
  arFysiskt, avtalskravPerDeltagare, kravTimmarForManad, manadGranser, planManad, senasteSondag, veckogranser,
} from './aktivitetslogg'

const plan = (o: Partial<{ id: string; participant_id: string; start_date: string; end_date: string | null }> = {}) => ({
  id: 'plan1', participant_id: 'p1', start_date: '2026-10-05', end_date: null, ...o,
})

const pass = (
  date: string,
  o: Partial<{ plan_id: string; start_time: string; end_time: string; attendance: string | null; activity_type: string; location: string | null }> = {},
) => ({
  plan_id: 'plan1', date, start_time: '09:00', end_time: '10:00', attendance: 'present', activity_type: 'jobsearch', location: null, ...o,
}) as never

describe('planManad', () => {
  it('räknar från startdatumet, inte kalendermånaden', () => {
    expect(planManad('2026-10-05', '2026-10-05')).toBe(1)
    expect(planManad('2026-10-05', '2026-11-04')).toBe(1)
    expect(planManad('2026-10-05', '2026-11-05')).toBe(2)
    expect(planManad('2026-10-05', '2027-04-04')).toBe(6)
    expect(planManad('2026-10-05', '2027-04-05')).toBe(7)
    expect(planManad('2026-10-05', '2027-10-04')).toBe(12)
    expect(planManad('2026-10-05', '2027-10-05')).toBe(13)
  })
  it('ett datum före start hör till månad 1', () => {
    expect(planManad('2026-10-07', '2026-10-05')).toBe(1)
  })
  it('kravet är 1 h månad 1–6, 2 h månad 7–12, inget därefter', () => {
    expect(kravTimmarForManad(1)).toBe(1)
    expect(kravTimmarForManad(6)).toBe(1)
    expect(kravTimmarForManad(7)).toBe(2)
    expect(kravTimmarForManad(12)).toBe(2)
    expect(kravTimmarForManad(13)).toBeNull()
  })
})

describe('arFysiskt och veckogränser', () => {
  it('arbetsplats eller ifylld plats är fysiskt; tom plats är det inte', () => {
    expect(arFysiskt({ activity_type: 'workplace', location: null })).toBe(true)
    expect(arFysiskt({ activity_type: 'jobsearch', location: 'Jobbcenter, rum 3' })).toBe(true)
    expect(arFysiskt({ activity_type: 'jobsearch', location: '   ' })).toBe(false)
    expect(arFysiskt({ activity_type: 'language', location: null })).toBe(false)
  })
  it('manadGranser ger första och sista dagen, även i skottår', () => {
    expect(manadGranser('2026-11')).toEqual({ from: '2026-11-01', to: '2026-11-30' })
    expect(manadGranser('2028-02')).toEqual({ from: '2028-02-01', to: '2028-02-29' })
  })
  it('veckogranser täcker hela veckorna runt perioden', () => {
    expect(veckogranser({ from: '2026-10-01', to: '2026-10-31' })).toEqual({ from: '2026-09-28', to: '2026-11-01' })
  })
  it('senasteSondag ger söndagen som senast avslutade en vecka', () => {
    expect(senasteSondag('2026-10-14')).toBe('2026-10-11') // onsdag
    expect(senasteSondag('2026-10-12')).toBe('2026-10-11') // måndag
    expect(senasteSondag('2026-10-11')).toBe('2026-10-11') // söndag räknas som avslutad
  })
})

describe('avtalskravPerDeltagare', () => {
  const period = { from: '2026-10-01', to: '2026-11-01' } // veckorna 5, 12, 19, 26 okt

  it('räknar bara present och external som närvarotid', () => {
    const r = avtalskravPerDeltagare(plan(), [
      pass('2026-10-05'), // vecka 1: 1 h present → uppfylld
      pass('2026-10-12', { attendance: 'external' }), // vecka 2: uppfylld
      pass('2026-10-19', { attendance: 'absent_invalid' }),
      pass('2026-10-20', { attendance: 'absent_valid' }),
      pass('2026-10-21', { attendance: 'sick_certified' }),
      pass('2026-10-26', { attendance: null }),
    ], period)
    expect(r.veckorTotalt).toBe(4)
    expect(r.veckorUppfyllda).toBe(2)
    expect(r.veckor.map((v) => v.narvaroTimmar)).toEqual([1, 1, 0, 0])
    expect(r.passNarvaro).toBe(2)
  })

  it('kravet är 1 h i månad 1–6 och 2 h i månad 7–12', () => {
    const p = plan({ start_date: '2026-01-05' })
    // 5 juli 2026 → månad 7 börjar. Veckan 29 jun–5 jul är månad 6 (måndagen avgör), veckan 6–12 jul månad 7.
    const r = avtalskravPerDeltagare(p, [
      pass('2026-06-30', { start_time: '09:00', end_time: '10:00' }), // 1 h i månad 6 → uppfylld
      pass('2026-07-07', { start_time: '09:00', end_time: '10:00' }), // 1 h i månad 7 → INTE uppfylld
      pass('2026-07-14', { start_time: '09:00', end_time: '11:00' }), // 2 h i månad 7 → uppfylld
    ], { from: '2026-06-29', to: '2026-07-19' })
    expect(r.veckor.map((v) => [v.planManad, v.kravTimmar, v.uppfylld])).toEqual([
      [6, 1, true], [7, 2, false], [7, 2, true],
    ])
  })

  it('bedömer inte veckor efter månad 12', () => {
    const p = plan({ start_date: '2026-01-05' })
    // 4 jan 2027 = måndag i sista veckan av månad 12; 11 jan 2027 = månad 13.
    const r = avtalskravPerDeltagare(p, [pass('2027-01-12')], { from: '2027-01-04', to: '2027-01-24' })
    expect(r.veckorTotalt).toBe(1)
    expect(r.veckor[0].mandag).toBe('2027-01-04')
    expect(r.passNarvaro).toBe(0) // passet 12 jan ligger utanför de bedömda veckorna
  })

  it('klipper vid planens start och slut', () => {
    const p = plan({ start_date: '2026-10-14', end_date: '2026-10-27' }) // onsdag → tisdag
    const r = avtalskravPerDeltagare(p, [], period)
    expect(r.veckor.map((v) => v.mandag)).toEqual(['2026-10-12', '2026-10-19', '2026-10-26'])
    expect(r.veckorUppfyllda).toBe(0)
  })

  it('ger inga veckor och null-andel när planen inte överlappar perioden', () => {
    const r = avtalskravPerDeltagare(plan({ start_date: '2026-12-01' }), [pass('2026-12-01')], period)
    expect(r.veckorTotalt).toBe(0)
    expect(r.andelFysiska).toBeNull()
    expect(r.passNarvaro).toBe(0)
  })

  it('andelen fysiska är null utan närvaropass — aldrig 0 %', () => {
    const r = avtalskravPerDeltagare(plan(), [pass('2026-10-05', { attendance: 'absent_invalid', activity_type: 'workplace' })], period)
    expect(r.veckorTotalt).toBe(4)
    expect(r.andelFysiska).toBeNull()
  })

  it('räknar andelen fysiska ur närvaropassen i de bedömda veckorna', () => {
    const r = avtalskravPerDeltagare(plan(), [
      pass('2026-10-05', { activity_type: 'workplace' }),
      pass('2026-10-06', { location: 'Jobbcenter' }),
      pass('2026-10-07'),
      pass('2026-10-08', { attendance: 'absent_valid', activity_type: 'workplace' }), // räknas inte
      pass('2026-09-30', { activity_type: 'workplace' }), // före första bedömda veckan
    ], period)
    expect(r.passNarvaro).toBe(3)
    expect(r.passFysiska).toBe(2)
    expect(r.andelFysiska).toBeCloseTo(2 / 3)
  })

  it('ignorerar pass som hör till en annan plan', () => {
    const r = avtalskravPerDeltagare(plan(), [pass('2026-10-05', { plan_id: 'plan2' })], period)
    expect(r.veckorUppfyllda).toBe(0)
    expect(r.andelFysiska).toBeNull()
  })

  it('summerar delade pass inom veckan och avrundar till tiondelar', () => {
    const r = avtalskravPerDeltagare(plan(), [
      pass('2026-10-05', { start_time: '09:00', end_time: '09:30' }),
      pass('2026-10-08', { start_time: '13:00', end_time: '13:40' }),
    ], { from: '2026-10-05', to: '2026-10-11' })
    expect(r.veckor[0].narvaroTimmar).toBe(1.2)
    expect(r.veckor[0].uppfylld).toBe(true)
  })

  it('en vecka med 0,9 h uppfyller inte kravet på 1 h', () => {
    const r = avtalskravPerDeltagare(plan(), [pass('2026-10-05', { start_time: '09:00', end_time: '09:54' })], { from: '2026-10-05', to: '2026-10-11' })
    expect(r.veckor[0].narvaroTimmar).toBe(0.9)
    expect(r.veckor[0].uppfylld).toBe(false)
  })
})
