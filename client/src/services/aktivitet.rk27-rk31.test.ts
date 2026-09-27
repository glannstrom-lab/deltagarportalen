/**
 * Rollspelet 2026-09-27 — aktivitetsplanens logik i konsulentvyn.
 *  RK27: veckan saknade ISO-veckonummer.
 *  RK28: nytt pass förifylldes med veckans (passerade) måndag, gick inte att
 *        upprepa, och det fanns bara fem typer.
 *  RK31: Boka möte varnade varken för helg eller krock med deltagarens pass.
 *  RR16: "1 timmar per vecka" i plan-PDF:en.
 */
import { describe, it, expect } from 'vitest'
import {
  arAnvisad,
  arVerksamhetsledd,
  forslagetPassdatum,
  isoVeckonummer,
  valbaraPasstyper,
  veckovisaDatum,
  UTOKADE_AKTIVITETSTYPER_PA,
} from './aktivitetSchema'
import { avtalskravPerDeltagare } from './aktivitetslogg'
import { timmarPerVecka } from './aktivitetsplanPdf'
import { krockandePass, motesVarningar } from './moteskadens'
import { AKTIVITETSTYP_ORDNING, veckoRubrik } from '@/components/consultant/aktivitetEtiketter'

describe('RK27 — ISO-veckonummer', () => {
  it('räknar som kommunens kalender', () => {
    expect(isoVeckonummer('2026-09-21')).toBe(39)
    expect(isoVeckonummer('2026-09-27')).toBe(39)
    expect(isoVeckonummer('2026-12-28')).toBe(53) // 2026 har 53 veckor
    expect(isoVeckonummer('2027-01-03')).toBe(53)
    expect(isoVeckonummer('2027-01-04')).toBe(1)
    expect(isoVeckonummer('2025-12-29')).toBe(1) // vecka 1 2026 börjar i december
  })
  it('rubriken bär veckonumret', () => {
    expect(veckoRubrik('2026-09-21')).toBe('Vecka 39 · 21–27 sep')
    expect(veckoRubrik('2026-09-28')).toBe('Vecka 40 · 28 sep – 4 okt')
  })
})

describe('RK28 — nytt pass', () => {
  it('förifyller i dag, inte veckans passerade måndag', () => {
    expect(forslagetPassdatum('2026-09-21', '2026-09-23')).toBe('2026-09-23')
  })
  it('en helgdag blir måndagen efter; en kommande vecka dess måndag', () => {
    expect(forslagetPassdatum('2026-09-21', '2026-09-27')).toBe('2026-09-28') // söndag
    expect(forslagetPassdatum('2026-09-21', '2026-09-26')).toBe('2026-09-28') // lördag
    expect(forslagetPassdatum('2026-10-05', '2026-09-23')).toBe('2026-10-05')
  })
  it('upprepning varje vecka till och med planens slut', () => {
    expect(veckovisaDatum('2026-09-29', '2026-10-20')).toEqual(['2026-09-29', '2026-10-06', '2026-10-13', '2026-10-20'])
    expect(veckovisaDatum('2026-10-21', '2026-10-20')).toEqual([])
  })
  it('de utökade typerna visas bara när brytaren är på', () => {
    expect(UTOKADE_AKTIVITETSTYPER_PA).toBe(true) // migrationen 20260927c körd
    expect(valbaraPasstyper(AKTIVITETSTYP_ORDNING, false)).toEqual(AKTIVITETSTYP_ORDNING)
    expect(valbaraPasstyper(AKTIVITETSTYP_ORDNING, true)).toEqual([...AKTIVITETSTYP_ORDNING, 'sfi', 'studier', 'vagledning', 'halsa'])
  })
  it('SFI och studier är anvisade men inte verksamhetsledda — avtalsloggen räknar dem inte', () => {
    expect(arAnvisad({ activity_type: 'sfi' })).toBe(true)
    expect(arVerksamhetsledd({ activity_type: 'sfi' })).toBe(false)
    expect(arVerksamhetsledd({ activity_type: 'studier' })).toBe(false)
    expect(arVerksamhetsledd({ activity_type: 'vagledning' })).toBe(true)
    expect(arVerksamhetsledd({ activity_type: 'jobsearch_own' })).toBe(false)

    const plan = { id: 'pl', participant_id: 'p', start_date: '2026-09-07', end_date: null }
    const pass = (activity_type: 'sfi' | 'jobsearch', start_time: string, end_time: string) =>
      ({ plan_id: 'pl', date: '2026-09-08', start_time, end_time, attendance: 'present' as const, activity_type, location: 'Komvux' })
    const krav = avtalskravPerDeltagare(plan, [pass('sfi', '09:00', '12:00'), pass('jobsearch', '13:00', '13:30')], { from: '2026-09-07', to: '2026-09-13' })
    expect(krav.veckor[0].narvaroTimmar).toBe(0.5)
    expect(krav.veckor[0].uppfylld).toBe(false)
    expect(krav.passNarvaro).toBe(1)
  })
})

describe('RR16 — timmar i plan-PDF:en', () => {
  it('böjs efter antal och skrivs med decimalkomma', () => {
    expect(timmarPerVecka(1)).toBe('1 timme per vecka')
    expect(timmarPerVecka(2)).toBe('2 timmar per vecka')
    expect(timmarPerVecka(2.5)).toBe('2,5 timmar per vecka')
    expect(timmarPerVecka(0)).toBe('0 timmar per vecka')
  })
})

describe('RK31 — varningar vid mötesbokning', () => {
  const pass = [{ start_time: '09:00', end_time: '12:00', title: 'Jobbsökarverkstad' }]
  it('varnar för lördag och söndag, inte för en vardag', () => {
    expect(motesVarningar({ veckodag: 6, tid: null, langdMin: 30, pass: [] })[0]).toMatch(/^Lördag/)
    expect(motesVarningar({ veckodag: 0, tid: null, langdMin: 30, pass: [] })[0]).toMatch(/^Söndag/)
    expect(motesVarningar({ veckodag: 2, tid: '14:00', langdMin: 30, pass })).toEqual([])
  })
  it('varnar för krock med deltagarens pass; kant i kant är ingen krock', () => {
    expect(motesVarningar({ veckodag: 2, tid: '11:30', langdMin: 60, pass })).toEqual(['Krockar med deltagarens pass Jobbsökarverkstad 09:00–12:00.'])
    expect(krockandePass(pass, '12:00', 30)).toEqual([])
    expect(krockandePass(pass, '08:30', 30)).toEqual([])
    expect(krockandePass(pass, '08:30', 45)).toHaveLength(1)
  })
})
