import { describe, it, expect } from 'vitest'
import { harNagot, lokaltDatum, raknaJobbsok, type JobbsokRader } from './jobbsokAktivitet'

// Vecka 2026-10-05 (mån) – 2026-10-11 (sön)
const tom: JobbsokRader = { savedJobs: [], cvUpdatedAt: null, coverLetters: [], interviews: [] }

describe('lokaltDatum', () => {
  it('lämnar rena datum orörda och plockar lokalt datum ur en timestamp', () => {
    expect(lokaltDatum('2026-10-05')).toBe('2026-10-05')
    // Kvällstid lokalt — får inte tippa till nästa dag som toISOString gör i UTC
    const kvall = new Date(2026, 9, 5, 23, 30).toISOString()
    expect(lokaltDatum(kvall)).toBe('2026-10-05')
  })
  it('ger null för null och skräp', () => {
    expect(lokaltDatum(null)).toBeNull()
    expect(lokaltDatum('inte ett datum')).toBeNull()
  })
})

describe('raknaJobbsok', () => {
  it('räknar sparade jobb bara i veckan', () => {
    const v = raknaJobbsok(
      { ...tom, savedJobs: [
        { created_at: '2026-10-05T10:00:00', application_date: null, status: 'saved' },
        { created_at: '2026-10-11T22:00:00', application_date: null, status: 'saved' },
        { created_at: '2026-10-12T08:00:00', application_date: null, status: 'saved' },
        { created_at: '2026-10-04T23:00:00', application_date: null, status: 'saved' },
      ] },
      '2026-10-08',
    )
    expect(v.vecka).toBe('2026-10-05')
    expect(v.sparadeJobb).toBe(2)
  })

  it('räknar ansökningar på application_date, inte created_at, och bara skickade statusar', () => {
    const v = raknaJobbsok(
      { ...tom, savedJobs: [
        { created_at: '2026-09-01T10:00:00', application_date: '2026-10-06', status: 'APPLIED' },
        { created_at: '2026-09-01T10:00:00', application_date: '2026-10-07', status: 'interview' },
        { created_at: '2026-10-06T10:00:00', application_date: '2026-10-06', status: 'saved' },
        { created_at: '2026-10-06T10:00:00', application_date: null, status: 'applied' },
        { created_at: '2026-10-06T10:00:00', application_date: '2026-10-13', status: 'applied' },
      ] },
      '2026-10-05',
    )
    expect(v.ansokningar).toBe(2)
    expect(v.sparadeJobb).toBe(3)
  })

  it('CV räknas som uppdaterat bara om updated_at ligger i veckan', () => {
    expect(raknaJobbsok({ ...tom, cvUpdatedAt: '2026-10-09T14:00:00' }, '2026-10-05').cvUppdaterad).toBe(true)
    expect(raknaJobbsok({ ...tom, cvUpdatedAt: '2026-10-02T14:00:00' }, '2026-10-05').cvUppdaterad).toBe(false)
    expect(raknaJobbsok(tom, '2026-10-05').cvUppdaterad).toBe(false)
  })

  it('intervjuträning räknas på completed_at, annars started_at', () => {
    const v = raknaJobbsok(
      { ...tom, interviews: [
        { completed_at: '2026-10-06T10:00:00', started_at: '2026-10-06T09:30:00' },
        { completed_at: null, started_at: '2026-10-07T09:30:00' },
        { completed_at: null, started_at: '2026-09-30T09:30:00' },
      ] },
      '2026-10-05',
    )
    expect(v.intervjutraningar).toBe(2)
  })

  it('brev räknas på created_at i veckan', () => {
    const v = raknaJobbsok({ ...tom, coverLetters: [{ created_at: '2026-10-10T10:00:00' }, { created_at: '2026-10-12T10:00:00' }] }, '2026-10-05')
    expect(v.brev).toBe(1)
  })

  it('harNagot är falskt för en tom vecka och sant så fort något finns', () => {
    expect(harNagot(raknaJobbsok(tom, '2026-10-05'))).toBe(false)
    expect(harNagot(raknaJobbsok({ ...tom, cvUpdatedAt: '2026-10-05T08:00:00' }, '2026-10-05'))).toBe(true)
  })
})
