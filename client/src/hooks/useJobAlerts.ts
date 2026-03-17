/**
 * Hook for managing job alerts
 * Persists to Supabase database
 */

import { useState, useEffect, useCallback } from 'react'
import { jobAlertsApi, type JobAlert } from '@/services/supabaseApi'
import { searchJobs } from '@/services/arbetsformedlingenApi'

export function useJobAlerts() {
  const [alerts, setAlerts] = useState<JobAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load alerts on mount
  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      setIsLoading(true)
      const data = await jobAlertsApi.getAll()
      setAlerts(data)
      setError(null)
    } catch (err) {
      console.error('Error loading alerts:', err)
      setError('Kunde inte ladda bevakningar')
    } finally {
      setIsLoading(false)
    }
  }

  const createAlert = useCallback(async (alertData: {
    name: string
    query?: string
    municipality?: string
    region?: string
    employment_type?: string
    published_within?: string
    remote?: boolean
  }) => {
    try {
      const alert = await jobAlertsApi.create({
        ...alertData,
        is_active: true,
        notification_frequency: 'daily',
        new_jobs_count: 0
      })
      setAlerts(prev => [alert, ...prev])
      return alert
    } catch (err) {
      console.error('Error creating alert:', err)
      throw err
    }
  }, [])

  const deleteAlert = useCallback(async (id: string) => {
    try {
      await jobAlertsApi.delete(id)
      setAlerts(prev => prev.filter(a => a.id !== id))
      return true
    } catch (err) {
      console.error('Error deleting alert:', err)
      return false
    }
  }, [])

  const toggleAlert = useCallback(async (id: string, isActive: boolean) => {
    try {
      const updated = await jobAlertsApi.toggleActive(id, isActive)
      setAlerts(prev => prev.map(a => a.id === id ? updated : a))
      return updated
    } catch (err) {
      console.error('Error toggling alert:', err)
      throw err
    }
  }, [])

  const updateAlert = useCallback(async (id: string, updates: Partial<JobAlert>) => {
    try {
      const updated = await jobAlertsApi.update(id, updates)
      setAlerts(prev => prev.map(a => a.id === id ? updated : a))
      return updated
    } catch (err) {
      console.error('Error updating alert:', err)
      throw err
    }
  }, [])

  const checkForNewJobs = useCallback(async (alert: JobAlert) => {
    try {
      const result = await searchJobs({
        query: alert.query || '',
        municipality: alert.municipality,
        region: alert.region,
        employmentType: alert.employment_type,
        publishedWithin: (alert.published_within as any) || 'week',
        limit: 50
      })

      const newCount = result.hits?.length || 0
      await jobAlertsApi.updateNewJobsCount(alert.id, newCount)
      setAlerts(prev => prev.map(a =>
        a.id === alert.id ? { ...a, new_jobs_count: newCount, last_checked_at: new Date().toISOString() } : a
      ))

      return result.hits || []
    } catch (err) {
      console.error('Error checking for new jobs:', err)
      return []
    }
  }, [])

  const runAlertSearch = useCallback(async (alert: JobAlert) => {
    try {
      const result = await searchJobs({
        query: alert.query || '',
        municipality: alert.municipality,
        region: alert.region,
        employmentType: alert.employment_type,
        publishedWithin: (alert.published_within as any) || 'week',
        limit: 100
      })
      return result
    } catch (err) {
      console.error('Error running alert search:', err)
      throw err
    }
  }, [])

  return {
    alerts,
    isLoading,
    error,
    createAlert,
    deleteAlert,
    toggleAlert,
    updateAlert,
    checkForNewJobs,
    runAlertSearch,
    refresh: loadAlerts
  }
}
