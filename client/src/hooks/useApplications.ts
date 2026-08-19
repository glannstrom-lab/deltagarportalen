/**
 * useApplications Hook
 * Comprehensive hook for managing job applications
 * Replaces and extends useSavedJobs
 */

import { useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  applicationsApi,
  applicationContactsApi,
  applicationRemindersApi,
  applicationHistoryApi
} from '@/services/applicationsApi'
import { useAchievementTracker } from './useAchievementTracker'
import { useCelebration } from './useCelebration'
import type {
  Application,
  ApplicationStatus,
  ApplicationFilters,
  ApplicationSort,
  CreateApplicationInput,
  UpdateApplicationInput,
  CreateContactInput,
  CreateReminderInput,
} from '@/types/application.types'
import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'

// Hur långt fram kommande påminnelser hämtas — 7 dagar dolde t.ex. en
// intervju om två veckor helt i Kalender-fliken
export const UPCOMING_REMINDER_DAYS = 30

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
  const { celebrate } = useCelebration()

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

  // Stats query.
  //
  // 2026-08-19: `data` var det ENDA som plockades ut här, och returen nedan
  // fyllde i en nollstubbe (`stats || { total: 0, … }`) när svaret saknades.
  // Effekten var att "svaret är inte inne" och "ett fel inträffade" blev
  // omöjliga att skilja från "du har noll ansökningar" — och eftersom
  // main.tsx kör `retry: 1` + `refetchOnWindowFocus: false` var felläget
  // permanent: någon med tjugo ansökningar fick "Du har inte börjat söka
  // jobb än" tills sidan laddades om. Samma felklass som Översikt hade.
  // Nu exponeras tillståndet i stället för att döljas, och `stats` är `null`
  // tills det finns ett riktigt svar.
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
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
    queryKey: QUERY_KEYS.upcomingReminders(UPCOMING_REMINDER_DAYS),
    queryFn: () => applicationRemindersApi.getUpcoming(UPCOMING_REMINDER_DAYS),
    staleTime: 5 * 60 * 1000,
  })

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Invaliderar varje cache som läser `saved_jobs`.
   *
   * Tre luckor låg här till 2026-08-19, alla samma familj:
   *
   * 1. **Historiken.** `application_history` skrivs av DATABASTRIGGRAR vid
   *    varje status-, antecknings- och arkivändring — inte av API:t. Ingen
   *    mutation invaliderade historiknycklarna, så Historik-fliken låg
   *    permanent en händelse efter tills sidan laddades om.
   * 2. **Sparade jobb och hubbarna.** `['saved-jobs']` (sex komponenter),
   *    hubbsammanfattningen och `['unifiedProgress']` läser samma tabell som
   *    `['applications']` men hörde aldrig av sig till varandra. Flyttade man
   *    ett kort på Tavlan visade Söka jobb-hubben gamla siffror.
   * 3. **Inaktuella ansökningar.** `applications-stale` invaliderades bara av
   *    `updateStatus`, trots att arkivering och radering också ändrar mängden.
   *
   * Prefix-matchning används där nyckeln är parametriserad (`stale(days)`,
   * hubben per användare) så att alla varianter träffas, inte bara den med
   * just de argument som råkar stå här.
   */
  const invalideraAnsokningsvyer = useCallback((applicationId?: string) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.applications })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats })
    queryClient.invalidateQueries({ queryKey: ['applications-stale'] })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recentHistory })
    queryClient.invalidateQueries({ queryKey: ['saved-jobs'] })
    queryClient.invalidateQueries({ queryKey: ['hub', 'jobsok'] })
    queryClient.invalidateQueries({ queryKey: ['unifiedProgress'] })
    if (applicationId) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.application(applicationId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history(applicationId) })
    }
  }, [queryClient])

  // Create application
  const createMutation = useMutation({
    mutationFn: (input: CreateApplicationInput) => applicationsApi.create(input),
    onSuccess: (app) => {
      invalideraAnsokningsvyer(app.id)

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
      invalideraAnsokningsvyer(app.id)
    }
  })

  // Update status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      applicationsApi.updateStatus(id, status),
    onSuccess: (app, { status }) => {
      invalideraAnsokningsvyer(app.id)

      // Track achievements for status changes
      const jobData = app.jobData as PlatsbankenJob
      const title = jobData?.headline || app.jobTitle
      const company = jobData?.employer?.name || app.companyName

      switch (status) {
        case 'applied':
          trackJobApplied(title, company)
          // G5: firande i nyckelögonblick. Bara vid statusövergången till
          // "skickad" — inte vid create nedan, för då hade en importerad
          // redan-skickad ansökan också triggat firande.
          celebrate('applicationSent')
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
    onSuccess: (_data, id) => {
      invalideraAnsokningsvyer(id)
    }
  })

  // Unarchive application
  const unarchiveMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.unarchive(id),
    onSuccess: (_data, id) => {
      invalideraAnsokningsvyer(id)
    }
  })

  // Delete application
  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.delete(id),
    onSuccess: (_data, id) => {
      invalideraAnsokningsvyer(id)
      // Raderingen kaskadar i databasen (ON DELETE CASCADE på alla tre
      // barntabellerna). Barnens cachar måste städas här, annars ligger
      // kontakter och påminnelser för en borttagen ansökan kvar i minnet.
      queryClient.removeQueries({ queryKey: QUERY_KEYS.contacts(id) })
      queryClient.removeQueries({ queryKey: QUERY_KEYS.reminders(id) })
      queryClient.removeQueries({ queryKey: QUERY_KEYS.history(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allContacts })
      queryClient.invalidateQueries({ queryKey: ['application-reminders-upcoming'] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayReminders })
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

  const unarchiveApplication = useCallback(async (id: string) => {
    return unarchiveMutation.mutateAsync(id)
  }, [unarchiveMutation])

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

  // Archived applications
  const archivedApplications = useMemo(() => {
    return applications.filter(a => a.archivedAt)
  }, [applications])

  return {
    // Data
    applications,
    applicationsByStatus,
    activeApplications,
    archivedApplications,
    staleApplications,
    // `null` betyder "vi vet inte än" — inte "noll". Anroparen ska visa
    // laddning eller fel, aldrig en siffra vi inte har underlag för.
    stats: stats ?? null,
    statsLoading,
    statsError: statsError instanceof Error ? statsError.message : null,
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
    unarchiveApplication,
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
  //
  // Kontakterna finns i TVÅ cachar: en per ansökan (`contacts(id)`, som
  // detaljmodalen läser) och en samlad (`allContacts`, som Kontakter-fliken
  // läser). De invaliderade aldrig varandra åt något håll till 2026-08-19 —
  // lade man till en kontakt i modalen stod fliken kvar på gamla listan, och
  // tog man bort en i fliken låg den kvar i modalen. Samma tabell, två vyer,
  // en sanning: alla tre mutationerna rör båda nycklarna.
  const invalideraKontakter = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts(id) })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allContacts })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history(id) })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recentHistory })
  }, [queryClient, id])

  const addContactMutation = useMutation({
    mutationFn: (input: Omit<CreateContactInput, 'applicationId'>) =>
      applicationContactsApi.create({ ...input, applicationId: id }),
    onSuccess: invalideraKontakter
  })

  const updateContactMutation = useMutation({
    mutationFn: ({ contactId, input }: { contactId: string; input: Partial<CreateContactInput> }) =>
      applicationContactsApi.update(contactId, input),
    onSuccess: invalideraKontakter
  })

  const deleteContactMutation = useMutation({
    mutationFn: (contactId: string) => applicationContactsApi.delete(contactId),
    onSuccess: invalideraKontakter
  })

  // Reminder mutations
  const addReminderMutation = useMutation({
    mutationFn: (input: Omit<CreateReminderInput, 'applicationId'>) =>
      applicationRemindersApi.create({ ...input, applicationId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reminders(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.upcomingReminders(UPCOMING_REMINDER_DAYS) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayReminders })
    }
  })

  const completeReminderMutation = useMutation({
    mutationFn: (reminderId: string) => applicationRemindersApi.complete(reminderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reminders(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.upcomingReminders(UPCOMING_REMINDER_DAYS) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayReminders })
    }
  })

  const deleteReminderMutation = useMutation({
    mutationFn: (reminderId: string) => applicationRemindersApi.delete(reminderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reminders(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.upcomingReminders(UPCOMING_REMINDER_DAYS) })
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

/**
 * Alla ej avklarade påminnelser fram till 30 dagar framåt — inklusive de som
 * redan passerat.
 *
 * Hooken hämtade tidigare TVÅ mängder: `getToday()` (exakt dagens datum) och
 * `getUpcoming(30)`. Det var både redundant och skadligt. `getUpcoming` har
 * ingen undre gräns, så den innehåller redan dagens påminnelser — och
 * dessutom de försenade, som `getToday` per definition aldrig kan returnera.
 * Kalendern delade sedan upp mängderna själv och tappade bort allt som låg
 * före idag: en påminnelse från i går fanns i datan men ritades aldrig.
 * Dagens påminnelser ritades i stället två gånger.
 *
 * En mängd, en ägare. Anroparen delar upp på LOKALA dygnsgränser.
 */
export function useApplicationReminders() {
  const queryClient = useQueryClient()

  const remindersQuery = useQuery({
    queryKey: QUERY_KEYS.upcomingReminders(UPCOMING_REMINDER_DAYS),
    queryFn: () => applicationRemindersApi.getUpcoming(UPCOMING_REMINDER_DAYS),
    staleTime: 5 * 60 * 1000
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => applicationRemindersApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayReminders })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.upcomingReminders(UPCOMING_REMINDER_DAYS) })
    }
  })

  return {
    reminders: remindersQuery.data ?? [],

    // `isPending`, inte `isLoading`. Under React Querys retry-backoff är
    // `isFetching` falskt en stund, och `isLoading` (= isPending && isFetching)
    // blir då falskt medan `data` fortfarande är undefined. Komponenten hade
    // ritat "inga påminnelser" mitt i ett pågående försök.
    isLoading: remindersQuery.isPending,

    // Utan de här två KAN kalendern inte skilja ett trasigt anrop från en tom
    // lista, och sa "Allt klart för idag!" när hämtningen gått sönder.
    isError: remindersQuery.isError,
    error: remindersQuery.error instanceof Error ? remindersQuery.error.message : null,
    refetch: remindersQuery.refetch,

    completeReminder: completeMutation.mutateAsync
  }
}

