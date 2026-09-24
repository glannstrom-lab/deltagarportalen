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

/**
 * Golvet: ingen nyckel får försvinna ur listan tyst.
 *
 * Tillagt 2026-09-24 efter ett mutationsstickprov: 'wellness_data' och
 * 'calendar_mood_entries' — hälsouppgifter, art. 9 — kunde strykas ur
 * USER_SCOPED_STORAGE_KEYS utan att ett enda test föll. Testet ovan pinnar bara
 * nycklarna från uppdrag B. Nästa person som loggade in på samma dator hade då
 * fått föregångarens mående.
 *
 * Listan nedan är hela USER_SCOPED_STORAGE_KEYS den 2026-09-24. Nya nycklar får
 * läggas till i källan utan att röra testet (arrayContaining); att TA BORT en
 * kräver att den stryks här också, alltså ett medvetet beslut.
 */
describe('USER_SCOPED_STORAGE_KEYS — golv', () => {
  const GOLV = [
    'auth-storage', 'cv-edit-version', 'cv-draft', 'cv-last-saved', 'cv-data',
    'default_cv_id', 'cover-letter-write-draft', 'spontaneous-focus-draft',
    'job-applications-crm', 'platsbanken_saved_jobs', 'platsbanken_saved_searches',
    'interest-guide-share', 'interest-result', 'wellness_data', 'dailyTaskDate',
    'dailyTaskIndex', 'dailyTaskCompleted', 'energy-level', 'calendar_events',
    'calendar_goals', 'calendar_mood_entries', 'content-calendar', 'brand-audit-answers',
    'portfolio-items', 'elevator-pitches', 'visibility-progress', 'article_bookmarks',
    'article-bookmarks', 'article_checklists', 'integration-checklist',
    'negotiationChecklist', 'negotiationPrep', 'culture-preferences',
    'dashboard_preferences', 'user_preferences', 'savedJobs', 'saved-jobs',
    'interview_sessions', 'interview_simulator_sessions', 'interview_simulator_utkast',
    'ai-team-storage', 'cv-ui-storage', 'energy-storage', 'profile-storage',
    'jobin_senaste_sidor', 'jobin_daily_job', 'jobin_daily_job_date',
    'jobin_daily_job_filter', 'jobin_daily_job_seen',
  ]

  it('innehåller varje nyckel som fanns 2026-09-24', () => {
    const saknas = GOLV.filter((k) => !USER_SCOPED_STORAGE_KEYS.includes(k))
    expect(saknas, 'nycklar som inte längre rensas vid utloggning').toEqual([])
  })

  it('hälsouppgifterna rensas på riktigt', () => {
    for (const k of ['wellness_data', 'calendar_mood_entries', 'energy-level']) {
      localStorage.setItem(k, '{"x":1}')
    }
    clearUserScopedStorage()
    for (const k of ['wellness_data', 'calendar_mood_entries', 'energy-level']) {
      expect(localStorage.getItem(k), k).toBeNull()
    }
  })
})
