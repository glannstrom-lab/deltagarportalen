/**
 * Läget i en mening (omtaget steg 5). Ärlighetsregeln: under laddning ingenting,
 * vid fel felet, och kundtypen styr vad som mäts. Mutation: ta bort raden
 * `if (u.regelverk === null …) return null` → första testet faller.
 */
import { describe, it, expect } from 'vitest'
import { deltagarLaget, alderIOrd, type LagetUnderlag } from './deltagarLaget'
import type { Kadens } from '@/services/moteskadens'

const idag = new Date(2026, 9, 11, 10)
const plan = { start_date: '2026-09-01', weekly_hours_target: 10, status: 'active' as const }
const kadens = (o: Partial<Kadens> = {}): Kadens => ({
  dagarSedanMote: 9, veckorSedanFysiskt: 1, dagarSedanFysiskt: 9, laget: 'ok', bokat: null, bokatFysiskt: null, ...o,
})
const bas = (o: Partial<LagetUnderlag> = {}): LagetUnderlag => ({
  regelverk: 'kommun',
  plan: { status: 'klart', plan, ogiltigaIVeckan: 0 },
  moten: { status: 'klart', kadens: kadens() },
  placeringsrad: null,
  kontakt: { at: new Date(2026, 9, 8, 9).toISOString() },
  idag,
  ...o,
})

describe('deltagarLaget', () => {
  it('säger ingenting medan något laddar', () => {
    expect(deltagarLaget(bas({ regelverk: null }))).toBeNull()
    expect(deltagarLaget(bas({ plan: { status: 'laddar' } }))).toBeNull()
    expect(deltagarLaget(bas({ placeringsrad: undefined }))).toBeNull()
    expect(deltagarLaget(bas({ regelverk: 'leverantor', moten: { status: 'laddar' } }))).toBeNull()
  })

  it('kommun: planen, ogiltig frånvaro och kontakten — ingen mötesregel', () => {
    expect(deltagarLaget(bas())).toBe('Aktivitetsplan 10 h/vecka sedan 1 september · senaste kontakt för 3 dagar sedan')
    const med = deltagarLaget(bas({ plan: { status: 'klart', plan, ogiltigaIVeckan: 1 } }))
    expect(med).toContain('ogiltig frånvaro den här veckan')
    expect(med).not.toMatch(/möte|fysiskt/)
  })

  it('Rusta och matcha: avtalet och mötena', () => {
    expect(deltagarLaget(bas({ regelverk: 'leverantor' }))).toBe('Rusta och matcha sedan 1 september · senaste möte för 9 dagar sedan, fysiskt för 9 dagar sedan')
    expect(deltagarLaget(bas({ regelverk: 'leverantor', moten: { status: 'klart', kadens: kadens({ dagarSedanMote: null, dagarSedanFysiskt: null }) } })))
      .toBe('Rusta och matcha sedan 1 september · inget genomfört möte än')
  })

  it('fel är fel, aldrig "allt är klart"', () => {
    expect(deltagarLaget(bas({ plan: { status: 'fel' } }))).toMatch(/^Aktivitetsplanen kunde inte hämtas/)
    expect(deltagarLaget(bas({ regelverk: 'leverantor', moten: { status: 'fel' } }))).toContain('mötena kunde inte hämtas')
  })

  it('en placerad deltagare jagas inte för möten (fynd A4)', () => {
    const t = deltagarLaget(bas({ regelverk: 'leverantor', placeringsrad: 'Anställd hos Ekbacken sedan 14 juli 2026' }))
    expect(t).toBe('Anställd hos Ekbacken sedan 14 juli 2026 · senaste kontakt för 3 dagar sedan')
  })

  it('utan plan och utan kontakt säger det just det', () => {
    expect(deltagarLaget(bas({ plan: { status: 'klart', plan: null, ogiltigaIVeckan: 0 }, kontakt: null })))
      .toBe('Ingen aktivitetsplan än · ingen kontakt registrerad')
  })

  it('ålder i ord', () => {
    expect([alderIOrd(0), alderIOrd(1), alderIOrd(5)]).toEqual(['i dag', 'i går', 'för 5 dagar sedan'])
  })
})
