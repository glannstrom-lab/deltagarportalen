/**
 * Career Onboarding Component
 * Smart onboarding that uses existing profile data and only asks for missing information
 */

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass, Briefcase, GraduationCap, TrendingUp, Target,
  Heart, Sparkles, CheckCircle, ArrowRight, Rocket, Lightbulb, Loader2, User
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { useInterestProfile, RIASEC_TYPES, type RiasecScores } from '@/hooks/useInterestProfile'
import { unifiedProfileApi, type UnifiedProfileData } from '@/services/unifiedProfileApi'

interface CareerOnboardingProps {
  onComplete: (preferences: CareerPreferences) => void
  onSkip: () => void
}

export interface CareerPreferences {
  currentSituation: string
  interests: string[]
  goals: string[]
  location: string
  experience: string
  // Track data source
  dataSource?: {
    interests: 'profile' | 'manual'
    experience: 'profile' | 'manual'
  }
}

// Map RIASEC types to our interest categories
const RIASEC_TO_INTERESTS: Record<keyof RiasecScores, string[]> = {
  realistic: ['trades', 'outdoors'],
  investigative: ['tech'],
  artistic: ['creative'],
  social: ['healthcare', 'education', 'service'],
  enterprising: ['business'],
  conventional: ['business'],
}

const SITUATIONS = [
  { id: 'unemployed', icon: Compass, color: 'teal' },
  { id: 'employed', icon: Briefcase, color: 'blue' },
  { id: 'student', icon: GraduationCap, color: 'violet' },
  { id: 'career-change', icon: TrendingUp, color: 'amber' },
]

const INTERESTS = [
  { id: 'tech', icon: '💻' },
  { id: 'healthcare', icon: '🏥' },
  { id: 'education', icon: '📚' },
  { id: 'creative', icon: '🎨' },
  { id: 'business', icon: '📊' },
  { id: 'trades', icon: '🔧' },
  { id: 'service', icon: '🤝' },
  { id: 'outdoors', icon: '🌿' },
]

const GOALS = [
  { id: 'find-job', icon: Target },
  { id: 'career-change', icon: Rocket },
  { id: 'advance', icon: TrendingUp },
  { id: 'explore', icon: Lightbulb },
]

const EXPERIENCE_LEVELS = [
  { id: 'entry', years: '0-2', maxYears: 2 },
  { id: 'mid', years: '3-5', maxYears: 5 },
  { id: 'senior', years: '6-10', maxYears: 10 },
  { id: 'expert', years: '10+', maxYears: Infinity },
]

/**
 * Calculate years of experience from work history
 */
function calculateExperienceYears(workExperience: Array<{ startDate?: string; endDate?: string; current?: boolean }> = []): number {
  let totalMonths = 0

  for (const job of workExperience) {
    if (!job.startDate) continue

    const start = new Date(job.startDate)
    const end = job.current || !job.endDate ? new Date() : new Date(job.endDate)

    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    totalMonths += Math.max(0, months)
  }

  return Math.round(totalMonths / 12)
}

/**
 * Map experience years to experience level ID
 */
function getExperienceLevelFromYears(years: number): string {
  if (years <= 2) return 'entry'
  if (years <= 5) return 'mid'
  if (years <= 10) return 'senior'
  return 'expert'
}

/**
 * Get interests from RIASEC scores (top 2 types -> corresponding interests)
 */
function getInterestsFromRiasec(dominantTypes: Array<{ code: keyof RiasecScores; score: number }>): string[] {
  const interests = new Set<string>()

  // Take top 2 dominant types
  dominantTypes.slice(0, 2).forEach(({ code }) => {
    const mappedInterests = RIASEC_TO_INTERESTS[code] || []
    mappedInterests.forEach(i => interests.add(i))
  })

  return Array.from(interests)
}

