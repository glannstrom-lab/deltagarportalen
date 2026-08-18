/**
 * Vakt för flikmarkeringen.
 *
 * Buggen som gjorde testet nödvändigt (2026-08-18): `arAktivFlik` säger ja för
 * både `/job-search` och `/job-search/matches` när man står på matchningarna,
 * eftersom föräldern är prefix till barnet. Skenan och mobilraden markerade
 * därför två flikar samtidigt, och eftersom "Sök" står först var det den som
 * fick `aria-current="page"` — sidan sa "du står på Sök" medan innehållet var
 * Matchningar, och mobilradens autoscroll rullade fram fel flik.
 *
 * Testet är skrivet så att det FALLER om regeln tas bort: varje fall har ett
 * förväntat id, inte bara "något är aktivt".
 */

import { describe, it, expect } from 'vitest'
import { arAktivFlik, aktivFlikId } from './flikMatchning'
import type { Tab } from './PageTabs'

const SOKA_JOBB: Tab[] = [
  { id: 'sok', label: 'Sök', path: '/job-search' },
  { id: 'dagens', label: 'Dagens jobb', path: '/job-search/daily' },
  { id: 'slump', label: 'Slumpjobbet', path: '/job-search/slumpjobbet' },
  { id: 'sparade', label: 'Sparade', path: '/job-search/saved' },
  { id: 'bevakningar', label: 'Bevakningar', path: '/job-search/alerts' },
  { id: 'matchningar', label: 'Matchningar', path: '/job-search/matches' },
]

const RESURSER: Tab[] = [
  { id: 'alla', label: 'Alla', path: '/resources' },
  { id: 'jobb', label: 'Jobb', path: '/resources?tab=jobs' },
  { id: 'stod', label: 'Stöd', path: '/resources?tab=support' },
]

const utan = new URLSearchParams()

describe('aktivFlikId', () => {
  it('markerar barnet, inte föräldern, på en undersökväg', () => {
    for (const [sokvag, vantat] of [
      ['/job-search', 'sok'],
      ['/job-search/daily', 'dagens'],
      ['/job-search/slumpjobbet', 'slump'],
      ['/job-search/saved', 'sparade'],
      ['/job-search/alerts', 'bevakningar'],
      ['/job-search/matches', 'matchningar'],
    ] as const) {
      expect(aktivFlikId(SOKA_JOBB, sokvag, utan)).toBe(vantat)
    }
  })

  it('föräldern matchar fortfarande per flik — det är därför vinnaren behövs', () => {
    // Om den här slutar gälla är prefixregeln borta och testet ovan blir tomt.
    const sok = SOKA_JOBB[0]
    expect(arAktivFlik(sok, '/job-search/matches', utan)).toBe(true)
  })

  it('väljer rätt flik när flikarna skiljs åt av query', () => {
    expect(aktivFlikId(RESURSER, '/resources', new URLSearchParams('tab=jobs'))).toBe('jobb')
    expect(aktivFlikId(RESURSER, '/resources', new URLSearchParams('tab=support'))).toBe('stod')
    expect(aktivFlikId(RESURSER, '/resources', utan)).toBe('alla')
  })

  it('svarar null när ingen flik matchar', () => {
    expect(aktivFlikId(SOKA_JOBB, '/wellness', utan)).toBeNull()
    expect(aktivFlikId([], '/job-search', utan)).toBeNull()
  })

  it('låter en djupare undersökväg tillhöra sin närmaste flik', () => {
    // /job-search/matches/nagot matchar både 'sok' och 'matchningar'.
    expect(aktivFlikId(SOKA_JOBB, '/job-search/matches/detalj', utan)).toBe('matchningar')
  })
})
