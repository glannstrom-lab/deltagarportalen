/**
 * Hooks Index - Barrel export for all custom hooks
 */

// Auth & User
export { useAuthInit } from './useAuthInit'
export { useSupabase } from './useSupabase'
export { useAiConsent } from './useAiConsent'

// Data & State
export { useDashboardData } from './useDashboardData'
export { useApplications } from './useApplications'
export { useSavedJobs } from './useSavedJobs'
export { useDocuments } from './useDocuments'
export { useDiaryEntries, useMoodLogs, useWeeklyGoals, useGratitude, useDiaryStreaks } from './useDiary'
export { useNotifications } from './useNotifications'
export { useJourney } from './useJourney'
export { useSpontaneousCompanies } from './useSpontaneousCompanies'

// CV & Career
export { useCVAutoSave } from './useCVAutoSave'
export { useCVScore } from './useCVScore'
export { useInterestProfile, RIASEC_TYPES } from './useInterestProfile'
export { useJobMatching } from './useJobMatching'
export { useJobAlerts } from './useJobAlerts'
export { useInsights } from './useInsights'
export { useNextStep } from './useNextStep'

// Gamification
export { useGamification } from './useGamification'
export { useAchievementTracker } from './useAchievementTracker'
export { useAchievementChains } from './useAchievementChains'
export { useUnifiedProgress } from './useUnifiedProgress'
export { useLearning } from './useLearning'

// Energy & Wellness
export { useEnergyLevel } from './useEnergyLevel'
export { useMoodRecommendations } from './useMoodRecommendations'

// UI & Utilities
export { useAutoSave } from './useAutoSave'
export { useClickOutside } from './useClickOutside'
export { useFocusTrap } from './useFocusTrap'
export { useImageUpload } from './useImageUpload'
export { useVercelImageUpload } from './useVercelImageUpload'
export { useZodForm } from './useZodForm'

// Accessibility (useFocusTrap-duplikat borttagen 2026-05-15 D7)
export {
  useReducedMotion,
  useAnnounce,
  useKeyboardNavigation,
  SkipLinks,
  ScreenReaderOnly,
} from './useAccessibility'

