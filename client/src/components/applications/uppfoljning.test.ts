import { describe, it, expect } from 'vitest'
import { dagarSedan, uppfoljningsOrsak, DAGAR_UTAN_SVAR } from './uppfoljning'
import { antalLuckor, foretagOchRoll } from './ansokanFalt'

const NU = new Date('2026-10-27T10:00:00Z')

describe('uppfoljningsOrsak', () => {
  it('avslag erbjuds alltid, även utan datum', () => {
    expect(uppfoljningsOrsak({ status: 'rejected' }, NU)).toBe('avslag')
  })

  it('tystnad först vid 14 dagar — inte 13', () => {
    expect(uppfoljningsOrsak({ status: 'applied', applicationDate: '2026-10-13' }, NU)).toBe('tystnad')
    expect(uppfoljningsOrsak({ status: 'applied', applicationDate: '2026-10-14' }, NU)).toBeNull()
    expect(DAGAR_UTAN_SVAR).toBe(14)
  })

  it('gissar inte fram ett datum: utan applicationDate ingen tystnad', () => {
    expect(uppfoljningsOrsak({ status: 'applied' }, NU)).toBeNull()
    expect(uppfoljningsOrsak({ status: 'applied', applicationDate: 'inte-ett-datum' }, NU)).toBeNull()
  })

  it.each(['interested', 'saved', 'interview', 'offer', 'accepted', 'withdrawn'] as const)('%s: inget erbjudande', (status) => {
    expect(uppfoljningsOrsak({ status, applicationDate: '2026-01-01' }, NU)).toBeNull()
  })

  it('arkiverade ansökningar lämnas ifred', () => {
    expect(uppfoljningsOrsak({ status: 'rejected', archivedAt: '2026-10-01' }, NU)).toBeNull()
  })
})

describe('dagarSedan', () => {
  it('räknar hela dagar och går aldrig under noll', () => {
    expect(dagarSedan('2026-10-20', NU)).toBe(7)
    expect(dagarSedan('2026-11-20', NU)).toBe(0)
    expect(dagarSedan(undefined, NU)).toBeNull()
  })
})

describe('ansokanFalt', () => {
  it('räknar luckor i hakparentes', () => {
    expect(antalLuckor('Hej [kontaktens namn], jag heter [ditt namn]. [x]')).toBe(2)
    expect(antalLuckor('Inga luckor här.')).toBe(0)
  })

  it('företag och roll: uttryckligt fält först, annars annonsdatan, tomt blir undefined', () => {
    expect(foretagOchRoll({ companyName: 'A', jobTitle: 'B', jobData: { headline: 'Z', employer: { name: 'Y' } } as never })).toEqual({ foretag: 'A', roll: 'B' })
    expect(foretagOchRoll({ jobData: { headline: 'Z', employer: { name: 'Y' } } as never })).toEqual({ foretag: 'Y', roll: 'Z' })
    expect(foretagOchRoll({ jobData: { headline: '  ' } as never })).toEqual({ foretag: undefined, roll: undefined })
  })
})
