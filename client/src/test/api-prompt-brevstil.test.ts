/**
 * KF13 — servern litar inte på klienten: stilpreferenserna i personligt-brev
 * filtreras (strängar, högst fem, 100 tecken, inget om hälsa) och läggs som STIL.
 * Mutationer: ta bort namnerHalsa-kontrollen -> hälsotestet faller; ta bort
 * STIL_MAX -> femtestet faller; ta bort "aldrig underlag"-raden -> stiltestet faller.
 */
import { describe, it, expect } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PROMPTS } = require('../../api/_prompts/index.js') as {
  PROMPTS: Record<string, (data: unknown) => { system: string; user: string }>
}
const bygg = (data: Record<string, unknown>) => PROMPTS['personligt-brev']({ companyName: 'X', jobTitle: 'Y', ...data })
const MARKOR = 'DELTAGARENS EGNA STILÖNSKEMÅL'

describe('personligt-brev: stilpreferenser (KF13)', () => {
  it('utan preferenser är prompten oförändrad', () => {
    expect(bygg({}).system).not.toContain(MARKOR)
    expect(bygg({ stilpreferenser: [] }).system).not.toContain(MARKOR)
    expect(bygg({ stilpreferenser: 'Skriv kort' }).system).not.toContain(MARKOR)
  })

  it('raderna kommer med som stil, inte som underlag', () => {
    const p = bygg({ stilpreferenser: ['Använd inte utropstecken.'] })
    expect(p.system).toContain(MARKOR)
    expect(p.system).toContain('- Använd inte utropstecken.')
    expect(p.system).toMatch(/aldrig underlag om personen/)
    expect(p.user).not.toContain('utropstecken')
  })

  it('hälsa stryks på servern', () => {
    const p = bygg({ stilpreferenser: ['Jag har ångest, ta hänsyn', 'Nämn min diagnos', 'Skriv kort.'] })
    expect(p.system).not.toMatch(/ångest|diagnos/i)
    expect(p.system).toContain('- Skriv kort.')
  })

  it('högst fem rader, högst 100 tecken, bara strängar', () => {
    const p = bygg({ stilpreferenser: ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 7, null, 'x'.repeat(300)] })
    const rader = p.system.split(MARKOR)[1].split('\n').filter((r) => r.startsWith('- '))
    expect(rader).toHaveLength(5)
    expect(p.system).not.toContain('f6')
    const lang = bygg({ stilpreferenser: ['x'.repeat(300)] }).system.split('\n').find((r) => r.startsWith('- xxx'))!
    expect(lang.length).toBeLessThanOrEqual(102)
  })
})
