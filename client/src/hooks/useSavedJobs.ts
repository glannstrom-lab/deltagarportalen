/**
 * Hook for managing saved jobs
 * Persists to Supabase database
 */

import { useState, useEffect, useCallback } from 'react'
import { savedJobsApi } from '@/services/supabaseApi'
import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'
import { useAchievementTracker } from './useAchievementTracker'

export interface SavedJob {
  id: string
  jobData: PlatsbankenJob
  savedAt: string
  notes?: string
  status: 'saved' | 'applied' | 'interview' | 'rejected' | 'offer'
}

export function useSavedJobs() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { trackJobSaved, trackJobApplied } = useAchievementTracker()

  // Load from Supabase on mount
  useEffect(() => {
    const loadSavedJobs = async () => {
      try {
        const jobs = await savedJobsApi.getAll()
        // Konvertera från Supabase-format till vårt format
        const formatted = jobs.map((job: any) => ({
          id: job.job_id,
          jobData: job.job_data,
          savedAt: job.created_at,
          notes: job.notes,
          status: (job.status?.toLowerCase() || 'saved') as SavedJob['status']
        }))
        setSavedJobs(formatted)
        setError(null)
      } catch (err) {
        console.error('Error loading saved jobs:', err)
        setError('Kunde inte ladda sparade jobb')
      }
      setIsLoaded(true)
    }
    loadSavedJobs()
  }, [])

  const saveJob = useCallback(async (job: PlatsbankenJob) => {
    try {
      // Spara till Supabase
      await savedJobsApi.save(job.id, job)

      // Uppdatera lokalt state
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

      return true
    } catch (err) {
      console.error('Error saving job:', err)
      setError('Kunde inte spara jobb')
      return false
    }
  }, [trackJobSaved])

  const removeJob = useCallback(async (jobId: string) => {
    try {
      await savedJobsApi.delete(jobId)
      setSavedJobs(prev => prev.filter(job => job.id !== jobId))
      return true
    } catch (err) {
      console.error('Error removing job:', err)
      setError('Kunde inte ta bort jobb')
      return false
    }
  }, [])

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
      setError('Kunde inte uppdatera status')
      return false
    }
  }, [savedJobs, trackJobApplied])

  const addNotes = useCallback((jobId: string, notes: string) => {
    setSavedJobs(prev => 
      prev.map(job => 
        job.id === jobId ? { ...job, notes } : job
      )
    )
    // Notera: Supabase API har ingen direkt metod för att uppdatera notes
    // Detta kan läggas till senare om behov finns
  }, [])

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
    isLoaded,
    error,
    saveJob,
    removeJob,
    updateJobStatus,
    addNotes,
    isSaved,
    getSavedJob,
    getStats
  }
}
