import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  claimOnboardingSession,
  releaseOnboardingSession,
  hasCompletedOnboarding,
  markOnboardingCompleted,
} from './onboardingCoordinator'

/**
 * Frekvenstaket för onboarding-modaler (DESIGN.md §12). Bugg B2 var att flera
 * modaler visades samtidigt på AI Team-sidan — för en långtidsarbetssökande med
 * kognitiv belastning är staplade modaler inte en skönhetsfläck utan en vägg.
 *
 * OBS: localStorage-mocken i src/test/setup.ts saknade backing store fram till
 * 2026-08-04 (UX19) — då hade de här testerna varit meningslösa. De verifierar
 * därför uttryckligen att det som skrevs också går att läsa tillbaka.
 */
describe('onboarding session-claim', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('första komponenten som claim:ar får visa sig', () => {
    expect(claimOnboardingSession('cv-builder')).toBe(true)
  })

  it('andra komponenten i samma session blockeras', () => {
    claimOnboardingSession('cv-builder')

    expect(claimOnboardingSession('ai-team')).toBe(false)
    expect(claimOnboardingSession('profile-welcome')).toBe(false)
  })

  it('samma ägare får claim:a om igen (idempotent vid omrendering)', () => {
    claimOnboardingSession('cv-builder')

    expect(claimOnboardingSession('cv-builder')).toBe(true)
  })

  it('release släpper sessionen så nästa komponent får plats', () => {
    claimOnboardingSession('cv-builder')
    releaseOnboardingSession('cv-builder')

    expect(claimOnboardingSession('ai-team')).toBe(true)
  })

  it('release från fel ägare rör inte claimen', () => {
    claimOnboardingSession('cv-builder')
    releaseOnboardingSession('ai-team')

    expect(claimOnboardingSession('ai-team')).toBe(false)
  })

  it('en ny session (rensad sessionStorage) ger ny chans', () => {
    claimOnboardingSession('cv-builder')
    sessionStorage.clear()

    expect(claimOnboardingSession('ai-team')).toBe(true)
  })

  it('fail open: blockerad sessionStorage får inte dölja onboarding', () => {
    const spy = vi.spyOn(window.sessionStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: private mode')
    })

    expect(claimOnboardingSession('cv-builder')).toBe(true)

    spy.mockRestore()
  })

  it('claimen ligger i sessionStorage, inte i localStorage', () => {
    claimOnboardingSession('cv-builder')

    expect(localStorage.getItem('jobin-onboarding-session-claimed')).toBeNull()
    expect(sessionStorage.getItem('jobin-onboarding-session-claimed')).toBe('cv-builder')
  })
})

describe('permanent onboarding-status', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('är false innan något markerats', () => {
    expect(hasCompletedOnboarding('cv')).toBe(false)
  })

  it('är true efter markering — och skrivningen går faktiskt att läsa tillbaka', () => {
    markOnboardingCompleted('cv')

    expect(localStorage.getItem('onboarding-completed:cv')).toBe('true')
    expect(hasCompletedOnboarding('cv')).toBe(true)
  })

  it('håller isär olika onboardings', () => {
    markOnboardingCompleted('cv')

    expect(hasCompletedOnboarding('ai-team')).toBe(false)
  })

  it('fail safe: kastande localStorage rapporterar "ej sedd" i stället för att krascha', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(hasCompletedOnboarding('cv')).toBe(false)
  })

  it('sväljer skrivfel utan att kasta', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => markOnboardingCompleted('cv')).not.toThrow()
  })
})
