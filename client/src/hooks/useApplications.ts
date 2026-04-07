/**
 * useApplications Hook
 * Comprehensive hook for managing job applications
 * Replaces and extends useSavedJobs
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  applicationsApi,
  applicationContactsApi,
  applicationRemindersApi,
  applicationHistoryApi
} from '@/services/applicationsApi'
import { useAchievementTracker } from './useAchievementTracker'
import type {
  Application,
  ApplicationStatus,
  ApplicationContact,
  ApplicationReminder,
  ApplicationHistoryEntry,
  ApplicationStats,
  ApplicationFilters,
  ApplicationSort,
  CreateApplicationInput,
  UpdateApplicationInput,
  CreateContactInput,
  CreateReminderInput,
  PIPELINE_COLUMNS
} from '@/types/application.types'
import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'

// Query keys
const QUERY_KEYS = {
  applications: ['applications'] as const,
  application: (id: string) => ['application', id] as const,
  stats: ['application-stats'] as const,
  stale: (days: number) => ['applications-stale', days] as const,
  contacts: (appId: string) => ['application-contacts', appId] as const,
  allContacts: ['application-contacts-all'] as const,
  reminders: (appId: string) => ['application-reminders', appId] as const,
  upcomingReminders: (days: number) => ['application-reminders-upcoming', days] as const,
  todayReminders: ['application-reminders-today'] as const,
  history: (appId: string) => ['application-history', appId] as const,
  recentHistory: ['application-history-recent'] as const
}

// ============================================
// MAIN HOOK
// ============================================

export function useApplications(
  filters?: ApplicationFilters,
  sort?: ApplicationSort
) {
  const queryClient = useQueryClient()
  const { trackJobSaved, trackJobApplied, trackInterviewScheduled, trackOfferReceived, trackJobAccepted } = useAchievementTracker()

  // Main applications query
  const {
    data: applications = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [...QUERY_KEYS.applications, filters, sort],
    queryFn: () => applicationsApi.getAll(filters, sort),
    staleTime: 30 * 1000, // 30 seconds
  })

  // Stats query
  const { data: stats } = useQuery({
    queryKey: QUERY_KEYS.stats,
    queryFn: () => applicationsApi.getStats(),
    staleTime: 60 * 1000, // 1 minute
  })

  // Stale applications query
  const { data: staleApplications = [] } = useQuery({
    queryKey: QUERY_KEYS.stale(7),
    queryFn: () => applicationsApi.getStale(7),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Today's reminders
  const { data: todayReminders = [] } = useQuery({
    queryKey: QUERY_KEYS.todayReminders,
    queryFn: () => applicationRemindersApi.getToday(),
    staleTime: 60 * 1000,
  })

  // Upcoming reminders
  const { data: upcomingReminders = [] } = useQuery({
    queryKey: QUERY_KEYS.upcomingReminders(7),
    queryFn: () => applicationRemindersApi.getUpcoming(7),
    staleTime: 5 * 60 * 1000,
  })

  // ============================================
  // MUTATIONS
  // ============================================

  // Create application
  const createMutation = useMutation({
    mutationFn: (input: CreateApplicationInput) => applicationsApi.create(input),
    onSuccess: (app) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.applications })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats })

      // Track achievements
      const jobData = app.jobData as PlatsbankenJob
      if (app.status === 'saved') {
        trackJobSaved(jobData?.headline || app.jobTitle, jobData?.employer?.name || app.companyName)
      } else if (app.status === 'applied') {
        trackJobApplied(jobData?.headline || app.jobTitle, jobData?.employer?.name || app.companyName)
      }
    }
  })

  // Update application
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateApplicationInput }) =>
      applicationsApi.update(id, input),
    onSuccess: (app) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.applications })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.application(app.id) })
    }
  })

  // Update status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      applicationsApi.updateStatus(id, status),
    onSuccess: (app, { status }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.applications })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.application(app.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stale(7) })

      // Track achievements for status changes
      const jobData = app.jobData as PlatsbankenJob
      const title = jobData?.headline || app.jobTitle
      const company = jobData?.employer?.name || app.companyName

      switch (status) {
        case 'applied':
          trackJobApplied(title, company)
          break
        case 'interview':
        case 'phone':
          trackInterviewScheduled(title, company)
          break
        case 'offer':
          trackOfferReceived(title, company)
          break
        case 'accepted':
          trackJobAccepted(title, company)
          break
      }
    }
  })

  // Archive application
  const archiveMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.applications })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats })
    }
  })

  // Delete application
  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.applications })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats })
    }
  })

  // ============================================
  // HELPER METHODS
  // ============================================

  const saveJob = useCallback(async (job: PlatsbankenJob) => {
    const existing = applications.find(a => a.jobId === job.id)
    if (existing) return existing

    return createMutation.mutateAsync({
      jobId: job.id,
      jobData: job,
      status: 'saved',
      source: 'job_search'
    })
  }, [applications, createMutation])

  const applyToJob = useCallback(async (
    job: PlatsbankenJob,
    options?: {
      cvVersionId?: string
      coverLetterId?: string
      applicationMethod?: UpdateApplicationInput['applicationMethod']
      notes?: string
    }
  ) => {
    const existing = applications.find(a => a.jobId === job.id)

    if (existing) {
      return updateMutation.mutateAsync({
        id: existing.id,
        input: {
          status: 'applied',
          applicationDate: new Date().toISOString(),
          ...options
        }
      })
    }

    return createMutation.mutateAsync({
      jobId: job.id,
      jobData: job,
      status: 'applied',
      source: 'job_search',
      ...options
    })
  }, [applications, createMutation, updateMutation])

  const updateStatus = useCallback(async (id: string, status: ApplicationStatus) => {
    return updateStatusMutation.mutateAsync({ id, status })
  }, [updateStatusMutation])

  const updateApplication = useCallback(async (id: string, input: UpdateApplicationInput) => {
    return updateMutation.mutateAsync({ id, input })
  }, [updateMutation])

  const archiveApplication = useCallback(async (id: string) => {
    return archiveMutation.mutateAsync(id)
  }, [archiveMutation])

  const deleteApplication = useCallback(async (id: string) => {
    return deleteMutation.mutateAsync(id)
  }, [deleteMutation])

  const isSaved = useCallback((jobId: string) => {
    return applications.some(a => a.jobId === jobId)
  }, [applications])

  const getApplication = useCallback((jobId: string) => {
    return applications.find(a => a.jobId === jobId)
  }, [applications])

  const getApplicationById = useCallback((id: string) => {
    return applications.find(a => a.id === id)
  }, [applications])

  // Group applications by status for Kanban view
  const applicationsByStatus = useMemo(() => {
    const groups: Record<ApplicationStatus, Application[]> = {
      interested: [],
      saved: [],
      applied: [],
      screening: [],
      phone: [],
      interview: [],
      assessment: [],
      offer: [],
      accepted: [],
      rejected: [],
      withdrawn: []
    }

    applications.forEach(app => {
      if (!app.archivedAt) {
        groups[app.status].push(app)
      }
    })

    return groups
  }, [applications])

  // Active (non-archived, non-terminal) applications
  const activeApplications = useMemo(() => {
    return applications.filter(a =>
      !a.archivedAt &&
      !['accepted', 'rejected', 'withdrawn'].includes(a.status)
    )
  }, [applications])

  return {
    // Data
    applications,
    applicationsByStatus,
    activeApplications,
    staleApplications,
    stats: stats || {
      total: 0, interested: 0, saved: 0, applied: 0, screening: 0,
      phone: 0, interview: 0, assessment: 0, offer: 0,
      accepted: 0, rejected: 0, withdrawn: 0, active: 0,
      thisWeek: 0, thisMonth: 0
    },
    todayReminders,
    upcomingReminders,

    // State
    isLoading,
    error: error?.message || null,

    // Actions
    saveJob,
    applyToJob,
    updateStatus,
    updateApplication,
    archiveApplication,
    deleteApplication,
    createApplication: createMutation.mutateAsync,

    // Queries
    isSaved,
    getApplication,
    getApplicationById,
    refetch,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending || updateStatusMutation.isPending,
    isDeleting: deleteMutation.isPending
  }
}

// ============================================
// SINGLE APPLICATION HOOK
// ============================================

export function useApplication(id: string) {
  const queryClient = useQueryClient()

  const {
    data: application,
    isLoading,
    error
  } = useQuery({
    queryKey: QUERY_KEYS.application(id),
    queryFn: () => applicationsApi.getById(id),
    enabled: !!id
  })

  const {
    data: contacts = [],
    isLoading: isLoadingContacts
  } = useQuery({
    queryKey: QUERY_KEYS.contacts(id),
    queryFn: () => applicationContactsApi.getByApplication(id),
    enabled: !!id
  })

  const {
    data: reminders = [],
    isLoading: isLoadingReminders
  } = useQuery({
    queryKey: QUERY_KEYS.reminders(id),
    queryFn: () => applicationRemindersApi.getByApplication(id),
    enabled: !!id
  })

  const {
    data: history = [],
    isLoading: isLoadingHistory
  } = useQuery({
    queryKey: QUERY_KEYS.history(id),
    queryFn: () => applicationHistoryApi.getByApplication(id),
    enabled: !!id
  })

  // Contact mutations
  const addContactMutation = useMutation({
    mutationFn: (input: Omit<CreateContactInput, 'applicationId'>) =>
      applicationContactsApi.create({ ...input, applicationId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history(id) })
    }
  })

  const updateContactMutation = useMutation({
    mutationFn: ({ contactId, input }: { contactId: string; input: Partial<CreateContactInput> }) =>
      applicationContactsApi.update(contactId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts(id) })
    }
  })

  const deleteContactMutation = useMutation({
    mutationFn: (contactId: string) => applicationContactsApi.delete(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts(id) })
    }
  })

  // Reminder mutations
  const addReminderMutation = useMutation({
    mutationFn: (input: Omit<CreateReminderInput, 'applicationId'>) =>
      applicationRemindersApi.create({ ...input, applicationId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reminders(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.upcomingReminders(7) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayReminders })
    }
  })

  const completeReminderMutation = useMutation({
    mutationFn: (reminderId: string) => applicationRemindersApi.complete(reminderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reminders(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.upcomingReminders(7) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayReminders })
    }
  })

  const deleteReminderMutation = useMutation({
    mutationFn: (reminderId: string) => applicationRemindersApi.delete(reminderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reminders(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.upcomingReminders(7) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayReminders })
    }
  })

  return {
    // Data
    application,
    contacts,
    reminders,
    history,

    // State
    isLoading: isLoading || isLoadingContacts || isLoadingReminders || isLoadingHistory,
    error: error?.message || null,

    // Contact actions
    addContact: addContactMutation.mutateAsync,
    updateContact: (contactId: string, input: Partial<CreateContactInput>) =>
      updateContactMutation.mutateAsync({ contactId, input }),
    deleteContact: deleteContactMutation.mutateAsync,

    // Reminder actions
    addReminder: addReminderMutation.mutateAsync,
    completeReminder: completeReminderMutation.mutateAsync,
    deleteReminder: deleteReminderMutation.mutateAsync,

    // Mutation states
    isAddingContact: addContactMutation.isPending,
    isAddingReminder: addReminderMutation.isPending
  }
}

// ============================================
// REMINDERS HOOK
// ============================================

export function useApplicationReminders() {
  const queryClient = useQueryClient()

  const {
    data: todayReminders = [],
    isLoading: isLoadingToday
  } = useQuery({
    queryKey: QUERY_KEYS.todayReminders,
    queryFn: () => applicationRemindersApi.getToday(),
    staleTime: 60 * 1000
  })

  const {
    data: upcomingReminders = [],
    isLoading: isLoadingUpcoming
  } = useQuery({
    queryKey: QUERY_KEYS.upcomingReminders(7),
    queryFn: () => applicationRemindersApi.getUpcoming(7),
    staleTime: 5 * 60 * 1000
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => applicationRemindersApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayReminders })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.upcomingReminders(7) })
    }
  })

  return {
    todayReminders,
    upcomingReminders,
    isLoading: isLoadingToday || isLoadingUpcoming,
    completeReminder: completeMutation.mutateAsync
  }
}

export default useApplications
