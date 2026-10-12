/** KSL15: handläggarens flikuppsättning. */
import { describe, it, expect } from 'vitest'
import { arEnbartHandlaggare, flikarForRoll, handlaggareFarOppna, consultantTabs } from './consultantTabs'
import { konsulentBottenNavFor, konsulentBottenNav, aktivKonsulentFlik } from '@/components/layout/konsulentNav'

describe('KSL15', () => {
  it('handläggare är den som är handläggare i alla sina organisationer', () => {
    expect(arEnbartHandlaggare([])).toBe(false)
    expect(arEnbartHandlaggare(['handlaggare'])).toBe(true)
    expect(arEnbartHandlaggare(['handlaggare', 'konsulent'])).toBe(false)
    expect(arEnbartHandlaggare(['chef'])).toBe(false)
  })

  it('handläggaren får Översikt, Rapporter och Inställningar; andra får alla', () => {
    expect(flikarForRoll(true).map((t) => t.label)).toEqual(['Översikt', 'Rapporter', 'Inställningar'])
    expect(flikarForRoll(false)).toBe(consultantTabs)
  })

  it('dolda sökvägar, inklusive deltagarsidor, släpps inte in', () => {
    expect(handlaggareFarOppna('/consultant')).toBe(true)
    expect(handlaggareFarOppna('/consultant/')).toBe(true)
    expect(handlaggareFarOppna('/consultant/analytics')).toBe(true)
    expect(handlaggareFarOppna('/consultant/settings')).toBe(true)
    expect(handlaggareFarOppna('/consultant/participants')).toBe(false)
    expect(handlaggareFarOppna('/consultant/participants/abc')).toBe(false)
    expect(handlaggareFarOppna('/consultant/platser')).toBe(false)
    expect(handlaggareFarOppna('/consultant/pass/grupp')).toBe(false)
  })

  it('bottennavet för handläggaren har samma tre flikar och Inställningar är aktiv där', () => {
    const nav = konsulentBottenNavFor(true)
    expect(nav.map((t) => t.id)).toEqual(['overview', 'analytics', 'settings'])
    expect(aktivKonsulentFlik('/consultant/settings', nav)).toBe('settings')
    expect(konsulentBottenNavFor(false)).toBe(konsulentBottenNav)
  })
})
