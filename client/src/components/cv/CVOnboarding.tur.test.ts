/**
 * SV8/EG4: CV-turens avfärdande bor per användare; den gamla globala nyckeln
 * läses som "redan avfärdad" så ingen får turen igen.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { cvTurAvfardad, minnsCvTurAvfardad, shouldShowOnboarding, resetOnboarding } from './CVOnboarding'

beforeEach(() => localStorage.clear())

describe('CV-turens avfärdande', () => {
  it('sparas per användare, inte globalt', () => {
    minnsCvTurAvfardad('anna')
    expect(cvTurAvfardad('anna')).toBe(true)
    expect(cvTurAvfardad('bo')).toBe(false)
    expect(localStorage.getItem('jobin_tur_avfardad_cv_anna')).toBe('1')
    expect(localStorage.getItem('cv-onboarding-completed')).toBeNull()
  })

  it('den gamla globala nyckeln räknas som avfärdad för alla', () => {
    localStorage.setItem('cv-onboarding-completed', 'true')
    expect(shouldShowOnboarding('bo')).toBe(false)
  })

  it('resetOnboarding nollar båda', () => {
    minnsCvTurAvfardad('anna')
    localStorage.setItem('cv-onboarding-completed', 'true')
    resetOnboarding('anna')
    expect(shouldShowOnboarding('anna')).toBe(true)
  })
})
