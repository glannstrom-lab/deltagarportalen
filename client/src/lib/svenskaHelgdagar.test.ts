import { describe, it, expect } from 'vitest'
import { paskdagen, helgdagar, ersattningsbaraDagar } from './svenskaHelgdagar'

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

describe('svenska röda dagar', () => {
  it('påskdagen för kända år', () => {
    expect(ymd(paskdagen(2025))).toBe('2025-04-20')
    expect(ymd(paskdagen(2026))).toBe('2026-04-05')
    expect(ymd(paskdagen(2027))).toBe('2027-03-28')
  })

  it('2026: långfredag, annandag påsk, Kristi himmelsfärd, midsommardagen, alla helgons dag', () => {
    const h = helgdagar(2026)
    for (const d of ['2026-04-03', '2026-04-06', '2026-05-14', '2026-06-20', '2026-10-31', '2026-06-06', '2026-12-25']) {
      expect(h.has(d), d).toBe(true)
    }
    expect(h.has('2026-06-19'), 'midsommarafton är ingen allmän helgdag').toBe(false)
  })

  it('ersättningsbara dagar: april 2026 har 22 vardagar minus långfredag och annandag påsk = 20', () => {
    expect(ersattningsbaraDagar('2026-04', '2026-01-01', null)).toBe(20)
  })

  it('start och avbrott mitt i månaden räknas med båda ändarna', () => {
    // okt 2026: 15 (tor) – 21 (ons) → 15,16,19,20,21 = 5
    expect(ersattningsbaraDagar('2026-10', '2026-10-15', '2026-10-21')).toBe(5)
  })

  it('ingen dag om planen inte överlappar månaden', () => {
    expect(ersattningsbaraDagar('2026-10', '2026-11-01', null)).toBe(0)
  })
})
