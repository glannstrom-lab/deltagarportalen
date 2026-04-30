/**
 * Validated Storage - Type-safe localStorage with Zod validation
 *
 * This module provides schema-validated localStorage access to prevent
 * data corruption and manipulation attacks. All data is validated on
 * read and sanitized on write.
 *
 * Usage:
 *   import { validatedStorage, storageSchemas } from '@/lib/validatedStorage'
 *
 *   // Get with validation
 *   const cvProgress = validatedStorage.get('cvProgress')
 *
 *   // Set with type checking
 *   validatedStorage.set('cvProgress', { completedSections: ['personal'], lastSaved: new Date().toISOString() })
 */

import { z } from 'zod'

// ============================================
// STORAGE SCHEMAS
// ============================================

/**
 * CV Progress - tracks CV builder completion
 */
export const cvProgressSchema = z.object({
  completedSections: z.array(z.string()),
  currentSection: z.string().optional(),
  lastSaved: z.string().datetime().optional(),
  progress: z.number().min(0).max(100).optional()
})

/**
 * User Preferences - UI settings
 */
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.enum(['sv', 'en']).default('sv'),
  energySaveMode: z.boolean().default(false),
  largeText: z.boolean().default(false),
  highContrast: z.boolean().default(false),
  reducedMotion: z.boolean().default(false)
})

/**
 * Onboarding State - tracks getting started progress
 */
export const onboardingStateSchema = z.object({
  completedSteps: z.array(z.string()),
  currentStep: z.number().min(0).max(10),
  dismissed: z.boolean().default(false),
  lastUpdated: z.string().datetime().optional()
})

/**
 * Interview Progress - tracks interview simulator state
 */
export const interviewProgressSchema = z.object({
  currentQuestion: z.number().min(0),
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.string(),
    feedback: z.string().optional(),
    score: z.number().min(0).max(100).optional()
  })),
  sessionId: z.string().optional(),
  startedAt: z.string().datetime().optional()
})

/**
 * Saved Jobs - local cache of saved jobs
 */
export const savedJobsSchema = z.object({
  jobs: z.array(z.object({
    id: z.string(),
    title: z.string(),
    company: z.string(),
    savedAt: z.string().datetime()
  })),
  lastSynced: z.string().datetime().optional()
})

/**
 * Cookie Consent - GDPR consent tracking
 */
export const cookieConsentSchema = z.object({
  analytics: z.boolean(),
  marketing: z.boolean(),
  necessary: z.literal(true), // Always true
  consentedAt: z.string().datetime(),
  version: z.string().optional()
})

/**
 * Interest Guide Results - RIASEC scores
 */
export const interestGuideResultsSchema = z.object({
  scores: z.object({
    realistic: z.number().min(0).max(100),
    investigative: z.number().min(0).max(100),
    artistic: z.number().min(0).max(100),
    social: z.number().min(0).max(100),
    enterprising: z.number().min(0).max(100),
    conventional: z.number().min(0).max(100)
  }),
  completedAt: z.string().datetime(),
  answeredQuestions: z.number().min(0)
})

/**
 * Draft Cover Letter - auto-saved draft
 */
export const draftCoverLetterSchema = z.object({
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  content: z.string(),
  lastSaved: z.string().datetime(),
  jobId: z.string().optional()
})

/**
 * Energy Level History - wellness tracking
 */
export const energyLevelHistorySchema = z.object({
  entries: z.array(z.object({
    date: z.string(),
    level: z.enum(['low', 'medium', 'high']),
    note: z.string().optional()
  })).max(30), // Keep last 30 days
  lastUpdated: z.string().datetime()
})

/**
 * Job Search Filters - persists user's last filter selection across sessions
 */
export const jobSearchFiltersSchema = z.object({
  query: z.string().max(200).default(''),
  municipality: z.string().max(100).default(''),
  region: z.string().max(20).default(''),
  employmentType: z.string().max(100).default(''),
  publishedWithin: z.enum(['today', 'week', 'month', 'all']).default('all')
})

/**
 * Calendar Preferences - calendar view settings
 */
export const calendarPreferencesSchema = z.object({
  defaultView: z.enum(['day', 'week', 'month']).default('week'),
  showWeekNumbers: z.boolean().default(false),
  firstDayOfWeek: z.number().min(0).max(6).default(1), // 1 = Monday
  workingHours: z.object({
    start: z.number().min(0).max(23).default(8),
    end: z.number().min(0).max(23).default(17)
  }).optional()
})

// ============================================
// SCHEMA REGISTRY
// ============================================

export const storageSchemas = {
  cvProgress: cvProgressSchema,
  userPreferences: userPreferencesSchema,
  onboardingState: onboardingStateSchema,
  interviewProgress: interviewProgressSchema,
  savedJobs: savedJobsSchema,
  cookieConsent: cookieConsentSchema,
  interestGuideResults: interestGuideResultsSchema,
  draftCoverLetter: draftCoverLetterSchema,
  energyLevelHistory: energyLevelHistorySchema,
  calendarPreferences: calendarPreferencesSchema,
  jobSearchFilters: jobSearchFiltersSchema
} as const

