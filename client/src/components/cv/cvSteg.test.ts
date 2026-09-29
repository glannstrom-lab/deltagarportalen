import { describe, it, expect } from 'vitest'
import { cvStartSteg } from './cvStartSteg'
import { harTidslucka } from './tidsluckor'

describe('cvStartSteg (EG3)', () => {
  it('inget CV börjar på mallvalet', () => {
    expect(cvStartSteg(null)).toBe(1)
    expect(cvStartSteg({})).toBe(1)
  })
  it('återupptar på första ofullständiga steg', () => {
    expect(cvStartSteg({ firstName: 'A' })).toBe(2)
    expect(cvStartSteg({ firstName: 'A', lastName: 'B' })).toBe(3)
    expect(cvStartSteg({ firstName: 'A', lastName: 'B', summary: 'x' })).toBe(4)
    expect(cvStartSteg({ firstName: 'A', lastName: 'B', summary: 'x', workExperience: [{ title: 'J' }] })).toBe(5)
    expect(cvStartSteg({ firstName: 'A', lastName: 'B', summary: 'x', workExperience: [{ title: 'J' }], skills: [{ name: 'Excel' }] })).toBe(6)
  })
})

describe('harTidslucka (UT2)', () => {
  it('inga eller ett jobb ger ingen lucka', () => {
    expect(harTidslucka(undefined)).toBe(false)
    expect(harTidslucka([])).toBe(false)
    expect(harTidslucka([{ startDate: '2020-01', endDate: '2021-01' }])).toBe(false)
  })
  it('sammanhängande jobb ger ingen lucka', () => {
    expect(harTidslucka([
      { startDate: '2020-01', endDate: '2021-01' },
      { startDate: '2021-02', current: true },
    ])).toBe(false)
  })
  it('flera månader utan jobb ger lucka', () => {
    expect(harTidslucka([
      { startDate: '2018-01', endDate: '2019-01' },
      { startDate: '2020-06', endDate: '2021-01' },
    ])).toBe(true)
  })
})
