/**
 * Application Types
 * Types for the comprehensive job application tracking system
 */

import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'

// ============================================
// STATUS & ENUM TYPES
// ============================================

export type ApplicationStatus =
  | 'interested'
  | 'saved'
  | 'applied'
  | 'screening'
  | 'phone'
  | 'interview'
  | 'assessment'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export type ApplicationSource =
  | 'job_search'
  | 'job_alert'
  | 'manual'
  | 'import'

export type ApplicationMethod =
  | 'email'
  | 'portal'
  | 'linkedin'
  | 'referral'
  | 'other'

export type ReminderType =
  | 'follow_up'
  | 'interview'
  | 'deadline'
  | 'phone_screen'
  | 'assessment'
  | 'custom'

export type HistoryEventType =
  | 'status_change'
  | 'note_added'
  | 'note_updated'
  | 'document_attached'
  | 'reminder_set'
  | 'reminder_completed'
  | 'contact_added'
  | 'contact_updated'
  | 'interview_scheduled'
  | 'offer_received'
  | 'created'
  | 'archived'

export type ApplicationPriority = 'high' | 'medium' | 'low'

// ============================================
// STATUS CONFIGURATION
// ============================================

/**
 * Färgerna följer EN hub-färg (activity/persika), inte elva olika.
 *
 * Till 2026-08-19 hade varje status sin egen palett — lila, skiffer, blå,
 * cyan, teal, sky, amber, grön, röd, grå — och alla ritades samtidigt i
 * tavlans kolumnhuvuden, på korten, i statusfördelningen och i detaljmodalen.
 * Åtta hubfärger på en sida som enligt DESIGN.md §4 ska ha en; sidans egen
 * persika syntes knappt.
 *
 * Nu bär färgen i stället tre INTENSITETER som säger något sant om var i
 * processen ansökan är, medan ikonen och etiketten skiljer de enskilda
 * statusarna åt (färg får aldrig vara enda informationsbäraren):
 *
 *   /8  — ännu inte sökt (intresserad, sparad)
 *   /15 — skickad, väntar (ansökt, första gallringen)
 *   /22 — dialog med arbetsgivaren (telefon, intervju, arbetsprov, erbjudande)
 *
 * De tre TERMINALA statusarna behåller semantisk färg: grönt, rött och
 * neutralt betyder något annat än "längre fram i tratten", och DESIGN.md §4
 * gör undantag för semantiska färger.
 *
 * Kontrasten är uppmätt mot `--activity-text` (#8B5418) på vit botten:
 * /8 → 5,60:1 · /15 → 5,11:1 · /22 → 4,62:1 — alla över WCAG AA:s 4,5:1.
 * Höj inte intensiteten utan att mäta om: /25 landar på 4,44 och faller.
 */
export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, {
  label: string
  labelEn: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
  order: number
  isTerminal: boolean
}> = {
  interested: {
    label: 'Intresserad',
    labelEn: 'Interested',
    color: 'text-[var(--c-text)]',
    bgColor: 'bg-[var(--c-solid)]/8',
    borderColor: 'border-[var(--c-solid)]/20',
    icon: 'Sparkles',
    order: 0,
    isTerminal: false
  },
  saved: {
    label: 'Sparad',
    labelEn: 'Saved',
    color: 'text-[var(--c-text)]',
    bgColor: 'bg-[var(--c-solid)]/8',
    borderColor: 'border-[var(--c-solid)]/20',
    icon: 'Bookmark',
    order: 1,
    isTerminal: false
  },
  applied: {
    label: 'Ansökt',
    labelEn: 'Applied',
    color: 'text-[var(--c-text)]',
    bgColor: 'bg-[var(--c-solid)]/15',
    borderColor: 'border-[var(--c-solid)]/30',
    icon: 'Send',
    order: 2,
    isTerminal: false
  },
  screening: {
    label: 'Granskning',
    labelEn: 'Screening',
    color: 'text-[var(--c-text)]',
    bgColor: 'bg-[var(--c-solid)]/15',
    borderColor: 'border-[var(--c-solid)]/30',
    icon: 'Eye',
    order: 3,
    isTerminal: false
  },
  phone: {
    label: 'Telefonintervju',
    labelEn: 'Phone Screen',
    color: 'text-[var(--c-text)]',
    bgColor: 'bg-[var(--c-solid)]/22',
    borderColor: 'border-[var(--c-solid)]/40',
    icon: 'Phone',
    order: 4,
    isTerminal: false
  },
  interview: {
    label: 'Intervju',
    labelEn: 'Interview',
    color: 'text-[var(--c-text)]',
    bgColor: 'bg-[var(--c-solid)]/22',
    borderColor: 'border-[var(--c-solid)]/40',
    icon: 'Users',
    order: 5,
    isTerminal: false
  },
  assessment: {
    label: 'Arbetsprov',
    labelEn: 'Assessment',
    color: 'text-[var(--c-text)]',
    bgColor: 'bg-[var(--c-solid)]/22',
    borderColor: 'border-[var(--c-solid)]/40',
    icon: 'FileCheck',
    order: 6,
    isTerminal: false
  },
  offer: {
    label: 'Erbjudande',
    labelEn: 'Offer',
    color: 'text-[var(--c-text)]',
    bgColor: 'bg-[var(--c-solid)]/22',
    borderColor: 'border-[var(--c-solid)]/40',
    icon: 'Trophy',
    order: 7,
    isTerminal: false
  },
  accepted: {
    label: 'Accepterad',
    labelEn: 'Accepted',
    color: 'text-green-800 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-300 dark:border-green-800',
    icon: 'CheckCircle',
    order: 8,
    isTerminal: true
  },
  rejected: {
    label: 'Avslag',
    labelEn: 'Rejected',
    color: 'text-red-800 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-300 dark:border-red-800',
    icon: 'XCircle',
    order: 9,
    isTerminal: true
  },
  withdrawn: {
    label: 'Dragen',
    labelEn: 'Withdrawn',
    color: 'text-stone-700 dark:text-stone-300',
    bgColor: 'bg-stone-100 dark:bg-stone-800',
    borderColor: 'border-stone-300 dark:border-stone-600',
    icon: 'MinusCircle',
    order: 10,
    isTerminal: true
  }
}

