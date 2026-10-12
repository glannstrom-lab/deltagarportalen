/**
 * Detaljtexterna i matchningskorten ska gå att översätta.
 * Föll mot gamla koden: applyProfileBoosts hade ingen översättare och
 * pushade svenska strängar ("Har bil ✓") även i engelskt läge.
 */
import { describe, it, expect } from 'vitest'
import { applyProfileBoosts, matchesDriversLicense, type MatchPreferences, type MatchTexter } from './jobMatching'
import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'

const en: Record<string, string> = {
  'jobs.matches.detail.hasLicense': 'You have a {{klass}} driving licence ✓',
  'jobs.matches.detail.needsLicense': '{{klass}} driving licence needed',
  'jobs.matches.detail.licenseRequired': 'Driving licence needed',
  'jobs.matches.detail.remote': 'Remote work ✓',
  'jobs.matches.detail.hasCar': 'You have a car ✓',
}
const tEn: MatchTexter = (k, sv, vars) =>
  (en[k] ?? sv).replace(/\{\{(\w+)\}\}/g, (_m, n: string) => String(vars?.[n] ?? ''))

const job = (text: string) => ({ headline: 'Jobb', description: { text } }) as unknown as PlatsbankenJob
const prefs: MatchPreferences = {
  employmentTypes: [], remoteWork: 'yes', driversLicense: ['B'], hasCar: true, maxCommuteMinutes: null, industries: [],
}

describe('jobMatching — översättningsbara detaljer', () => {
  it('ger engelska detaljer med översättare', () => {
    const { details } = applyProfileBoosts(job('B-körkort och egen bil, distansarbete'), 50, prefs, [], tEn)
    expect(details).toEqual(['Remote work ✓', 'You have a B driving licence ✓', 'You have a car ✓'])
  })
  it('behåller svenska utan översättare', () => {
    const { details } = applyProfileBoosts(job('B-körkort och egen bil, distansarbete'), 50, prefs, [])
    expect(details).toEqual(['Distansarbete ✓', 'Du har B-körkort ✓', 'Har bil ✓'])
  })
  it('klassen fylls i även för uteblivet körkort', () => {
    expect(matchesDriversLicense(job('CE-körkort'), ['B'], tEn).detail).toBe('CE driving licence needed')
    expect(matchesDriversLicense(job('körkort'), [], tEn).detail).toBe('Driving licence needed')
  })
})
