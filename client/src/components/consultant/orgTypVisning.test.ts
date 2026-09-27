import { describe, it, expect } from 'vitest'
import { orgTypVisning } from './orgTypVisning'

describe('orgTypVisning', () => {
  it('kommun ser IVO-underlaget men inte R&M-avtalskravet', () => {
    expect(orgTypVisning(['kommun'])).toEqual({ visaAvtalskrav: false, visaIvoUnderlag: true })
  })

  it('leverantör ser avtalskravet men inte IVO-underlaget', () => {
    expect(orgTypVisning(['leverantor'])).toEqual({ visaAvtalskrav: true, visaIvoUnderlag: false })
  })

  it('utan organisation visas båda, som före ändringen', () => {
    expect(orgTypVisning([])).toEqual({ visaAvtalskrav: true, visaIvoUnderlag: true })
  })

  it('ett företagskonto räknas inte som konsulentens organisation', () => {
    expect(orgTypVisning(['arbetsgivare'])).toEqual({ visaAvtalskrav: true, visaIvoUnderlag: true })
    expect(orgTypVisning(['arbetsgivare', 'kommun'])).toEqual({ visaAvtalskrav: false, visaIvoUnderlag: true })
  })

  it('medlem i både kommun och leverantör ser båda', () => {
    expect(orgTypVisning(['kommun', 'leverantor'])).toEqual({ visaAvtalskrav: true, visaIvoUnderlag: true })
  })

  it('"annan" väljer inte bort något', () => {
    expect(orgTypVisning(['annan', 'kommun'])).toEqual({ visaAvtalskrav: true, visaIvoUnderlag: true })
  })
})