// Type for storage keys
export type StorageKey = keyof typeof storageSchemas

// Infer types from schemas
export type CVProgress = z.infer<typeof cvProgressSchema>
export type UserPreferences = z.infer<typeof userPreferencesSchema>
export type OnboardingState = z.infer<typeof onboardingStateSchema>
export type InterviewProgress = z.infer<typeof interviewProgressSchema>
export type SavedJobs = z.infer<typeof savedJobsSchema>
export type CookieConsent = z.infer<typeof cookieConsentSchema>
export type InterestGuideResults = z.infer<typeof interestGuideResultsSchema>
export type DraftCoverLetter = z.infer<typeof draftCoverLetterSchema>
export type EnergyLevelHistory = z.infer<typeof energyLevelHistorySchema>
export type CalendarPreferences = z.infer<typeof calendarPreferencesSchema>
export type JobSearchFilters = z.infer<typeof jobSearchFiltersSchema>

// Type map for get/set operations
type StorageTypeMap = {
  cvProgress: CVProgress
  userPreferences: UserPreferences
  onboardingState: OnboardingState
  interviewProgress: InterviewProgress
  savedJobs: SavedJobs
  cookieConsent: CookieConsent
  interestGuideResults: InterestGuideResults
  draftCoverLetter: DraftCoverLetter
  energyLevelHistory: EnergyLevelHistory
  calendarPreferences: CalendarPreferences
  jobSearchFilters: JobSearchFilters
}

// ============================================
// VALIDATED STORAGE CLASS
// ============================================

const STORAGE_PREFIX = 'dp_validated_'

class ValidatedStorage {
  /**
   * Get a validated item from localStorage
   * Returns null if not found or validation fails
   */
  get<K extends StorageKey>(key: K): StorageTypeMap[K] | null {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key)

      if (raw === null) {
        return null
      }

      const parsed = JSON.parse(raw)
      const schema = storageSchemas[key]
      const result = schema.safeParse(parsed)

      if (!result.success) {
        // Log validation error and clear corrupted data
        console.warn(
          `[ValidatedStorage] Validation failed for "${key}":`,
          result.error.issues.map(i => i.message).join(', ')
        )
        this.remove(key)
        return null
      }

      return result.data as StorageTypeMap[K]
    } catch (error) {
      console.error(`[ValidatedStorage] Error reading "${key}":`, error)
      this.remove(key)
      return null
    }
  }

  /**
   * Set a validated item in localStorage
   * Returns false if validation fails
   */
  set<K extends StorageKey>(key: K, value: StorageTypeMap[K]): boolean {
    try {
      const schema = storageSchemas[key]
      const result = schema.safeParse(value)

      if (!result.success) {
        console.error(
          `[ValidatedStorage] Cannot save invalid data for "${key}":`,
          result.error.issues.map(i => i.message).join(', ')
        )
        return false
      }

      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(result.data))
      return true
    } catch (error) {
      console.error(`[ValidatedStorage] Error saving "${key}":`, error)
      return false
    }
  }

  /**
   * Remove an item from localStorage
   */
  remove(key: StorageKey): void {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key)
    } catch (error) {
      console.error(`[ValidatedStorage] Error removing "${key}":`, error)
    }
  }

  /**
   * Check if a key exists and has valid data
   */
  has(key: StorageKey): boolean {
    return this.get(key) !== null
  }

  /**
   * Get with a default value if not found
   */
  getOrDefault<K extends StorageKey>(key: K, defaultValue: StorageTypeMap[K]): StorageTypeMap[K] {
    const value = this.get(key)
    return value ?? defaultValue
  }

  /**
   * Update an existing item (merge with existing data)
   */
  update<K extends StorageKey>(
    key: K,
    updater: (current: StorageTypeMap[K] | null) => StorageTypeMap[K]
  ): boolean {
    const current = this.get(key)
    const updated = updater(current)
    return this.set(key, updated)
  }

  /**
   * Clear all validated storage items
   */
  clearAll(): void {
    try {
      const keysToRemove: string[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.error('[ValidatedStorage] Error clearing storage:', error)
    }
  }

  /**
   * Validate all stored data and remove corrupted entries
   * Call this on app startup to ensure data integrity
   */
  validateAll(): { valid: StorageKey[]; invalid: StorageKey[] } {
    const valid: StorageKey[] = []
    const invalid: StorageKey[] = []

    for (const key of Object.keys(storageSchemas) as StorageKey[]) {
      const raw = localStorage.getItem(STORAGE_PREFIX + key)

      if (raw === null) {
        continue // Not stored, skip
      }

      try {
        const parsed = JSON.parse(raw)
        const schema = storageSchemas[key]
        const result = schema.safeParse(parsed)

        if (result.success) {
          valid.push(key)
        } else {
          invalid.push(key)
          this.remove(key)
        }
      } catch {
        invalid.push(key)
        this.remove(key)
      }
    }

    if (invalid.length > 0) {
      console.warn('[ValidatedStorage] Removed corrupted data:', invalid)
    }

    return { valid, invalid }
  }
}

// Export singleton instance
export const validatedStorage = new ValidatedStorage()

// Export for testing
export { ValidatedStorage }
