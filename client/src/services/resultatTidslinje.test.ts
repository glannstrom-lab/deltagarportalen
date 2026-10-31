import { describe, it, expect } from 'vitest'
import { byggTidslinje, plusManader } from './resultatTidslinje'

const bas = { followup_3m: false, followup_6m: false }

describe('plusManader', () => {
  it('klipper till månadens sista dag', () => {
    expect(plusManader('2026-12-31', 2)).toBe('2027-02-28')
    expect(plusManader('2026-08-31', 2)).toBe('2026-10-31')
    expect(plusManader('2027-12-31', 2)).toBe('2028-02-29')
  })
  it('ogiltigt/saknat datum ger null', () => {
    expect(plusManader(null, 2)).toBeNull()
    expect(plusManader('skräp', 2)).toBeNull()
  })
})

describe('byggTidslinje', () => {
  it('räknar 3/6 månader och tillträdesfönstret', () => {
    const t = byggTidslinje({ ...bas, start_date: '2026-06-09', end_date: '2026-09-15', outcome_level: 'B' }, '2026-09-10')
    expect(t.punkter[0]).toMatchObject({ datum: '2026-09-09', lage: 'passerad', hogstBelopp: 13_850 })
    expect(t.punkter[1]).toMatchObject({ datum: '2026-12-09', lage: 'kommande' })
    expect(t.tilltradeSenast).toBe('2026-11-15')
    expect(t.tillagg).toBe(4_620)
  })
  it('punkt som infaller idag räknas som passerad', () => {
    expect(byggTidslinje({ ...bas, start_date: '2026-06-10' }, '2026-09-10').punkter[0].lage).toBe('passerad')
  })
  it('månadsslut: 31 augusti + 3 mån = 30 november', () => {
    expect(byggTidslinje({ ...bas, start_date: '2026-08-31' }, '2026-09-01').punkter[0].datum).toBe('2026-11-30')
  })
  it('utan nivå: inga belopp, inget gissat', () => {
    const t = byggTidslinje({ ...bas, start_date: '2026-06-09' }, '2026-07-01')
    expect(t.niva).toBeNull()
    expect(t.tillagg).toBeNull()
    expect(t.punkter.every((p) => p.hogstBelopp === null)).toBe(true)
  })
  it('utan startdatum och slutdatum: allt null', () => {
    const t = byggTidslinje({ ...bas, outcome_level: 'A' }, '2026-07-01')
    expect(t.punkter[0]).toMatchObject({ datum: null, lage: null })
    expect(t.tilltradeSenast).toBeNull()
  })
  it('status är null tills uppföljningen är registrerad, därefter väntar/verifierad', () => {
    const o = byggTidslinje({ ...bas, start_date: '2026-06-09', followup_3m_payment_status: 'verifierad' }, '2026-10-01')
    expect(o.punkter[0].status).toBeNull() // status utan registrerad uppföljning visas inte
    const g = byggTidslinje({ ...bas, start_date: '2026-06-09', followup_3m: true }, '2026-10-01')
    expect(g.punkter[0].status).toBe('vantar')
    const v = byggTidslinje({ ...bas, start_date: '2026-06-09', followup_3m: true, followup_3m_payment_status: 'verifierad' }, '2026-10-01')
    expect(v.punkter[0].status).toBe('verifierad')
  })
  it('beloppen är FFU-talen: halva av 20 300 / 27 700 / 38 000', () => {
    const h = (n: 'A' | 'B' | 'C') => byggTidslinje({ ...bas, start_date: '2026-06-09', outcome_level: n }, '2026-07-01').punkter[0].hogstBelopp
    expect([h('A'), h('B'), h('C')]).toEqual([10_150, 13_850, 19_000])
  })
})