// ============================================
// UPPSLAGNING id → ansökan
// ============================================

/**
 * Bara ansökningarna, för vyer som ska sätta ett namn på en händelse.
 *
 * Tidslinjen och Kontakter kallade `useApplications()` enbart för den här
 * uppslagningen och drog då igång FEM queries (ansökningar, statistik, gamla
 * ansökningar, dagens påminnelser, kommande påminnelser) för att kunna skriva
 * ut en jobbtitel.
 *
 * Nyckeln är avsiktligt identisk med den `useApplications()` bygger utan
 * filter och sortering — samma queryFn, samma form, ett cachekontrakt med en
 * ägare. Ändra den inte utan att ändra `useApplications` i samma andetag.
 */
export function useApplicationLookup() {
  const query = useQuery({
    queryKey: [...QUERY_KEYS.applications, undefined, undefined],
    queryFn: () => applicationsApi.getAll(),
    staleTime: 30 * 1000
  })

  const applications = useMemo(() => query.data ?? [], [query.data])

  const byId = useMemo(() => {
    const map = new Map<string, Application>()
    for (const app of applications) map.set(app.id, app)
    return map
  }, [applications])

  return {
    applications,
    byId,
    isLoading: query.isPending,
    isError: query.isError,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch
  }
}

export default useApplications
