/**
 * veckansStatus — veckoremsans färg får bara visa det som är MARKERAT
 * (omtaget steg 6). Fyra tester som kan falla:
 *   1. En dag utan pass har ingen status ("Inget pass", inte en färg).
 *   2. En dag med ett närvaro-markerat och ett omarkerat pass är inte grön.
 *      Mutation: returnera 'narvarande' om NÅGOT pass är närvaro → faller.
 *   3. Ogiltig frånvaro går före allt annat samma dag.
 *   4. Egen incheckning eller anmäld frånvaro är inte en markering.
 */
import { describe, it, expect } from 'vitest'
import { dagensStatus, veckonummer } from './veckansStatus'

describe('dagensStatus', () => {
  it('ingen dag utan pass får en färg', () => {
    expect(dagensStatus([])).toBeNull()
  })

  it('närvarande bara när alla dagens pass är markerade som närvaro', () => {
    expect(dagensStatus([{ attendance: 'present' }, { attendance: 'external' }])).toBe('narvarande')
    expect(dagensStatus([{ attendance: 'present' }, { attendance: null }])).toBe('planerat')
  })

  it('det som kräver något av henne först: ogiltig före sjuk före giltig', () => {
    expect(dagensStatus([{ attendance: 'present' }, { attendance: 'absent_invalid' }, { attendance: 'sick_certified' }])).toBe('ogiltig')
    expect(dagensStatus([{ attendance: 'absent_valid' }, { attendance: 'sick_certified' }])).toBe('sjuk')
    expect(dagensStatus([{ attendance: 'absent_valid' }, { attendance: null }])).toBe('giltig')
  })

  it('omarkerat är planerat, oavsett incheckning eller anmälan', () => {
    expect(dagensStatus([{ attendance: null }])).toBe('planerat')
  })
})

describe('veckonummer', () => {
  it('följer ISO 8601 (svensk veckonumrering)', () => {
    expect(veckonummer('2026-10-05')).toBe(41)
    expect(veckonummer('2026-10-11')).toBe(41)
    expect(veckonummer('2027-01-01')).toBe(53)
    expect(veckonummer('2026-01-01')).toBe(1)
  })
})
