/**
 * Texterna matchningen själv skriver (varningar, anpassningar, "varför
 * hamnade det här", platsraden) ska gå att byta språk på. Före 2026-10-12
 * låg de som svenska strängar i interestGuideData.ts och nådde engelskan
 * orörda.
 */
import { describe, it, expect } from 'vitest'
import {
  allQuestions,
  calculateJobMatches,
  calculateUserProfile,
  matchningsplats,
  type MatchTexter,
} from '@/services/interestGuideData'

const alla = (v: number) => Object.fromEntries(allQuestions.map(q => [q.id, v]))

// Visar nyckeln i stället för texten — då syns det om en sträng gått förbi t().
const nyckelTexter: MatchTexter = (nyckel, _sv, vars) =>
  vars ? `${nyckel}|${JSON.stringify(vars)}` : nyckel

describe('matchningens egna texter', () => {
  const profil = calculateUserProfile(alla(1))
  const svenska = calculateJobMatches(profil)
  const nycklar = calculateJobMatches(profil, undefined, undefined, { texter: nyckelTexter })

  it('har varningar och anpassningar att granska', () => {
    expect(svenska.some(m => (m.warnings?.length ?? 0) > 0)).toBe(true)
    expect(svenska.some(m => (m.adaptations?.length ?? 0) > 0)).toBe(true)
  })

  it('skickar varje varning och förklaringstext genom översättaren', () => {
    const varningar = nycklar.flatMap(m => m.warnings ?? [])
    expect(varningar.length).toBeGreaterThan(0)
    for (const v of varningar) expect(v).toMatch(/^interestGuide\.match\.warn\./)
    for (const m of nycklar) {
      expect(m.forklaring.sammanfattning).toMatch(/^interestGuide\.match\.summary\./)
      for (const d of m.forklaring.delar) expect(d.namn).toMatch(/^interestGuide\.match\.part\./)
    }
  })

  it('ger oförändrad svenska och oförändrad rangordning utan översättare', () => {
    expect(svenska[0].forklaring.sammanfattning).toMatch(/^(Yrket|Dina svar|Inget i dina svar)/)
    expect(nycklar.map(m => m.occupation.id)).toEqual(svenska.map(m => m.occupation.id))
  })

  it('bygger platsraden med översättaren, svenska som standard', () => {
    expect(matchningsplats(0, 5)).toBe('Nr 1 av 5 utifrån dina svar')
    expect(matchningsplats(0, 5, nyckelTexter)).toContain('interestGuide.results.rankPlace')
  })
})
