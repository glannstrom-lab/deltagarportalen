/**
 * Veckoremsans dagstatus (omtaget steg 5): det som kräver något av konsulenten vinner.
 * Mutation: byt plats på ogiltig och vantar i RANG → andra testet faller.
 */
import { describe, it, expect } from 'vitest'
import { dagStatus, helgpass, passStatus, veckansDagar, type DagPass } from './veckodagar'

const p = (date: string, attendance: DagPass['attendance'], title = 'Pass'): DagPass => ({ date, attendance, title })
const IDAG = '2026-10-08' // torsdag

describe('veckodagar', () => {
  it('ett omarkerat pass väntar om dagen kommit, annars är det planerat', () => {
    expect(passStatus(p('2026-10-07', null), IDAG)).toBe('vantar')
    expect(passStatus(p(IDAG, null), IDAG)).toBe('vantar')
    expect(passStatus(p('2026-10-09', null), IDAG)).toBe('planerat')
    expect(passStatus(p('2026-10-07', 'external'), IDAG)).toBe('narvarande')
  })

  it('ogiltig frånvaro vinner över ett omarkerat pass samma dag, och det över närvaro', () => {
    expect(dagStatus([p('2026-10-06', 'present'), p('2026-10-06', null)], '2026-10-06', IDAG)).toBe('vantar')
    expect(dagStatus([p('2026-10-06', null), p('2026-10-06', 'absent_invalid')], '2026-10-06', IDAG)).toBe('ogiltig')
    expect(dagStatus([p('2026-10-06', 'present'), p('2026-10-06', 'sick_certified')], '2026-10-06', IDAG)).toBe('sjuk')
  })

  it('en dag utan pass är null — "Inget pass", inte en färg', () => {
    expect(dagStatus([p('2026-10-06', 'present')], '2026-10-05', IDAG)).toBeNull()
  })

  it('veckan är måndag–fredag i lokal tid, med passens namn för skärmläsaren', () => {
    const dagar = veckansDagar([p('2026-10-05', 'present', 'Språkcafé'), p('2026-10-09', null, 'Praktik')], IDAG, IDAG)
    expect(dagar.map((d) => d.datum)).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'])
    expect(dagar[0]).toMatchObject({ status: 'narvarande', detalj: 'Språkcafé' })
    expect(dagar[1]).toMatchObject({ status: null, detalj: undefined })
    expect(dagar[4]).toMatchObject({ status: 'planerat', detalj: 'Praktik' })
  })

  it('räknar helgpass, som remsan inte visar', () => {
    expect(helgpass([p('2026-10-10', null), p('2026-10-11', null), p('2026-10-12', null)], IDAG)).toBe(2)
  })
})