// Pipeline columns for Kanban view (non-terminal statuses)
export const PIPELINE_COLUMNS: ApplicationStatus[] = [
  'interested',
  'saved',
  'applied',
  'screening',
  'phone',
  'interview',
  'assessment',
  'offer'
]

// ============================================
// MAIN INTERFACES
// ============================================

export interface ManualJobData {
  headline: string
  employer?: {
    name: string
  }
  workplace_address?: {
    municipality?: string
    city?: string
  }
  description?: {
    text?: string
  }
  webpage_url?: string
  application_details?: {
    url?: string
    email?: string
  }
}

export interface SalaryInfo {
  offered?: number
  currency?: string
  negotiated?: number
  benefits?: string[]
}

export interface Application {
  id: string
  userId: string
  jobId: string
  jobData: PlatsbankenJob | ManualJobData
  status: ApplicationStatus
  source: ApplicationSource
  priority: 'high' | 'medium' | 'low'

  // Computed fields for easier access
  companyName?: string
  jobTitle?: string
  location?: string
  jobUrl?: string

  // Application details
  applicationMethod?: ApplicationMethod
  applicationDate?: string
  cvVersionId?: string
  coverLetterId?: string

  // Interview tracking
  interviewDate?: string

  // Offer tracking
  salaryInfo?: SalaryInfo
  offerDeadline?: string

