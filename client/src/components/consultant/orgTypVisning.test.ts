import { describe, it, expect } from 'vitest'
import { orgTypVisning, regelverk, regelverkForPlan, rollerForOrg, epostPlatshallare } from './orgTypVisning'

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

// RR2/RR9 (rollspelet 2026-09-27): kommunens juridik i leverantörens flöde.
// Motprov: låt `regelverk` alltid svara 'kommun' → 'bara leverantör'-testet faller.
describe('regelverk — vilken lag texterna talar om', () => {
  it('bara leverantör ger Rusta och matcha, allt annat kommunens regelverk som i dag', () => {
    expect(regelverk(['leverantor'])).toBe('leverantor')
    expect(regelverk(['leverantor', 'arbetsgivare'])).toBe('leverantor')
    expect(regelverk([])).toBe('kommun')
    expect(regelverk(['kommun'])).toBe('kommun')
    expect(regelverk(['kommun', 'leverantor'])).toBe('kommun')
    expect(regelverk(['annan', 'leverantor'])).toBe('kommun')
  })

  it('planens egen organisation avgör för en konsulent i både kommun och leverantör', () => {
    const medlemskap = [
      { org_id: 'k', organization: { kind: 'kommun' as const } },
      { org_id: 'l', organization: { kind: 'leverantor' as const } },
    ]
    expect(regelverkForPlan(medlemskap, 'l')).toBe('leverantor')
    expect(regelverkForPlan(medlemskap, 'k')).toBe('kommun')
    // Okänd eller saknad plan-organisation → alla medlemskap, som regelverk()
    expect(regelverkForPlan(medlemskap, null)).toBe('kommun')
    expect(regelverkForPlan([{ org_id: 'l', organization: { kind: 'leverantor' } }], 'annan-org')).toBe('leverantor')
    expect(regelverkForPlan([], 'x')).toBe('kommun')
  })

  it('leverantören erbjuds inte rollen handläggare för ekonomiskt bistånd', () => {
    const roller = ['handlaggare', 'konsulent', 'chef', 'admin'] as const
    expect(rollerForOrg('leverantor', roller)).toEqual(['konsulent', 'chef', 'admin'])
    expect(rollerForOrg('kommun', roller)).toEqual([...roller])
    // En kollega som redan har rollen ska inte få ett tomt val
    expect(rollerForOrg('leverantor', roller, 'handlaggare')).toEqual([...roller])
  })

  it('platshållaren säger kommun bara hos en kommun', () => {
    expect(epostPlatshallare('leverantor')).not.toMatch(/kommun/)
    expect(epostPlatshallare('kommun')).toMatch(/@kommun\.se$/)
  })
})