export function CareerOnboarding({ onComplete, onSkip }: CareerOnboardingProps) {
  const { t } = useTranslation()
  const { profile: interestProfile, isLoading: loadingInterests } = useInterestProfile()

  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [unifiedProfile, setUnifiedProfile] = useState<Partial<UnifiedProfileData> | null>(null)
  const [step, setStep] = useState(0)
  const [showProfileSummary, setShowProfileSummary] = useState(false)

  const [preferences, setPreferences] = useState<CareerPreferences>({
    currentSituation: '',
    interests: [],
    goals: [],
    location: '',
    experience: '',
  })

  // Load unified profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await unifiedProfileApi.getProfile()
        setUnifiedProfile(profile)
      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }
    loadProfile()
  }, [])

  // Pre-fill data from existing sources once loaded
  useEffect(() => {
    if (loadingInterests || isLoadingProfile) return

    const newPreferences: CareerPreferences = { ...preferences }
    const dataSource: CareerPreferences['dataSource'] = {
      interests: 'manual',
      experience: 'manual',
    }

    // Pre-fill interests from RIASEC profile
    if (interestProfile.hasResult && interestProfile.dominantTypes.length > 0) {
      const derivedInterests = getInterestsFromRiasec(interestProfile.dominantTypes)
      if (derivedInterests.length > 0) {
        newPreferences.interests = derivedInterests
        dataSource.interests = 'profile'
      }
    }

    // Pre-fill experience from work history
    if (unifiedProfile?.professional?.workExperience?.length) {
      const years = calculateExperienceYears(unifiedProfile.professional.workExperience)
      newPreferences.experience = getExperienceLevelFromYears(years)
      dataSource.experience = 'profile'
    }

    // Pre-fill location from profile
    if (unifiedProfile?.core?.location) {
      newPreferences.location = unifiedProfile.core.location
    }

    newPreferences.dataSource = dataSource
    setPreferences(newPreferences)

    // If we have significant existing data, show summary first
    const hasExistingData = dataSource.interests === 'profile' || dataSource.experience === 'profile'
    setShowProfileSummary(hasExistingData)

  }, [loadingInterests, isLoadingProfile, interestProfile, unifiedProfile])

  // Determine which steps to show based on existing data
  const steps = useMemo(() => {
    const stepsToShow: Array<'situation' | 'interests' | 'goals' | 'experience'> = []

    // Always show situation - it's contextual to NOW
    stepsToShow.push('situation')

    // Only show interests if we don't have RIASEC data
    if (!interestProfile.hasResult || interestProfile.dominantTypes.length === 0) {
      stepsToShow.push('interests')
    }

    // Always show goals - they're personal and important
    stepsToShow.push('goals')

    // Only show experience if we don't have work history
    if (!unifiedProfile?.professional?.workExperience?.length) {
      stepsToShow.push('experience')
    }

    return stepsToShow
  }, [interestProfile, unifiedProfile])

  const totalSteps = steps.length
  const currentStepType = steps[step]

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1)
    } else {
      onComplete(preferences)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    } else if (showProfileSummary) {
      setShowProfileSummary(true)
    }
  }

  const handleStartFromSummary = () => {
    setShowProfileSummary(false)
    setStep(0)
  }

  const handleUseExistingData = () => {
    // If we have all the data we need, complete immediately
    if (preferences.goals.length === 0) {
      // Need at least goals
      setShowProfileSummary(false)
      setStep(steps.indexOf('goals') >= 0 ? steps.indexOf('goals') : 0)
    } else {
      onComplete(preferences)
    }
  }

  const canProceed = () => {
    switch (currentStepType) {
      case 'situation': return preferences.currentSituation !== ''
      case 'interests': return preferences.interests.length > 0
      case 'goals': return preferences.goals.length > 0
      case 'experience': return preferences.experience !== ''
      default: return true
    }
  }

  const toggleInterest = (id: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id],
      dataSource: { ...prev.dataSource, interests: 'manual' } as CareerPreferences['dataSource']
    }))
  }

  const toggleGoal = (id: string) => {
    setPreferences(prev => ({
      ...prev,
      goals: prev.goals.includes(id)
        ? prev.goals.filter(g => g !== id)
        : [...prev.goals, id]
    }))
  }

  // Loading state
  if (loadingInterests || isLoadingProfile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
        <p className="text-stone-600 dark:text-stone-400">
          {t('career.onboarding.loadingProfile')}
        </p>
      </div>
    )
  }

  // Profile summary screen (when we have existing data)
  if (showProfileSummary) {
    const userName = unifiedProfile?.core?.firstName || ''
    const hasRiasec = interestProfile.hasResult && interestProfile.dominantTypes.length > 0
    const hasExperience = unifiedProfile?.professional?.workExperience?.length || 0

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          <Card className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
              {userName
                ? t('career.onboarding.welcomeBackUser', { name: userName })
                : t('career.onboarding.welcomeBackGeneric')
              }
            </h2>
            <p className="text-stone-600 dark:text-stone-400 mb-8">
              {t('career.onboarding.foundExistingData')}
            </p>

            {/* What we know */}
            <div className="text-left space-y-4 mb-8">
              {hasRiasec && (
                <div className="flex items-start gap-3 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      {t('career.onboarding.hasInterestProfile')}
                    </p>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      {t('career.onboarding.topTypes', {
                        types: interestProfile.dominantTypes
                          .slice(0, 2)
                          .map(d => RIASEC_TYPES[d.code].nameSv)
                          .join(' & ')
                      })}
                    </p>
                  </div>
                </div>
              )}

              {hasExperience > 0 && (
                <div className="flex items-start gap-3 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      {t('career.onboarding.hasWorkHistory')}
                    </p>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      {t('career.onboarding.jobCount', { count: hasExperience })}
                    </p>
                  </div>
                </div>
              )}

              {unifiedProfile?.core?.location && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      {t('career.onboarding.hasLocation')}
                    </p>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      {unifiedProfile.core.location}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleStartFromSummary}
                variant="outline"
                leftIcon={<ArrowRight className="w-4 h-4" />}
              >
                {t('career.onboarding.customizeAnswers')}
              </Button>
              <Button
                onClick={handleUseExistingData}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                {t('career.onboarding.continueWithData')}
              </Button>
            </div>

            <button
              onClick={onSkip}
              className="mt-6 text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
            >
              {t('career.onboarding.skipForNow')}
            </button>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      {/* Progress indicator */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center justify-between mb-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 h-2 rounded-full mx-1 transition-colors',
                i <= step ? 'bg-teal-500' : 'bg-stone-200 dark:bg-stone-700'
              )}
            />
          ))}
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
          {t('career.onboarding.step', { current: step + 1, total: totalSteps })}
        </p>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl"
        >
          {/* Situation Step */}
          {currentStepType === 'situation' && (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center">
                <Compass className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-3">
                {t('career.onboarding.welcome')}
              </h2>
              <p className="text-stone-600 dark:text-stone-400 mb-8">
                {t('career.onboarding.welcomeDesc')}
              </p>

              <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-4">
                {t('career.onboarding.situationQuestion')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {SITUATIONS.map(situation => (
                  <button
                    key={situation.id}
                    onClick={() => setPreferences(prev => ({ ...prev, currentSituation: situation.id }))}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all text-left',
                      preferences.currentSituation === situation.id
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                    )}
                  >
                    <situation.icon className={cn(
                      'w-6 h-6 mb-2',
                      preferences.currentSituation === situation.id
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-stone-500 dark:text-stone-400'
                    )} />
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      {t(`career.onboarding.situations.${situation.id}`)}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Interests Step (only shown if no RIASEC profile) */}
          {currentStepType === 'interests' && (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-3">
                {t('career.onboarding.interestsTitle')}
              </h2>
              <p className="text-stone-600 dark:text-stone-400 mb-8">
                {t('career.onboarding.interestsDesc')}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {INTERESTS.map(interest => (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all',
                      preferences.interests.includes(interest.id)
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                    )}
                  >
                    <span className="text-2xl mb-2 block">{interest.icon}</span>
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                      {t(`career.onboarding.interests.${interest.id}`)}
                    </p>
                  </button>
                ))}
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-4">
                {t('career.onboarding.selectMultiple')}
              </p>
            </Card>
          )}

          {/* Goals Step */}
          {currentStepType === 'goals' && (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-3">
                {t('career.onboarding.goalsTitle')}
              </h2>
              <p className="text-stone-600 dark:text-stone-400 mb-8">
                {t('career.onboarding.goalsDesc')}
              </p>

              <div className="grid grid-cols-2 gap-4">
                {GOALS.map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all text-left',
                      preferences.goals.includes(goal.id)
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                    )}
                  >
                    <goal.icon className={cn(
                      'w-6 h-6 mb-2',
                      preferences.goals.includes(goal.id)
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-stone-500 dark:text-stone-400'
                    )} />
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      {t(`career.onboarding.goals.${goal.id}`)}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                      {t(`career.onboarding.goalsDesc.${goal.id}`)}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Experience Step (only shown if no work history) */}
          {currentStepType === 'experience' && (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-3">
                {t('career.onboarding.experienceTitle')}
              </h2>
              <p className="text-stone-600 dark:text-stone-400 mb-8">
                {t('career.onboarding.experienceDesc')}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {EXPERIENCE_LEVELS.map(level => (
                  <button
                    key={level.id}
                    onClick={() => setPreferences(prev => ({ ...prev, experience: level.id }))}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all',
                      preferences.experience === level.id
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                    )}
                  >
                    <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                      {level.years}
                    </p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      {t(`career.onboarding.experience.${level.id}`)}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between w-full max-w-2xl mt-8">
        <div>
          {step > 0 ? (
            <Button variant="ghost" onClick={handleBack}>
              {t('common.back')}
            </Button>
          ) : (
            <Button variant="ghost" onClick={onSkip}>
              {t('career.onboarding.skip')}
            </Button>
          )}
        </div>
        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          rightIcon={step === totalSteps - 1 ? <Sparkles className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        >
          {step === totalSteps - 1 ? t('career.onboarding.showResults') : t('common.next')}
        </Button>
      </div>
    </div>
  )
}

export default CareerOnboarding
