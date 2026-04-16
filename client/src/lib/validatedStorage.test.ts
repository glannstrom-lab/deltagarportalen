import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  storageSchemas,
  cvProgressSchema,
  userPreferencesSchema,
  onboardingStateSchema,
  interviewProgressSchema,
  savedJobsSchema,
  cookieConsentSchema,
  interestGuideResultsSchema,
  draftCoverLetterSchema,
  energyLevelHistorySchema,
  calendarPreferencesSchema,
  ValidatedStorage,
  type StorageKey,
} from './validatedStorage'

const STORAGE_PREFIX = 'dp_validated_'

describe('validatedStorage', () => {
  let mockStorage: Record<string, string>
  let testStorage: InstanceType<typeof ValidatedStorage>

  beforeEach(() => {
    mockStorage = {}

    // Create a mock localStorage
    const mockLocalStorage = {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => { mockStorage[key] = value },
      removeItem: (key: string) => { delete mockStorage[key] },
      key: (index: number) => Object.keys(mockStorage)[index] ?? null,
      get length() { return Object.keys(mockStorage).length },
      clear: () => { mockStorage = {} }
    }

    // Mock global localStorage
    vi.stubGlobal('localStorage', mockLocalStorage)

    // Create fresh instance for testing
    testStorage = new ValidatedStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('Zod Schemas', () => {
    describe('cvProgressSchema', () => {
      it('should validate valid CV progress', () => {
        const valid = {
          completedSections: ['personal', 'experience'],
          currentSection: 'education',
          lastSaved: '2026-04-16T10:00:00.000Z',
          progress: 65,
        }
        expect(cvProgressSchema.safeParse(valid).success).toBe(true)
      })

      it('should reject invalid progress percentage', () => {
        const invalid = {
          completedSections: [],
          progress: 150, // Over 100
        }
        expect(cvProgressSchema.safeParse(invalid).success).toBe(false)
      })

      it('should allow minimal valid data', () => {
        const minimal = {
          completedSections: [],
        }
        expect(cvProgressSchema.safeParse(minimal).success).toBe(true)
      })
    })

    describe('userPreferencesSchema', () => {
      it('should validate user preferences', () => {
        const valid = {
          theme: 'dark',
          language: 'sv',
          energySaveMode: true,
          largeText: true,
          highContrast: false,
          reducedMotion: true,
        }
        expect(userPreferencesSchema.safeParse(valid).success).toBe(true)
      })

      it('should reject invalid theme', () => {
        const invalid = {
          theme: 'neon', // Not a valid theme
        }
        expect(userPreferencesSchema.safeParse(invalid).success).toBe(false)
      })

      it('should apply defaults', () => {
        const minimal = {}
        const result = userPreferencesSchema.safeParse(minimal)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.theme).toBe('system')
          expect(result.data.language).toBe('sv')
        }
      })
    })

    describe('onboardingStateSchema', () => {
      it('should validate onboarding state', () => {
        const valid = {
          completedSteps: ['welcome', 'profile'],
          currentStep: 3,
          dismissed: false,
          lastUpdated: '2026-04-16T10:00:00.000Z',
        }
        expect(onboardingStateSchema.safeParse(valid).success).toBe(true)
      })

      it('should require completedSteps and currentStep', () => {
        const invalid = {
          dismissed: true,
        }
        expect(onboardingStateSchema.safeParse(invalid).success).toBe(false)
      })
    })

    describe('interviewProgressSchema', () => {
      it('should validate interview progress', () => {
        const valid = {
          currentQuestion: 5,
          answers: [
            { questionId: 'q1', answer: 'My answer', feedback: 'Good!', score: 85 },
          ],
          sessionId: 'session-123',
          startedAt: '2026-04-16T10:00:00.000Z',
        }
        expect(interviewProgressSchema.safeParse(valid).success).toBe(true)
      })

      it('should reject score outside range', () => {
        const invalid = {
          currentQuestion: 0,
          answers: [
            { questionId: 'q1', answer: 'test', score: 150 }, // Over 100
          ],
        }
        expect(interviewProgressSchema.safeParse(invalid).success).toBe(false)
      })
    })

    describe('savedJobsSchema', () => {
      it('should validate saved jobs', () => {
        const valid = {
          jobs: [
            { id: 'job-1', title: 'Developer', company: 'Tech AB', savedAt: '2026-04-16T10:00:00.000Z' },
          ],
          lastSynced: '2026-04-16T10:00:00.000Z',
        }
        expect(savedJobsSchema.safeParse(valid).success).toBe(true)
      })

      it('should allow empty jobs array', () => {
        const valid = {
          jobs: [],
        }
        expect(savedJobsSchema.safeParse(valid).success).toBe(true)
      })
    })

    describe('cookieConsentSchema', () => {
      it('should validate cookie consent', () => {
        const valid = {
          analytics: true,
          marketing: false,
          necessary: true,
          consentedAt: '2026-04-16T10:00:00.000Z',
          version: '1.0',
        }
        expect(cookieConsentSchema.safeParse(valid).success).toBe(true)
      })

      it('should require necessary to be true', () => {
        const invalid = {
          analytics: true,
          marketing: false,
          necessary: false, // Must be true
          consentedAt: '2026-04-16T10:00:00.000Z',
        }
        expect(cookieConsentSchema.safeParse(invalid).success).toBe(false)
      })
    })

    describe('interestGuideResultsSchema', () => {
      it('should validate interest guide results', () => {
        const valid = {
          scores: {
            realistic: 70,
            investigative: 85,
            artistic: 60,
            social: 90,
            enterprising: 55,
            conventional: 45,
          },
          completedAt: '2026-04-16T10:00:00.000Z',
          answeredQuestions: 48,
        }
        expect(interestGuideResultsSchema.safeParse(valid).success).toBe(true)
      })

      it('should reject scores over 100', () => {
        const invalid = {
          scores: {
            realistic: 110, // Over 100
            investigative: 85,
            artistic: 60,
            social: 90,
            enterprising: 55,
            conventional: 45,
          },
          completedAt: '2026-04-16T10:00:00.000Z',
          answeredQuestions: 48,
        }
        expect(interestGuideResultsSchema.safeParse(invalid).success).toBe(false)
      })
    })

    describe('draftCoverLetterSchema', () => {
      it('should validate draft cover letter', () => {
        const valid = {
          jobTitle: 'Frontend Developer',
          company: 'Tech AB',
          content: 'Till rekryteringsansvarig...',
          lastSaved: '2026-04-16T10:00:00.000Z',
          jobId: 'job-123',
        }
        expect(draftCoverLetterSchema.safeParse(valid).success).toBe(true)
      })

      it('should require content and lastSaved', () => {
        const invalid = {
          jobTitle: 'Developer',
          // Missing content and lastSaved
        }
        expect(draftCoverLetterSchema.safeParse(invalid).success).toBe(false)
      })
    })

    describe('energyLevelHistorySchema', () => {
      it('should validate energy level history', () => {
        const valid = {
          entries: [
            { date: '2026-04-16', level: 'high', note: 'Feeling great!' },
            { date: '2026-04-15', level: 'medium' },
          ],
          lastUpdated: '2026-04-16T10:00:00.000Z',
        }
        expect(energyLevelHistorySchema.safeParse(valid).success).toBe(true)
      })

      it('should reject invalid energy level', () => {
        const invalid = {
          entries: [
            { date: '2026-04-16', level: 'extreme' }, // Not valid
          ],
          lastUpdated: '2026-04-16T10:00:00.000Z',
        }
        expect(energyLevelHistorySchema.safeParse(invalid).success).toBe(false)
      })

      it('should limit entries to 30', () => {
        const tooMany = {
          entries: Array(31).fill({ date: '2026-04-16', level: 'medium' }),
          lastUpdated: '2026-04-16T10:00:00.000Z',
        }
        expect(energyLevelHistorySchema.safeParse(tooMany).success).toBe(false)
      })
    })

    describe('calendarPreferencesSchema', () => {
      it('should validate calendar preferences', () => {
        const valid = {
          defaultView: 'week',
          showWeekNumbers: true,
          firstDayOfWeek: 1,
          workingHours: { start: 9, end: 17 },
        }
        expect(calendarPreferencesSchema.safeParse(valid).success).toBe(true)
      })

      it('should reject invalid view', () => {
        const invalid = {
          defaultView: 'year', // Not valid
        }
        expect(calendarPreferencesSchema.safeParse(invalid).success).toBe(false)
      })

      it('should apply defaults', () => {
        const minimal = {}
        const result = calendarPreferencesSchema.safeParse(minimal)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.defaultView).toBe('week')
          expect(result.data.firstDayOfWeek).toBe(1)
        }
      })
    })
  })

  describe('ValidatedStorage class', () => {
    describe('get()', () => {
      it('should return null for non-existent key', () => {
        const result = testStorage.get('cvProgress')
        expect(result).toBeNull()
      })

      it('should return parsed data for valid stored data', () => {
        const data = {
          completedSections: ['personal'],
          progress: 25,
        }
        mockStorage[`${STORAGE_PREFIX}cvProgress`] = JSON.stringify(data)

        const result = testStorage.get('cvProgress')
        expect(result).toEqual(data)
      })

      it('should return null for invalid JSON', () => {
        mockStorage[`${STORAGE_PREFIX}cvProgress`] = 'not valid json{'

        const result = testStorage.get('cvProgress')
        expect(result).toBeNull()
      })

      it('should return null for data that fails validation', () => {
        const invalidData = {
          completedSections: 'not an array', // Should be array
          progress: 200, // Should be 0-100
        }
        mockStorage[`${STORAGE_PREFIX}cvProgress`] = JSON.stringify(invalidData)

        const result = testStorage.get('cvProgress')
        expect(result).toBeNull()
      })
    })

    describe('set()', () => {
      it('should store valid data', () => {
        const data = {
          completedSections: ['personal', 'experience'],
          progress: 50,
        }

        const result = testStorage.set('cvProgress', data)

        expect(result).toBe(true)
        expect(JSON.parse(mockStorage[`${STORAGE_PREFIX}cvProgress`])).toEqual(data)
      })

      it('should reject invalid data', () => {
        const invalidData = {
          completedSections: 'not an array',
        } as any

        const result = testStorage.set('cvProgress', invalidData)

        expect(result).toBe(false)
        expect(mockStorage[`${STORAGE_PREFIX}cvProgress`]).toBeUndefined()
      })
    })

    describe('remove()', () => {
      it('should remove item from storage', () => {
        mockStorage[`${STORAGE_PREFIX}cvProgress`] = JSON.stringify({ completedSections: [] })

        testStorage.remove('cvProgress')

        expect(mockStorage[`${STORAGE_PREFIX}cvProgress`]).toBeUndefined()
      })
    })

    describe('has()', () => {
      it('should return true for existing valid data', () => {
        mockStorage[`${STORAGE_PREFIX}cvProgress`] = JSON.stringify({ completedSections: [] })

        expect(testStorage.has('cvProgress')).toBe(true)
      })

      it('should return false for non-existent key', () => {
        expect(testStorage.has('cvProgress')).toBe(false)
      })

      it('should return false for invalid data', () => {
        mockStorage[`${STORAGE_PREFIX}cvProgress`] = JSON.stringify({ completedSections: 'invalid' })

        expect(testStorage.has('cvProgress')).toBe(false)
      })
    })

    describe('getOrDefault()', () => {
      it('should return stored value when exists', () => {
        const data = { completedSections: ['personal'], progress: 50 }
        mockStorage[`${STORAGE_PREFIX}cvProgress`] = JSON.stringify(data)

        const defaultValue = { completedSections: [], progress: 0 }
        const result = testStorage.getOrDefault('cvProgress', defaultValue)

        expect(result).toEqual(data)
      })

      it('should return default when not exists', () => {
        const defaultValue = { completedSections: [], progress: 0 }
        const result = testStorage.getOrDefault('cvProgress', defaultValue)

        expect(result).toEqual(defaultValue)
      })
    })

    describe('update()', () => {
      it('should update existing data', () => {
        const initial = { completedSections: ['personal'], progress: 25 }
        mockStorage[`${STORAGE_PREFIX}cvProgress`] = JSON.stringify(initial)

        const result = testStorage.update('cvProgress', (current) => ({
          ...current!,
          completedSections: [...current!.completedSections, 'experience'],
          progress: 50,
        }))

        expect(result).toBe(true)
        const stored = JSON.parse(mockStorage[`${STORAGE_PREFIX}cvProgress`])
        expect(stored.completedSections).toContain('experience')
        expect(stored.progress).toBe(50)
      })

      it('should create new data when not exists', () => {
        const result = testStorage.update('cvProgress', () => ({
          completedSections: ['personal'],
          progress: 25,
        }))

        expect(result).toBe(true)
        expect(mockStorage[`${STORAGE_PREFIX}cvProgress`]).toBeDefined()
      })
    })

    describe('clearAll()', () => {
      it('should clear all validated storage items', () => {
        mockStorage[`${STORAGE_PREFIX}cvProgress`] = JSON.stringify({ completedSections: [] })
        mockStorage[`${STORAGE_PREFIX}userPreferences`] = JSON.stringify({ theme: 'dark' })
        mockStorage['other_key'] = 'should remain'

        testStorage.clearAll()

        expect(mockStorage[`${STORAGE_PREFIX}cvProgress`]).toBeUndefined()
        expect(mockStorage[`${STORAGE_PREFIX}userPreferences`]).toBeUndefined()
        expect(mockStorage['other_key']).toBe('should remain')
      })
    })

    describe('validateAll()', () => {
      it('should report valid and invalid keys', () => {
        // Valid data
        mockStorage[`${STORAGE_PREFIX}cvProgress`] = JSON.stringify({ completedSections: ['personal'] })

        // Invalid data
        mockStorage[`${STORAGE_PREFIX}userPreferences`] = JSON.stringify({ theme: 'invalid-theme' })

        const result = testStorage.validateAll()

        expect(result.valid).toContain('cvProgress')
        expect(result.invalid).toContain('userPreferences')
      })

      it('should handle empty storage', () => {
        const result = testStorage.validateAll()

        expect(result.valid).toEqual([])
        expect(result.invalid).toEqual([])
      })

      it('should remove invalid data', () => {
        mockStorage[`${STORAGE_PREFIX}cvProgress`] = JSON.stringify({ invalid: true })

        testStorage.validateAll()

        expect(mockStorage[`${STORAGE_PREFIX}cvProgress`]).toBeUndefined()
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle null values in optional fields', () => {
      const data = {
        completedSections: [],
        currentSection: undefined,
        lastSaved: undefined,
        progress: undefined,
      }

      const result = testStorage.set('cvProgress', data)
      expect(result).toBe(true)
    })

    it('should handle empty arrays', () => {
      const data = {
        jobs: [],
        lastSynced: '2026-04-16T10:00:00.000Z',
      }

      const result = testStorage.set('savedJobs', data)
      expect(result).toBe(true)
    })

    it('should preserve data integrity through get/set cycle', () => {
      const original = {
        completedSections: ['personal', 'experience', 'education'],
        currentSection: 'skills',
        lastSaved: '2026-04-16T10:00:00.000Z',
        progress: 75,
      }

      testStorage.set('cvProgress', original)
      const retrieved = testStorage.get('cvProgress')

      expect(retrieved).toEqual(original)
    })
  })
})
