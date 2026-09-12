import { describe, it, expect } from 'vitest'
import { ovningsLage } from './ovningsLage'

describe('ovningsLage (PG9: aldrig nollor som nyckeltal)', () => {
  it('inget påbörjat → invit, inte "0 Påbörjade / 119 Ej påbörjade"', () => {
    const l = ovningsLage(119, {})
    expect(l.lage).toBe('invit')
    expect(l.totalt).toBe(119)
    expect(l.paborjade).toBe(0)
  })

  it('en påbörjad utan text räknas som påbörjad men inte aktiv', () => {
    const l = ovningsLage(119, { a: { q1: '   ' } })
    expect(l.lage).toBe('rakning')
    expect(l.paborjade).toBe(1)
    expect(l.aktiva).toBe(0)
  })

  it('en påbörjad med text är aktiv', () => {
    const l = ovningsLage(119, { a: { q1: 'Mitt svar' }, b: {} })
    expect(l.paborjade).toBe(2)
    expect(l.aktiva).toBe(1)
  })
})
