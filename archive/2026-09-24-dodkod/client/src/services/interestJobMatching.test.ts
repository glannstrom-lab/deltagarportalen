/**
 * SA6 (docs/ROADMAP.md): `calculateRiasecMatch` gjorde tidigare
 * `Math.max(30, …)` så fort en enda RIASEC-typ hade minst en
 * nyckelordsträff eller en yrkesgruppsträff — en annons som nätt och jämnt
 * nämnde ETT ord (t.ex. "tekniker") visades då aldrig under "30 %
 * matchning", identiskt med en annons som faktiskt matchade väl.
 *
 * `calculateRiasecMatch` är inte exporterad; testet går via
 * `quickInterestMatch`, som anropar den och returnerar samma `score`.
 *
 * Räckvidd, mätt 2026-09-02: `matchJobsToInterests` (som delar samma
 * poängfunktion) har i skrivande stund noll levande anropare — enda
 * konsumenten `useJobMatching` (hooks/useJobMatching.ts) nås bara via den
 * döda barrelfilen `hooks/index.ts` (samma mönster som lärdomen
 * 2026-08-04 "Barrel-filer gör dödkod osynlig för importsökning").
 * Fixen är korrekt oavsett, men påverkar inte drift förrän hooken kopplas in.
 */
import { describe, it, expect } from 'vitest'
import { quickInterestMatch, type RiasecScores } from './interestJobMatching'
import type { PlatsbankenJob } from './arbetsformedlingenApi'

function gorJobb(overrides: Partial<PlatsbankenJob> = {}): PlatsbankenJob {
  return {
    id: 'job-1',
    headline: 'Testannons',
    description: { text: '', text_formatted: '' },
    employer: { name: 'Testföretag' },
    ...overrides,
  }
}

/** Bara "realistic" har någon vikt — de andra typerna kan inte bidra. */
const enbartRealistisk: RiasecScores = {
  realistic: 100,
  investigative: 0,
  artistic: 0,
  social: 0,
  enterprising: 0,
  conventional: 0,
}

describe('SA6 — matchningsgolvet är borttaget', () => {
  it('en annons som nätt och jämnt nämner ETT nyckelord får en LÅG poäng, inte 30', () => {
    // "tekniker" är enda träffen bland `realistic`s nyckelord/yrkesgrupper.
    // 1 av 3 nyckelord ger keywordScore = (1/3)*60 = 20, ingen yrkesgruppsbonus.
    const jobb = gorJobb({ headline: 'Vi söker en tekniker till vårt team' })
    const { score, matches } = quickInterestMatch(jobb, enbartRealistisk)

    expect(score).toBe(20) // INTE 30 — det gamla golvet skulle ha gett 30
    expect(score).toBeLessThan(30)
    expect(matches).toBe(false) // under 40-tröskeln i quickInterestMatch
  })

  it('en annons utan någon träff alls ger fortfarande 0, inte 30', () => {
    const jobb = gorJobb({ headline: 'Helt orelaterad annons om ingenting särskilt' })
    const { score } = quickInterestMatch(jobb, enbartRealistisk)
    expect(score).toBe(0)
  })

  it('en stark träff (flera nyckelord + yrkesgrupp) klampas fortfarande vid 100', () => {
    const jobb = gorJobb({
      headline: 'Mekaniker och montör sökes till bygg',
      description: { text: 'fordon maskin underhåll reparation produktion lager truck logistik distribution', text_formatted: '' },
      occupation: { label: 'Bygg och anläggning' },
    })
    const { score } = quickInterestMatch(jobb, enbartRealistisk)
    expect(score).toBeLessThanOrEqual(100)
    expect(score).toBeGreaterThan(30)
  })
})
