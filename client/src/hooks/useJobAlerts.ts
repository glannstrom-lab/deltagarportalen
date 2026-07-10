/**
 * Hook for managing job alerts
 * Persists to Supabase database
 * React Query-baserad: en delad cache i stället för en fetch per
 * hook-instans. Mutationer uppdaterar cachen direkt via
 * queryClient.setQueryData — samma mönster som useSpontaneousCompanies.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { jobAlertsApi, type JobAlert } from '@/services/jobsApi'
import { searchJobs } from '@/services/arbetsformedlingenApi'

export const JOB_ALERTS_KEY = ['job-alerts'] as const

export function useJobAlerts() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: JOB_ALERTS_KEY,
    queryFn: () => jobAlertsApi.getAll(),
    staleTime: 60_000,
  })

  const alerts = useMemo(() => query.data ?? [], [query.data])

  // Logga laddningsfel en gång per felobjekt (motsvarar gamla loadAlerts)
  const loggedError = useRef<unknown>(null)
  useEffect(() => {
    if (query.error && loggedError.current !== query.error) {
      loggedError.current = query.error
      console.error('Error loading alerts:', query.error)
    }
  }, [query.error])

  const setAlerts = useCallback((updater: (prev: JobAlert[]) => JobAlert[]) => {
    queryClient.setQueryData<JobAlert[]>(JOB_ALERTS_KEY, (prev) => updater(prev ?? []))
  }, [queryClient])

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: JOB_ALERTS_KEY })
  }, [queryClient])

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
  }, [setAlerts])

  const deleteAlert = useCallback(async (id: string) => {
    try {
      await jobAlertsApi.delete(id)
      setAlerts(prev => prev.filter(a => a.id !== id))
      return true
    } catch (err) {
      console.error('Error deleting alert:', err)
      return false
    }
  }, [setAlerts])

  const toggleAlert = useCallback(async (id: string, isActive: boolean) => {
    try {
      const updated = await jobAlertsApi.toggleActive(id, isActive)
      setAlerts(prev => prev.map(a => a.id === id ? updated : a))
      return updated
    } catch (err) {
      console.error('Error toggling alert:', err)
      throw err
    }
  }, [setAlerts])

  const updateAlert = useCallback(async (id: string, updates: Partial<JobAlert>) => {
    try {
      const updated = await jobAlertsApi.update(id, updates)
      setAlerts(prev => prev.map(a => a.id === id ? updated : a))
      return updated
    } catch (err) {
      console.error('Error updating alert:', err)
      throw err
    }
  }, [setAlerts])

  const checkForNewJobs = useCallback(async (alert: JobAlert) => {
    try {
      const result = await searchJobs({
        query: alert.query || '',
        municipality: alert.municipality,
        region: alert.region,
        employmentType: alert.employment_type,
        publishedWithin: (alert.published_within as 'today' | 'week' | 'month' | 'all' | undefined) || 'week',
        limit: 50
      })

      // "Nya" = publicerade EFTER senaste kontrollen — inte alla träffar
      // senaste veckan. Matchar backend-logiken i api/job-alerts.js
      // (publishedAfter: lastChecked); annars ljuger badgen "X nya".
      const hits = result.hits || []
      const lastChecked = alert.last_checked_at ? new Date(alert.last_checked_at).getTime() : null
      const newHits = lastChecked
        ? hits.filter(j => new Date(j.publication_date).getTime() > lastChecked)
        : hits

      const newCount = newHits.length
      await jobAlertsApi.updateNewJobsCount(alert.id, newCount)
      setAlerts(prev => prev.map(a =>
        a.id === alert.id ? { ...a, new_jobs_count: newCount, last_checked_at: new Date().toISOString() } : a
      ))

      return newHits
    } catch (err) {
      console.error('Error checking for new jobs:', err)
      return []
    }
  }, [setAlerts])

  const runAlertSearch = useCallback(async (alert: JobAlert) => {
    try {
      const result = await searchJobs({
        query: alert.query || '',
        municipality: alert.municipality,
        region: alert.region,
        employmentType: alert.employment_type,
        publishedWithin: (alert.published_within as 'today' | 'week' | 'month' | 'all' | undefined) || 'week',
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
    isLoading: query.isLoading,
    error: query.error ? 'Kunde inte ladda bevakningar' : null,
    createAlert,
    deleteAlert,
    toggleAlert,
    updateAlert,
    checkForNewJobs,
    runAlertSearch,
    refresh
  }
}
