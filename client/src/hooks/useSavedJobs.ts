/**
 * Hook for managing saved jobs
 * Persists to localStorage and provides CRUD operations
 */

import { useState, useEffect, useCallback } from 'react'
import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'

export interface SavedJob {
  id: string
  jobData: PlatsbankenJob
  savedAt: string
  notes?: string
  status: 'saved' | 'applied' | 'interview' | 'rejected' | 'offer'
}

const STORAGE_KEY = 'savedJobs'

export function useSavedJobs() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const loadSavedJobs = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          setSavedJobs(parsed)
        }
      } catch (error) {
        console.error('Error loading saved jobs:', error)
      }
      setIsLoaded(true)
    }
    loadSavedJobs()
  }, [])

  // Save to localStorage whenever savedJobs changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedJobs))
    }
  }, [savedJobs, isLoaded])

  const saveJob = useCallback((job: PlatsbankenJob) => {
    setSavedJobs(prev => {
      // Check if already saved
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
  }, [])

  const removeJob = useCallback((jobId: string) => {
    setSavedJobs(prev => prev.filter(job => job.id !== jobId))
  }, [])

  const updateJobStatus = useCallback((jobId: string, status: SavedJob['status']) => {
    setSavedJobs(prev => 
      prev.map(job => 
        job.id === jobId ? { ...job, status } : job
      )
    )
  }, [])

  const addNotes = useCallback((jobId: string, notes: string) => {
    setSavedJobs(prev => 
      prev.map(job => 
        job.id === jobId ? { ...job, notes } : job
      )
    )
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
    saveJob,
    removeJob,
    updateJobStatus,
    addNotes,
    isSaved,
    getSavedJob,
    getStats
  }
}