  // Meta
  notes?: string
  followUpDate?: string
  archivedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface ApplicationHistoryEntry {
  id: string
  applicationId: string
  userId: string
  eventType: HistoryEventType
  oldValue?: string | null
  newValue?: string | null
  note?: string | null
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface ApplicationContact {
  id: string
  applicationId: string
  userId: string
  name: string
  title?: string | null
  email?: string | null
  phone?: string | null
  linkedinUrl?: string | null
  notes?: string | null
  isPrimary: boolean
  lastContactedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface ApplicationReminder {
  id: string
  applicationId: string
  userId: string
  reminderType: ReminderType
  reminderDate: string
  reminderTime?: string | null
  title: string
  description?: string | null
  isCompleted: boolean
  completedAt?: string | null
  createdAt: string
}

// ============================================
// STATISTICS TYPES
// ============================================

export interface ApplicationStats {
  total: number
  interested: number
  saved: number
  applied: number
  screening: number
  phone: number
  interview: number
  assessment: number
  offer: number
  accepted: number
  rejected: number
  withdrawn: number
  active: number
  thisWeek: number
  thisMonth: number
}

export interface ApplicationAnalytics {
  stats: ApplicationStats
  responseRate: number // % of applied that got response
  interviewRate: number // % of applied that got interview
  offerRate: number // % of interviews that got offer
  avgDaysToResponse: number
  avgDaysToInterview: number
  topSources: Array<{ source: ApplicationSource; count: number }>
  weeklyTrend: Array<{ week: string; applied: number; responses: number }>
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface CreateApplicationInput {
  jobId?: string
  jobData: PlatsbankenJob | ManualJobData
  status?: ApplicationStatus
  source?: ApplicationSource
  priority?: 'high' | 'medium' | 'low'
  applicationMethod?: ApplicationMethod
  applicationDate?: string
  notes?: string
  cvVersionId?: string
  coverLetterId?: string
}

export interface UpdateApplicationInput {
  status?: ApplicationStatus
  source?: ApplicationSource
  priority?: 'high' | 'medium' | 'low'
  applicationMethod?: ApplicationMethod
  applicationDate?: string
  interviewDate?: string
  cvVersionId?: string
  coverLetterId?: string
  salaryInfo?: SalaryInfo
  offerDeadline?: string
  notes?: string
  followUpDate?: string
  companyName?: string
  jobTitle?: string
  location?: string
  jobUrl?: string
}

export interface CreateContactInput {
  applicationId: string
  name: string
  title?: string
  email?: string
  phone?: string
  linkedinUrl?: string
  notes?: string
  isPrimary?: boolean
}

export interface CreateReminderInput {
  applicationId: string
  reminderType: ReminderType
  reminderDate: string
  reminderTime?: string
  title: string
  description?: string
}

// ============================================
// FILTER & SORT TYPES
// ============================================

export interface ApplicationFilters {
  status?: ApplicationStatus[]
  source?: ApplicationSource[]
  priority?: ('high' | 'medium' | 'low')[]
  search?: string
  dateRange?: {
    from?: string
    to?: string
  }
  hasReminders?: boolean
  isStale?: boolean // No update in X days
  archived?: boolean
}

export type ApplicationSortField =
  | 'createdAt'
  | 'updatedAt'
  | 'status'
  | 'priority'
  | 'companyName'
  | 'applicationDate'

export interface ApplicationSort {
  field: ApplicationSortField
  direction: 'asc' | 'desc'
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getStatusLabel(status: ApplicationStatus, lang: 'sv' | 'en' = 'sv'): string {
  return lang === 'sv'
    ? APPLICATION_STATUS_CONFIG[status].label
    : APPLICATION_STATUS_CONFIG[status].labelEn
}

export function getStatusColor(status: ApplicationStatus): string {
  return APPLICATION_STATUS_CONFIG[status].color
}

/**
 * Hur långt en ansökan bevisligen kommit i processen (statusordning).
 *
 * Terminala statusar säger inte var man var när processen tog slut:
 * avslag räknas som "har ansökt" (man kan inte få avslag utan att ha sökt),
 * återkallad räknas som "har ansökt" bara om ansökningsdatum finns.
 *
 * Låg 2026-08-19 till 2026-08-25 som privat funktion i
 * `ApplicationsAnalytics.tsx`. Flyttad hit när aktivitetsrapporten (O3)
 * behövde exakt samma bedömning — två kopior av "har personen sökt jobbet?"
 * hade garanterat glidit isär, och då hade statistiken och rapporten sagt
 * olika saker om samma rad.
 */
export function naddStatusordning(app: Application): number {
  if (app.status === 'rejected') {
    return APPLICATION_STATUS_CONFIG.applied.order
  }
  if (app.status === 'withdrawn') {
    return app.applicationDate ? APPLICATION_STATUS_CONFIG.applied.order : 0
  }
  return APPLICATION_STATUS_CONFIG[app.status].order
}

/** Har personen faktiskt sökt jobbet, eller bara bokmärkt det? */
export function harSokt(app: Application): boolean {
  return naddStatusordning(app) >= APPLICATION_STATUS_CONFIG.applied.order
}

export function getStatusBgColor(status: ApplicationStatus): string {
  return APPLICATION_STATUS_CONFIG[status].bgColor
}

export function isTerminalStatus(status: ApplicationStatus): boolean {
  return APPLICATION_STATUS_CONFIG[status].isTerminal
}

export function getNextStatuses(currentStatus: ApplicationStatus): ApplicationStatus[] {
  const order = APPLICATION_STATUS_CONFIG[currentStatus].order

  // Can always withdraw
  const nextStatuses: ApplicationStatus[] = ['withdrawn']

  // Can always be rejected from non-terminal
  if (!isTerminalStatus(currentStatus)) {
    nextStatuses.push('rejected')
  }

  // Add forward progression options
  const forwardStatuses = Object.entries(APPLICATION_STATUS_CONFIG)
    .filter(([, config]) => config.order > order && !config.isTerminal)
    .sort((a, b) => a[1].order - b[1].order)
    .slice(0, 2) // Only show next 2 logical steps
    .map(([status]) => status as ApplicationStatus)

  // Add offer and accepted if in late stages
  if (order >= 4) {
    if (!forwardStatuses.includes('offer')) forwardStatuses.push('offer')
    if (currentStatus === 'offer') forwardStatuses.push('accepted')
  }

  return [...forwardStatuses, ...nextStatuses]
}

export function statusToUppercase(status: ApplicationStatus): string {
  return status.toUpperCase()
}

export function statusFromUppercase(status: string): ApplicationStatus {
  return status.toLowerCase() as ApplicationStatus
}
