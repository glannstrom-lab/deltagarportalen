/**
 * Hook for managing saved jobs
 * Persists to Supabase database
 *
 * React Query-baserad: en delad cache mellan alla konsumenter i stället
 * för ett fetch per komponent som använder hooken.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { savedJobsApi } from '@/services/jobsApi'
import { userApi } from '@/services/userApi'
import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'
import { useAchievementTracker } from './useAchievementTracker'

export interface SavedJob {
  id: string
  jobData: PlatsbankenJob
  savedAt: string
  notes?: string
  status: 'saved' | 'applied' | 'interview' | 'rejected' | 'offer'
}

export const SAVED_JOBS_KEY = ['saved-jobs'] as const

async function fetchSavedJobs(): Promise<SavedJob[]> {
  const jobs = await savedJobsApi.getAll()
  // Konvertera från Supabase-format till vårt format
  return jobs.map((job) => ({
    id: job.job_id,
    jobData: job.job_data as PlatsbankenJob,
    savedAt: job.created_at,
    notes: job.notes || undefined,
    status: (job.status?.toLowerCase() || 'saved') as SavedJob['status']
  }))
}

export function useSavedJobs() {
  const queryClient = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)
  const { trackJobSaved, trackJobApplied } = useAchievementTracker()

  const query = useQuery({
    queryKey: SAVED_JOBS_KEY,
    queryFn: fetchSavedJobs,
    staleTime: 60_000,
  })

  const savedJobs = useMemo(() => query.data ?? [], [query.data])

  // Logga laddningsfel — en gång per felobjekt
  useEffect(() => {
    if (query.error) {
      console.error('Error loading saved jobs:', query.error)
    }
  }, [query.error])

  const setSavedJobs = useCallback((updater: (prev: SavedJob[]) => SavedJob[]) => {
    queryClient.setQueryData<SavedJob[]>(SAVED_JOBS_KEY, (prev) => updater(prev ?? []))
  }, [queryClient])

  const saveJob = useCallback(async (job: PlatsbankenJob) => {
    try {
      // Spara till Supabase
      await savedJobsApi.save(job.id, job)

      // Uppdatera cachen
      setSavedJobs(prev => {
        if (prev.some(saved => saved.id === job.id)) {
          return prev
        }
        const newSavedJob: SavedJob = {
          id: job.id,
          jobData: job,
          savedAt: new Date().toISOString(),
          status: 'saved'
        }
        return [newSavedJob, ...prev]
      })

      // Track achievement
      trackJobSaved(job.headline, job.employer?.name)

      // Mark job search onboarding step as complete
      userApi.updateOnboardingStep('jobSearch', true).catch(err => {
        console.error('Error updating onboarding progress:', err)
      })
      localStorage.setItem('saved-jobs', 'true')

      return true
    } catch (err) {
      console.error('Error saving job:', err)
      setActionError('Kunde inte spara jobb')
      return false
    }
  }, [setSavedJobs, trackJobSaved])

  const removeJob = useCallback(async (jobId: string) => {
    try {
      await savedJobsApi.delete(jobId)
      setSavedJobs(prev => prev.filter(job => job.id !== jobId))
      return true
    } catch (err) {
      console.error('Error removing job:', err)
      setActionError('Kunde inte ta bort jobb')
      return false
    }
  }, [setSavedJobs])

  const updateJobStatus = useCallback(async (jobId: string, status: SavedJob['status']) => {
    try {
      await savedJobsApi.updateStatus(jobId, status.toUpperCase())
      const job = savedJobs.find(j => j.id === jobId)
      setSavedJobs(prev =>
        prev.map(j =>
          j.id === jobId ? { ...j, status } : j
        )
      )

      // Track achievement when status changes to 'applied'
      if (status === 'applied' && job) {
        trackJobApplied(job.jobData.headline, job.jobData.employer?.name)
      }

      return true
    } catch (err) {
      console.error('Error updating job status:', err)
      setActionError('Kunde inte uppdatera status')
      return false
    }
  }, [savedJobs, setSavedJobs, trackJobApplied])

  const addNotes = useCallback(async (jobId: string, notes: string) => {
    // Optimistisk uppdatering + persistens — utan updateNotes-anropet
    // försvann anteckningarna vid omladdning.
    setSavedJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, notes } : job
      )
    )
    try {
      await savedJobsApi.updateNotes(jobId, notes)
      return true
    } catch (err) {
      console.error('Error saving notes:', err)
      setActionError('Kunde inte spara anteckningen')
      return false
    }
  }, [setSavedJobs])

  const isSaved = useCallback((jobId: string) => {
    return savedJobs.some(job => job.id === jobId)
  }, [savedJobs])

  const getSavedJob = useCallback((jobId: string) => {
    return savedJobs.find(job => job.id === jobId)
  }, [savedJobs])

  const getStats = useCallback(() => {
    return {
      total: savedJobs.length,
      saved: savedJobs.filter(j => j.status === 'saved').length,
      applied: savedJobs.filter(j => j.status === 'applied').length,
      interview: savedJobs.filter(j => j.status === 'interview').length,
      rejected: savedJobs.filter(j => j.status === 'rejected').length,
      offer: savedJobs.filter(j => j.status === 'offer').length,
    }
  }, [savedJobs])

  return {
    savedJobs,
    isLoaded: query.isFetched,
    error: query.error ? 'Kunde inte ladda sparade jobb' : actionError,
    saveJob,
    removeJob,
    updateJobStatus,
    addNotes,
    isSaved,
    getSavedJob,
    getStats
  }
}
