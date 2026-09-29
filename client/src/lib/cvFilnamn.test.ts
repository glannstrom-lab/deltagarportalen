import { describe, it, expect } from 'vitest'
import { cvFilnamn } from './cvFilnamn'

describe('cvFilnamn (SV7)', () => {
  it('förnamn och efternamn', () => expect(cvFilnamn({ firstName: 'Anna', lastName: 'Berg' })).toBe('CV_Anna_Berg.pdf'))
  it('bara förnamn ger inget dubbelt understreck', () => expect(cvFilnamn({ firstName: 'Anna', lastName: '' })).toBe('CV_Anna.pdf'))
  it('saknat namn ger aldrig "okänd"', () => {
    expect(cvFilnamn({})).toBe('CV.pdf')
    expect(cvFilnamn(null)).toBe('CV.pdf')
  })
  it('titel används när namn saknas', () => expect(cvFilnamn({ title: 'Lager & logistik' })).toBe('CV_Lager_&_logistik.pdf'))
})
