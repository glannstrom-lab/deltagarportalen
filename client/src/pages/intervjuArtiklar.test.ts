/**
 * Mutation: filtrera bara på titeln (`/intervju/i.test(a.title)`) → det
 * engelska fallet faller.
 */
import { describe, it, expect } from 'vitest'
import { artikelOmIntervju } from './intervjuArtiklar'

describe('artikelOmIntervju', () => {
  it('hittar intervjuartiklar i engelskt läge via den svenska slugen', () => {
    expect(artikelOmIntervju({ id: 'telefonintervju-tips', title: 'Tips for phone interviews' })).toBe(true)
    expect(artikelOmIntervju({ id: 'tackbrev-intervju', title: 'The thank-you letter' })).toBe(true)
  })
  it('tar med svenska titlar som förut', () => {
    expect(artikelOmIntervju({ id: 'x', title: 'Så lyckas du på intervjun' })).toBe(true)
  })
  it('släpper inte in andra artiklar', () => {
    expect(artikelOmIntervju({ id: 'cv-tips', title: 'Write a good CV' })).toBe(false)
  })
})
