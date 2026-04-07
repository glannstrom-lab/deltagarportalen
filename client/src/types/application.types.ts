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
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    icon: 'Sparkles',
    order: 0,
    isTerminal: false
  },
  saved: {
    label: 'Sparad',
    labelEn: 'Saved',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    icon: 'Bookmark',
    order: 1,
    isTerminal: false
  },
  applied: {
    label: 'Ansökt',
    labelEn: 'Applied',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: 'Send',
    order: 2,
    isTerminal: false
  },
  screening: {
    label: 'Granskning',
    labelEn: 'Screening',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-100',
    borderColor: 'border-cyan-300',
    icon: 'Eye',
    order: 3,
    isTerminal: false
  },
  phone: {
    label: 'Telefonintervju',
    labelEn: 'Phone Screen',
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
    borderColor: 'border-teal-300',
    icon: 'Phone',
    order: 4,
    isTerminal: false
  },
  interview: {
    label: 'Intervju',
    labelEn: 'Interview',
    color: 'text-violet-700',
    bgColor: 'bg-violet-100',
    borderColor: 'border-violet-300',
    icon: 'Users',
    order: 5,
    isTerminal: false
  },
  assessment: {
    label: 'Arbetsprov',
    labelEn: 'Assessment',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-300',
    icon: 'FileCheck',
    order: 6,
    isTerminal: false
  },
  offer: {
    label: 'Erbjudande',
    labelEn: 'Offer',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    icon: 'Gift',
    order: 7,
    isTerminal: false
  },
  accepted: {
    label: 'Accepterad',
    labelEn: 'Accepted',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: 'CheckCircle',
    order: 8,
    isTerminal: true
  },
  rejected: {
    label: 'Avslag',
    labelEn: 'Rejected',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: 'XCircle',
    order: 9,
    isTerminal: true
  },
  withdrawn: {
    label: 'Dragen',
    labelEn: 'Withdrawn',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
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
  notes?: string
  cvVersionId?: string
  coverLetterId?: string
}

export interface UpdateApplicationInput {
  status?: ApplicationStatus
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
