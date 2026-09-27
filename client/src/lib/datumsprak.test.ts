/**
 * RD6 (2026-09-27): datum i Jobbsök och Min konsulent visades som "9/27/2026"
 * på engelska ('en-US'). kortDatum ska vara entydigt på båda språken.
 */
import { describe, it, expect } from 'vitest'
import { datumSprak, kortDatum, manadOchAr } from './datumsprak'

describe('kortDatum', () => {
  const d = new Date(2026, 8, 27, 12)

  it('svenska: ISO-ordning', () => {
    expect(kortDatum(d, 'sv')).toBe('2026-09-27')
  })

  it('engelska: månaden utskriven, aldrig M/D/Y', () => {
    expect(kortDatum(d, 'en')).toBe('27 September 2026')
    expect(kortDatum(d, 'en')).not.toMatch(/\d+\/\d+\/\d+/)
  })

  it('tar ISO-strängar och tål skräp', () => {
    expect(kortDatum('2026-09-27T12:00:00', 'en')).toBe('27 September 2026')
    expect(kortDatum('inte ett datum', 'sv')).toBe('')
  })

  it('okänt språk faller tillbaka på svenska', () => {
    expect(datumSprak('fr')).toBe('sv-SE')
  })
})

describe('manadOchAr', () => {
  it('månadsväljaren i närvarointyget följer språket', () => {
    expect(manadOchAr('2026-09', 'sv')).toBe('september 2026')
    expect(manadOchAr('2026-09', 'en')).toBe('September 2026')
  })
})
