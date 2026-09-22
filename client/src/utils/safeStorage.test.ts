/**
 * Uppdrag B (2026-09-22, "persistens och utloggning"): stores-passet hittade
 * innehållsbärande localStorage-nycklar som låg UTANFÖR
 * `USER_SCOPED_STORAGE_KEYS` och därför överlevde `clearUserScopedStorage()`
 * — sparade jobb, intervjusimulatorns sessioner/utkast, och fyra
 * Zustand-persisterade stores vars in-memory-rensning
 * (`lib/rensaVidUtloggning.ts`) bara triggar om store-modulen redan laddats
 * i sessionen.
 *
 * Testet nedan verifierar mekaniken direkt mot `localStorage` (jsdom), inte
 * bara att strängarna står i listan — en sträng i en array bevisar
 * ingenting om vad `clearUserScopedStorage()` faktiskt gör vid körning.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { USER_SCOPED_STORAGE_KEYS, clearUserScopedStorage } from './safeStorage'

const NYA_NYCKLAR_UPPDRAG_B = [
  'savedJobs',
  'saved-jobs',
  'interview_sessions',
  'interview_simulator_sessions',
  'interview_simulator_utkast',
  'ai-team-storage',
  'cv-ui-storage',
  'energy-storage',
  'profile-storage',
] as const

beforeEach(() => {
  localStorage.clear()
})

describe('USER_SCOPED_STORAGE_KEYS — uppdrag B, 2026-09-22', () => {
  it('innehåller de nya nycklarna (sparade jobb, intervjusimulator, fyra Zustand-stores)', () => {
    for (const key of NYA_NYCKLAR_UPPDRAG_B) {
      expect(USER_SCOPED_STORAGE_KEYS, `saknar "${key}"`).toContain(key)
    }
  })

  it('clearUserScopedStorage() raderar de nya nycklarna på riktigt, inte bara i listan', () => {
    for (const key of NYA_NYCKLAR_UPPDRAG_B) localStorage.setItem(key, 'x')
    // Sanity: faktiskt satta innan rensning, annars bevisar removeItem inget.
    for (const key of NYA_NYCKLAR_UPPDRAG_B) expect(localStorage.getItem(key)).toBe('x')

    clearUserScopedStorage()

    for (const key of NYA_NYCKLAR_UPPDRAG_B) {
      expect(localStorage.getItem(key), `"${key}" borde vara raderad`).toBeNull()
    }
  })

  it('rör INTE deltagarportal-settings — nyckeln blandar innehåll med tillgänglighetsval som ska överleva', () => {
    // Se motiveringen i safeStorage.ts: en blank removeItem() på den här
    // nyckeln skulle nolla language/highContrast/largeText/calmMode/
    // focusMode/grafikstil tillsammans med notisinställningarna, eftersom
    // clearUserScopedStorage() inte gör partiell rensning.
    expect(USER_SCOPED_STORAGE_KEYS).not.toContain('deltagarportal-settings')

    localStorage.setItem('deltagarportal-settings', JSON.stringify({ state: { language: 'en', highContrast: true } }))
    clearUserScopedStorage()
    expect(localStorage.getItem('deltagarportal-settings')).not.toBeNull()
  })

  it('USER_SCOPED_STORAGE_KEYS har inga dubbletter', () => {
    const unika = new Set(USER_SCOPED_STORAGE_KEYS)
    expect(unika.size).toBe(USER_SCOPED_STORAGE_KEYS.length)
  })
})
