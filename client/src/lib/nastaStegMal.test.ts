import { describe, it, expect } from 'vitest'
import { deltagarMal, hubbInnehaller, menyvalLederTill, paMaletsSida } from './nastaStegMal'

describe('vilket menyval leder till nästa steg', () => {
  it('svenska tecken: en procentkodad sökväg matchar sitt mål (lib/sokvag.ts)', () => {
    const mal = { vag: '/spontanansökan', fokus: null }
    expect(menyvalLederTill('/spontanans%C3%B6kan', mal)).toBe(true)
    expect(paMaletsSida('/spontanans%C3%B6kan', mal)).toBe(true)
  })

  it('konsulentens Översikt — inte varje flik under /consultant', () => {
    const mal = { vag: '/consultant', fokus: 'konsulent-nasta' }
    expect(menyvalLederTill('/consultant', mal)).toBe(true)
    expect(menyvalLederTill('/consultant/participants', mal)).toBe(false)
  })

  it('ett menyval leder till sina undersidor, frågesträngen räknas inte', () => {
    expect(menyvalLederTill('/foretag', { vag: '/foretag/forslag?id=1', fokus: null })).toBe(true)
    expect(menyvalLederTill('/foretag/platser', { vag: '/foretag/forslag', fokus: null })).toBe(false)
  })

  it('inget mål = ingen prick', () => {
    expect(menyvalLederTill('/cv', null)).toBe(false)
    expect(hubbInnehaller('jobb', undefined)).toBe(false)
  })

  it('hubben äger målet via sina medlemssidor', () => {
    expect(hubbInnehaller('jobb', { vag: '/cv', fokus: 'cv-start' })).toBe(true)
    expect(hubbInnehaller('karriar', { vag: '/cv', fokus: 'cv-start' })).toBe(false)
    expect(hubbInnehaller('min-vardag', { vag: '/min-vecka', fokus: 'jag-ar-har' })).toBe(true)
  })

  it('dagens pass pekar på knappen Jag är här', () => {
    expect(deltagarMal({ id: 'todaysPass', till: '/min-vecka' })).toEqual({ vag: '/min-vecka', fokus: 'jag-ar-har' })
    expect(deltagarMal({ id: 'mood', till: '/wellness' })).toEqual({ vag: '/wellness', fokus: null })
    expect(deltagarMal(null)).toBeNull()
  })
})
