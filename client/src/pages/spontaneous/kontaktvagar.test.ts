import { describe, it, expect } from 'vitest'
import { byggKontaktvagar, laggTillIAnteckningar, sokLank } from './kontaktvagar'
import type { SpontaneousCompany } from '@/services/supabaseApi'

const f = (namn: string, data: unknown) =>
  ({ company_name: namn, company_data: data }) as unknown as Pick<SpontaneousCompany, 'company_name' | 'company_data'>

describe('byggKontaktvagar', () => {
  it('ger postadress med källa Bolagsverket och en sökning med källa sokning', () => {
    const v = byggKontaktvagar(f('Testbolaget AB', { address: { street: 'Storgatan 1', postalCode: '11122', city: 'Stockholm' } }))
    expect(v).toEqual([
      { typ: 'postadress', varde: 'Storgatan 1, 11122 Stockholm', kalla: 'bolagsverket' },
      expect.objectContaining({ typ: 'sokning', kalla: 'sokning' }),
    ])
    expect(v[1].varde).toContain('Testbolaget%20AB')
    expect(v[1].varde).toContain('Stockholm')
  })

  it('hittar inte på någon postadress när registret saknar den', () => {
    const v = byggKontaktvagar(f('Testbolaget AB', null))
    expect(v.map(x => x.typ)).toEqual(['sokning'])
  })

  it('visar ingenting alls utan namn och adress', () => {
    expect(byggKontaktvagar(f('  ', {}))).toEqual([])
  })

  it('varje rad har en källa, och ingen är en e-post- eller telefonuppgift', () => {
    const v = byggKontaktvagar(f('X AB', { address: { city: 'Malmö' }, contact: 'a@b.se' }))
    for (const r of v) {
      expect(r.kalla).toBeTruthy()
      expect(['postadress', 'sokning']).toContain(r.typ)
      expect(r.varde).not.toMatch(/@/)
    }
  })

  it('sökadressen är https', () => {
    expect(sokLank('A', 'B')).toMatch(/^https:\/\//)
  })
})

describe('laggTillIAnteckningar', () => {
  it('lägger raden efter befintliga anteckningar', () => {
    expect(laggTillIAnteckningar('Ring måndag', 'Postadress: X')).toBe('Ring måndag\nPostadress: X')
  })
  it('dubblerar inte', () => {
    expect(laggTillIAnteckningar('Postadress: X', 'Postadress: X')).toBe('Postadress: X')
  })
  it('klarar tomma anteckningar', () => {
    expect(laggTillIAnteckningar(null, 'Rad')).toBe('Rad')
  })
})
