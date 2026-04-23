/**
 * Profile Store - Zustand
 * Centralized state management for the profile page
 * Replaces 28 useState hooks with a single store
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { userApi, cvApi, type ProfilePreferences, type CVData } from '../services/supabaseApi'
import { profileSkillsApi, profileDocumentsApi } from '../services/profileEnhancementsApi'
import { debounce } from '../lib/debounce'
import { notifications, TOAST_MESSAGES } from '../lib/toast'
import type { TabId } from '../components/profile/constants'

// ============== TYPES ==============

export interface ProfileData {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  location?: string
  bio?: string
  profile_image_url?: string
  ai_summary?: string
  created_at?: string
}

export interface ProfileCompletion {
  filled: number
  total: number
  percent: number
  nextStep?: {
    key: string
    label: string
    tab: TabId
  }
}

export interface ProfileEnhancements {
  skillsCount: number
  documentsCount: number
  hasSummary: boolean
}

export interface ProfileState {
  // Data
  profile: ProfileData | null
  preferences: ProfilePreferences
  cvData: CVData | null
  enhancements: ProfileEnhancements

  // UI State
  activeTab: TabId
  loading: boolean
  initialLoading: boolean
  cloudSyncing: boolean
  cloudSynced: boolean
  lastSyncError: string | null

  // Onboarding
  showOnboarding: boolean
  onboardingStep: number

  // Offline queue
  pendingUpdates: Partial<ProfilePreferences>[]
  isOnline: boolean

  // Computed
  completion: ProfileCompletion

  // Actions
  loadProfile: () => Promise<void>
  loadPreferences: () => Promise<void>
  loadCvData: () => Promise<void>
  loadEnhancements: () => Promise<void>
  loadAll: () => Promise<void>

  updateProfile: (data: Partial<ProfileData>) => Promise<void>
  updatePreferences: (prefs: Partial<ProfilePreferences>) => void
  updateProfileImage: (url: string | null) => void

  setActiveTab: (tab: TabId) => void
  setShowOnboarding: (show: boolean) => void
  setOnboardingStep: (step: number) => void
  completeOnboarding: () => void

  // Internal
  _debouncedSavePreferences: (prefs: Partial<ProfilePreferences>) => void
  _syncOfflineQueue: () => Promise<void>
  _calculateCompletion: () => ProfileCompletion
}

// ============== INITIAL STATE ==============

const initialPreferences: ProfilePreferences = {
  desired_jobs: [],
  interests: [],
  availability: {},
  mobility: {},
  salary: {},
  labor_market_status: {},
  work_preferences: {},
  physical_requirements: {},
  consultant_data: {},
  therapist_data: {},
  support_goals: {}
}

const initialEnhancements: ProfileEnhancements = {
  skillsCount: 0,
  documentsCount: 0,
  hasSummary: false
}

// ============== STORE ==============

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => {
      // Debounced save function
      const debouncedSave = debounce(async (prefs: Partial<ProfilePreferences>) => {
        const state = get()

        // If offline, queue the update
        if (!navigator.onLine) {
          set(s => ({
            pendingUpdates: [...s.pendingUpdates, prefs],
            cloudSynced: false,
            isOnline: false
          }))
          notifications.warning(TOAST_MESSAGES.OFFLINE)
          return
        }

        set({ cloudSyncing: true, lastSyncError: null })

        try {
          // Merge with current preferences
          const currentPrefs = state.preferences
          const mergedPrefs = {
            ...currentPrefs,
            ...prefs,
            // Deep merge nested objects
            availability: { ...currentPrefs.availability, ...prefs.availability },
            mobility: { ...currentPrefs.mobility, ...prefs.mobility },
            salary: { ...currentPrefs.salary, ...prefs.salary },
            labor_market_status: { ...currentPrefs.labor_market_status, ...prefs.labor_market_status },
            work_preferences: { ...currentPrefs.work_preferences, ...prefs.work_preferences },
            physical_requirements: { ...currentPrefs.physical_requirements, ...prefs.physical_requirements },
            consultant_data: { ...currentPrefs.consultant_data, ...prefs.consultant_data },
            therapist_data: { ...currentPrefs.therapist_data, ...prefs.therapist_data },
            support_goals: { ...currentPrefs.support_goals, ...prefs.support_goals }
          }

          await userApi.updatePreferences(mergedPrefs)

          set({
            preferences: mergedPrefs,
            cloudSynced: true,
            cloudSyncing: false,
            completion: get()._calculateCompletion()
          })
        } catch (error) {
          console.error('Save preferences error:', error)
          const errorMsg = error instanceof Error ? error.message : TOAST_MESSAGES.SAVE_ERROR
          set({
            cloudSyncing: false,
            cloudSynced: false,
            lastSyncError: errorMsg
          })
          notifications.error(errorMsg)
        }
      }, 800)

      return {
        // Initial state
        profile: null,
        preferences: initialPreferences,
        cvData: null,
        enhancements: initialEnhancements,
        activeTab: 'overview',
        loading: false,
        initialLoading: true,
        cloudSyncing: false,
        cloudSynced: true,
        lastSyncError: null,
        showOnboarding: false,
        onboardingStep: 0,
        pendingUpdates: [],
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        completion: { filled: 0, total: 12, percent: 0 },

        // Load profile
        loadProfile: async () => {
          try {
            const data = await userApi.getProfile()
            set({
              profile: data,
              completion: get()._calculateCompletion()
            })
          } catch (error) {
            console.error('Load profile error:', error)
            notifications.error('Kunde inte ladda profil')
          }
        },

        // Load preferences
        loadPreferences: async () => {
          try {
            const prefs = await userApi.getPreferences()
            set({
              preferences: prefs,
              completion: get()._calculateCompletion()
            })
          } catch (error) {
            console.error('Load preferences error:', error)
          }
        },

        // Load CV data
        loadCvData: async () => {
          try {
            const cv = await cvApi.getCV()
            set({ cvData: cv || null })
          } catch (error) {
            console.error('Load CV error:', error)
          }
        },

        // Load enhancements (skills, documents)
        loadEnhancements: async () => {
          try {
            const [skills, documents] = await Promise.all([
              profileSkillsApi.getAll(),
              profileDocumentsApi.getAll()
            ])
            set({
              enhancements: {
                skillsCount: skills.length,
                documentsCount: documents.length,
                hasSummary: Boolean(get().profile?.ai_summary)
              }
            })
          } catch (error) {
            console.error('Load enhancements error:', error)
            // Non-critical, don't show error
          }
        },

        // Load all data
        loadAll: async () => {
          set({ initialLoading: true })

          try {
            await Promise.all([
              get().loadProfile(),
              get().loadPreferences(),
              get().loadCvData(),
              get().loadEnhancements()
            ])

            // Check if onboarding should be shown
            const state = get()
            const completion = state._calculateCompletion()
            const hasSeenOnboarding = localStorage.getItem('profile_onboarding_seen')

            set({
              initialLoading: false,
              completion,
              showOnboarding: !hasSeenOnboarding && completion.percent < 30
            })
          } catch (error) {
            console.error('Load all error:', error)
            set({ initialLoading: false })
          }
        },

        // Update profile
        updateProfile: async (data) => {
          // Optimistic update
          set(s => ({
            profile: s.profile ? { ...s.profile, ...data } : data,
            cloudSynced: false
          }))

          set({ cloudSyncing: true })

          try {
            await userApi.updateProfile(data)
            set({
              cloudSynced: true,
              cloudSyncing: false,
              completion: get()._calculateCompletion()
            })
          } catch (error) {
            console.error('Update profile error:', error)
            // Rollback on error
            await get().loadProfile()
            set({ cloudSyncing: false })
            notifications.error(TOAST_MESSAGES.SAVE_ERROR)
          }
        },

        // Update preferences (debounced)
        updatePreferences: (prefs) => {
          // Immediate optimistic update for responsive UI
          set(s => ({
            preferences: {
              ...s.preferences,
              ...prefs,
              // Deep merge
              availability: { ...s.preferences.availability, ...prefs.availability },
              mobility: { ...s.preferences.mobility, ...prefs.mobility },
              salary: { ...s.preferences.salary, ...prefs.salary },
              labor_market_status: { ...s.preferences.labor_market_status, ...prefs.labor_market_status },
              work_preferences: { ...s.preferences.work_preferences, ...prefs.work_preferences },
              physical_requirements: { ...s.preferences.physical_requirements, ...prefs.physical_requirements },
              consultant_data: { ...s.preferences.consultant_data, ...prefs.consultant_data },
              therapist_data: { ...s.preferences.therapist_data, ...prefs.therapist_data },
              support_goals: { ...s.preferences.support_goals, ...prefs.support_goals }
            },
            cloudSynced: false,
            completion: get()._calculateCompletion()
          }))

          // Debounced save to backend
          debouncedSave(prefs)
        },

        // Update profile image
        updateProfileImage: (url) => {
          set(s => ({
            profile: s.profile ? { ...s.profile, profile_image_url: url || undefined } : null
          }))
        },

        // Set active tab
        setActiveTab: (tab) => {
          set({ activeTab: tab })
        },

        // Onboarding
        setShowOnboarding: (show) => set({ showOnboarding: show }),
        setOnboardingStep: (step) => set({ onboardingStep: step }),
        completeOnboarding: () => {
          localStorage.setItem('profile_onboarding_seen', 'true')
          set({ showOnboarding: false, onboardingStep: 0 })
        },

        // Internal: debounced save
        _debouncedSavePreferences: debouncedSave,

        // Sync offline queue
        _syncOfflineQueue: async () => {
          const state = get()
          if (!navigator.onLine || state.pendingUpdates.length === 0) return

          set({ cloudSyncing: true })

          try {
            // Merge all pending updates
            const mergedUpdates = state.pendingUpdates.reduce(
              (acc, update) => ({ ...acc, ...update }),
              {} as Partial<ProfilePreferences>
            )

            const currentPrefs = state.preferences
            const finalPrefs = { ...currentPrefs, ...mergedUpdates }

            await userApi.updatePreferences(finalPrefs)

            set({
              preferences: finalPrefs,
              pendingUpdates: [],
              cloudSynced: true,
              cloudSyncing: false,
              isOnline: true
            })

            notifications.success('Offline-ändringar synkade!')
          } catch (error) {
            console.error('Sync offline queue error:', error)
            set({ cloudSyncing: false })
          }
        },

        // Calculate completion
        _calculateCompletion: (): ProfileCompletion => {
          const state = get()
          const { profile, preferences } = state

          let filled = 0
          const total = 12
          let nextStep: ProfileCompletion['nextStep'] = undefined

          // Check each field
          const checks: Array<{ condition: boolean; key: string; label: string; tab: TabId }> = [
            { condition: Boolean(profile?.first_name), key: 'first_name', label: 'Förnamn', tab: 'overview' },
            { condition: Boolean(profile?.last_name), key: 'last_name', label: 'Efternamn', tab: 'overview' },
            { condition: Boolean(profile?.phone), key: 'phone', label: 'Telefon', tab: 'overview' },
            { condition: Boolean(profile?.location), key: 'location', label: 'Ort', tab: 'overview' },
            { condition: (preferences.desired_jobs?.length || 0) > 0, key: 'desired_jobs', label: 'Önskade jobb', tab: 'overview' },
            { condition: Boolean(preferences.availability?.status), key: 'availability', label: 'Tillgänglighet', tab: 'jobbsok' },
            { condition: Boolean(preferences.consultant_data?.cvStatus), key: 'cv_status', label: 'CV-status', tab: 'jobbsok' },
            { condition: Boolean(preferences.therapist_data?.energyLevel?.sustainableHoursPerDay), key: 'energy', label: 'Energinivå', tab: 'stod' },
            { condition: Boolean(preferences.support_goals?.shortTerm?.goal), key: 'short_goal', label: 'Kortsiktigt mål', tab: 'stod' },
            { condition: Boolean(preferences.support_goals?.longTerm?.goal), key: 'long_goal', label: 'Långsiktigt mål', tab: 'stod' },
            { condition: preferences.labor_market_status?.registeredAtAF !== undefined, key: 'af', label: 'AF-registrering', tab: 'jobbsok' },
            { condition: (preferences.work_preferences?.sectors?.length || 0) > 0, key: 'sectors', label: 'Önskade sektorer', tab: 'jobbsok' }
          ]

          for (const check of checks) {
            if (check.condition) {
              filled++
            } else if (!nextStep) {
              nextStep = { key: check.key, label: check.label, tab: check.tab }
            }
          }

          return {
            filled,
            total,
            percent: Math.round((filled / total) * 100),
            nextStep
          }
        }
      }
    },
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        activeTab: state.activeTab,
        pendingUpdates: state.pendingUpdates,
        onboardingStep: state.onboardingStep
      })
    }
  )
)

// ============== HOOKS ==============

// Selector hooks for better performance
export const useProfileData = () => useProfileStore(s => s.profile)
export const useProfilePreferences = () => useProfileStore(s => s.preferences)
export const useProfileCompletion = () => useProfileStore(s => s.completion)
export const useProfileLoading = () => useProfileStore(s => ({ loading: s.loading, initialLoading: s.initialLoading }))
export const useProfileSyncStatus = () => useProfileStore(s => ({
  syncing: s.cloudSyncing,
  synced: s.cloudSynced,
  error: s.lastSyncError
}))
export const useActiveTab = () => useProfileStore(s => s.activeTab)
export const useSetActiveTab = () => useProfileStore(s => s.setActiveTab)

// ============== ONLINE/OFFLINE LISTENER ==============

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useProfileStore.getState()._syncOfflineQueue()
    notifications.success(TOAST_MESSAGES.ONLINE)
  })

  window.addEventListener('offline', () => {
    useProfileStore.setState({ isOnline: false })
    notifications.warning(TOAST_MESSAGES.OFFLINE)
  })
}
