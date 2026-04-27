/**
 * FocusJobSearch - Förenklad jobbsökning för fokusläget
 * Hjälper användaren identifiera önskade jobb och börja söka
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '@/services/jobsApi'
import { userApi } from '@/services/supabaseApi'
import {
  Search, MapPin, Briefcase, Heart, ExternalLink,
  ArrowRight, Check, Loader2, SkipForward, Star
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface FocusJobSearchProps {
  onComplete: () => void
  onSkip: () => void
  onBack: () => void
}

interface JobResult {
  id: string
  headline: string
  employer: { name: string }
  workplace_address?: { municipality?: string }
  occupation?: { label: string }
  publication_date: string
}

const JOB_STEPS = [
  { id: 'interests', icon: Heart, titleKey: 'focusGuide.jobs.interestsStep', titleDefault: 'Vad vill du jobba med?' },
  { id: 'location', icon: MapPin, titleKey: 'focusGuide.jobs.locationStep', titleDefault: 'Var vill du jobba?' },
  { id: 'browse', icon: Search, titleKey: 'focusGuide.jobs.browseStep', titleDefault: 'Utforska jobb' },
] as const

const POPULAR_JOBS = [
  'Administratör',
  'Säljare',
  'Kundtjänst',
  'Lagerarbetare',
  'Städare',
  'Vårdbiträde',
  'Kock',
  'Servitör',
  'Butikspersonal',
  'Chaufför'
]

export function FocusJobSearch({ onComplete, onSkip, onBack }: FocusJobSearchProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(0)

  // Form state
  const [desiredJobs, setDesiredJobs] = useState<string[]>([])
  const [customJob, setCustomJob] = useState('')
  const [location, setLocation] = useState('')
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())

  const step = JOB_STEPS[currentStep]
  const StepIcon = step.icon
  const isLastStep = currentStep === JOB_STEPS.length - 1
  const progress = ((currentStep + 1) / JOB_STEPS.length) * 100

  // Search for jobs when on browse step
  const searchQuery = desiredJobs.length > 0 ? desiredJobs[0] : ''
  const { data: jobs, isLoading: isSearching } = useQuery({
    queryKey: ['focus-job-search', searchQuery, location],
    queryFn: async () => {
      if (!searchQuery) return []
      try {
        const result = await jobsApi.searchJobs({
          search: searchQuery,
          location: location || undefined,
          limit: 5
        })
        return result || []
      } catch (error) {
        console.error('Job search failed:', error)
        return []
      }
    },
    enabled: step.id === 'browse' && searchQuery.length > 0
  })

  // Save preferences mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      await userApi.updatePreferences({
        desired_jobs: desiredJobs
      })
    }
  })

  const toggleJob = (job: string) => {
    setDesiredJobs(prev =>
      prev.includes(job)
        ? prev.filter(j => j !== job)
        : [...prev, job]
    )
  }

  const addCustomJob = () => {
    if (customJob.trim() && !desiredJobs.includes(customJob.trim())) {
      setDesiredJobs(prev => [...prev, customJob.trim()])
      setCustomJob('')
    }
  }

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jobId)) {
        newSet.delete(jobId)
      } else {
        newSet.add(jobId)
      }
      return newSet
    })
  }

  const handleNext = async () => {
    if (isLastStep) {
      try {
        await saveMutation.mutateAsync()
        onComplete()
      } catch (error) {
        console.error('Failed to save preferences:', error)
        onComplete() // Continue anyway
      }
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-teal-500" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">
          {t('focusGuide.jobs.title', 'Hitta jobb')}
        </h2>
        <p className="text-stone-500 dark:text-stone-400">
          {t('focusGuide.jobs.subtitle', 'Låt oss hitta jobb som passar dig')}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-stone-500 dark:text-stone-400">
            {t('focusGuide.stepOf', 'Steg {{current}} av {{total}}', {
              current: currentStep + 1,
              total: JOB_STEPS.length
            })}
          </span>
          <span className="font-medium text-teal-600 dark:text-teal-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-3 mt-4">
          {JOB_STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = i === currentStep
            const isDone = i < currentStep

            return (
              <div
                key={s.id}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  isActive && 'bg-teal-500 text-white ring-4 ring-teal-500/20',
                  isDone && 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400',
                  !isActive && !isDone && 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                )}
              >
                {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Current step form */}
      <div className="bg-white dark:bg-stone-800/50 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
            <StepIcon className="w-6 h-6 text-teal-500" />
          </div>
          <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
            {t(step.titleKey, step.titleDefault)}
          </h3>
        </div>

        {/* Interests step */}
        {step.id === 'interests' && (
          <div className="space-y-4">
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              {t('focusGuide.jobs.selectJobs', 'Välj de yrken som intresserar dig:')}
            </p>

            {/* Selected jobs */}
            {desiredJobs.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {desiredJobs.map((job) => (
                  <button
                    key={job}
                    onClick={() => toggleJob(job)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 text-white rounded-full text-sm"
                  >
                    {job}
                    <span className="ml-1">×</span>
                  </button>
                ))}
              </div>
            )}

            {/* Popular jobs */}
            <div className="flex flex-wrap gap-2">
              {POPULAR_JOBS.map((job) => (
                !desiredJobs.includes(job) && (
                  <button
                    key={job}
                    onClick={() => toggleJob(job)}
                    className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-full text-sm hover:bg-teal-100 hover:text-teal-700 dark:hover:bg-teal-900/50 dark:hover:text-teal-300 transition-colors"
                  >
                    {job}
                  </button>
                )
              ))}
            </div>

            {/* Custom job input */}
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                value={customJob}
                onChange={(e) => setCustomJob(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomJob()
                  }
                }}
                placeholder={t('focusGuide.jobs.customJob', 'Annat yrke...')}
                className="flex-1 px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
              <button
                onClick={addCustomJob}
                disabled={!customJob.trim()}
                className="px-4 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Location step */}
        {step.id === 'location' && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="job-location"
                className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2"
              >
                {t('focusGuide.jobs.locationLabel', 'Ort eller kommun')}
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  id="job-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('focusGuide.jobs.locationPlaceholder', 'T.ex. Stockholm, Göteborg...')}
                  className="w-full pl-12 pr-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  autoFocus
                />
              </div>
            </div>

            <p className="text-sm text-stone-500 dark:text-stone-400">
              {t('focusGuide.jobs.locationHint', 'Lämna tomt för att söka i hela Sverige')}
            </p>

            {/* Quick location buttons */}
            <div className="flex flex-wrap gap-2">
              {['Stockholm', 'Göteborg', 'Malmö', 'Uppsala'].map((city) => (
                <button
                  key={city}
                  onClick={() => setLocation(city)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm transition-colors',
                    location === city
                      ? 'bg-teal-500 text-white'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-teal-100 hover:text-teal-700'
                  )}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Browse step */}
        {step.id === 'browse' && (
          <div className="space-y-4">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
              </div>
            ) : jobs && jobs.length > 0 ? (
              <>
                <p className="text-stone-600 dark:text-stone-400">
                  {t('focusGuide.jobs.foundJobs', 'Vi hittade {{count}} jobb som kan passa dig:', { count: jobs.length })}
                </p>

                <div className="space-y-3">
                  {jobs.map((job: JobResult) => (
                    <div
                      key={job.id}
                      className="p-4 bg-stone-50 dark:bg-stone-900/50 rounded-xl"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-stone-800 dark:text-stone-100">
                          {job.headline}
                        </h4>
                        <button
                          onClick={() => toggleSaveJob(job.id)}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            savedJobs.has(job.id)
                              ? 'text-amber-500'
                              : 'text-stone-400 hover:text-amber-500'
                          )}
                        >
                          <Star className={cn('w-5 h-5', savedJobs.has(job.id) && 'fill-current')} />
                        </button>
                      </div>
                      <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">
                        {job.employer?.name}
                      </p>
                      {job.workplace_address?.municipality && (
                        <p className="text-sm text-stone-500 dark:text-stone-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.workplace_address.municipality}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
                  {t('focusGuide.jobs.browseMore', 'Du kan utforska fler jobb på jobbsidan senare')}
                </p>
              </>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
                <p className="text-stone-500 dark:text-stone-400">
                  {desiredJobs.length === 0
                    ? t('focusGuide.jobs.selectFirst', 'Välj vilka jobb du är intresserad av först')
                    : t('focusGuide.jobs.noResults', 'Inga jobb hittades just nu. Försök utöka din sökning.')
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleNext}
          disabled={saveMutation.isPending}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-lg transition-all',
            'bg-teal-500 text-white hover:bg-teal-600',
            'focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('common.saving', 'Sparar...')}
            </>
          ) : isLastStep ? (
            <>
              <Check className="w-5 h-5" />
              {t('focusGuide.jobs.continue', 'Fortsätt')}
            </>
          ) : (
            <>
              {t('common.next', 'Nästa')}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <button
          onClick={onSkip}
          className="flex items-center justify-center gap-2 py-3 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
        >
          <SkipForward className="w-4 h-4" />
          {t('focusGuide.skipStep', 'Hoppa över detta steg')}
        </button>
      </div>
    </div>
  )
}
