/**
 * Mappar StaEnrollment + relaterad data till display-format för UI.
 *
 * Tidigare bodde CONSULTANT_PARTICIPANTS-mocken i mockData.ts. Nu beräknas
 * samma fält från riktiga DB-rader. Mock-strukturen bevaras som typ så att
 * UI-komponenterna kan återanvändas utan ändringar.
 */

import type {
  StaEnrollment,
  StaActivity,
  StaAssessment,
  StaDocument,
  StaQuickNote,
  StaWorkplace,
} from '@/services/staApi'
import type { StaParticipantRow } from './mockData'

export interface EnrollmentStats {
  enrollment: StaEnrollment
  activities: StaActivity[]
  assessments: StaAssessment[]
  documents: StaDocument[]
  quickNotes: StaQuickNote[]
  workplaces: StaWorkplace[]
}

/**
 * Returnerar initialer från ett namn ("Anna Karlsson" → "AK").
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '??'
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Hur många dagar kvar i nuvarande del? Förenklat — räknar arbetsdagar-aktigt.
 * Del 1: 21 dagar, Del 2: 35 dagar, Del 3-4: 180 dagar (max).
 */
const PART_DURATIONS: Record<1 | 2 | 3 | 4, number> = {
  1: 21,
  2: 35,
  3: 180,
  4: 180,
}

export function daysLeftInPart(enrollment: StaEnrollment): {
  daysLeft: number
  endDate: Date
} {
  const start = new Date(enrollment.part_started_at)
  const duration = PART_DURATIONS[enrollment.current_part]
  const end = new Date(start)
  end.setDate(start.getDate() + duration)
  const now = new Date()
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  return { daysLeft, endDate: end }
}

/**
 * Formatterar ett datum kort: "27 maj" eller "12 sep".
 */
export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }).format(date)
}

/**
 * Hur många dagar har deltagaren gjort i dagsslingan (Del 1, activity_key 'dag-N')?
 */
export function countCompletedDays(activities: StaActivity[]): number {
  return activities.filter((a) => a.completed_at && a.activity_key?.startsWith('dag-')).length
}

/**
 * Hur många dokumentutkast väntar på granskning?
 */
export function countDraftsToReview(documents: StaDocument[]): number {
  return documents.filter((d) => d.status === 'draft' || d.status === 'consultant_review').length
}

/**
 * Snabb-beskrivning av aktuell aktivitet (för listvyer).
 */
export function describeCurrentActivity(activities: StaActivity[], currentPart: 1 | 2 | 3 | 4): {
  primary: string
  subtext: string
  progress?: number
} {
  const partActivities = activities.filter((a) => a.part === currentPart)
  const completed = countCompletedDays(partActivities)

  if (currentPart === 1) {
    return {
      primary: `Dag ${Math.min(completed + 1, 14)}/14 · pågående`,
      subtext: 'Del 1 dagsslinga',
      progress: Math.round((completed / 14) * 100),
    }
  }
  if (currentPart === 2) {
    const stations = partActivities.filter((a) => a.activity_type === 'arbetsstation').length
    return {
      primary: `Station ${stations} av 4`,
      subtext: 'Del 2 arbetsstationer',
    }
  }
  if (currentPart === 3) {
    return {
      primary: 'Arbetsprövning',
      subtext: 'Del 3 — pågående',
    }
  }
  return {
    primary: 'Arbetsplats',
    subtext: 'Del 4 — pågående',
  }
}

/**
 * Mappar EnrollmentStats → StaParticipantRow (samma format som tidigare mock).
 */
export function toParticipantRow(stats: EnrollmentStats): StaParticipantRow {
  const { enrollment, activities, assessments, documents, quickNotes } = stats
  const fullName = enrollment.external_name ?? 'Jobin-deltagare'
  const { daysLeft, endDate } = daysLeftInPart(enrollment)
  const activityInfo = describeCurrentActivity(activities, enrollment.current_part)

  const partAssessments = assessments.filter((a) => a.part === enrollment.current_part)
  const assessmentChips = partAssessments.slice(0, 3).map((a) => {
    if (a.status === 'complete') return { label: `${a.instrument} ✓`, status: 'done' as const }
    if (a.status === 'submitted_to_af') return { label: `${a.instrument} → AF`, status: 'done' as const }
    return { label: `${a.instrument} pågående`, status: 'in_progress' as const }
  })
  if (assessmentChips.length === 0) {
    assessmentChips.push({ label: 'Ej startat', status: 'pending' as const })
  }

  return {
    id: enrollment.id,
    initials: getInitials(fullName),
    fullName,
    focusOccupation: enrollment.focus_occupation,
    currentPart: enrollment.current_part,
    daysLeftInPart: daysLeft,
    partEndsAt: formatShortDate(endDate),
    currentActivity: activityInfo.primary,
    activitySubtext: activityInfo.subtext,
    activityProgress: activityInfo.progress,
    assessments: assessmentChips,
    adaptations: enrollment.adaptations ?? 'Inga särskilda',
    hasDraft: countDraftsToReview(documents),
    hasMessage: quickNotes.filter((n) => n.visibility === 'shared_with_participant').length,
    linkStatus: enrollment.link_status,
    weeklyHours: enrollment.weekly_hours,
    enrollmentStatus: enrollment.status,
    manualContact: {
      email: enrollment.external_email ?? undefined,
      phone: enrollment.external_phone ?? undefined,
    },
    manualPersonalId: enrollment.external_personal_id ?? undefined,
  }
}

/**
 * Aggregerar KPI-data för konsulent-översikten.
 */
export function computeKpi(allStats: EnrollmentStats[]): {
  active: number
  perPart: Record<1 | 2 | 3 | 4, number>
  draftsToReview: number
  assessmentsInProgress: number
} {
  const perPart = { 1: 0, 2: 0, 3: 0, 4: 0 } as Record<1 | 2 | 3 | 4, number>
  let draftsToReview = 0
  let assessmentsInProgress = 0
  let active = 0

  for (const stats of allStats) {
    if (stats.enrollment.status !== 'active') continue
    active += 1
    perPart[stats.enrollment.current_part] += 1
    draftsToReview += countDraftsToReview(stats.documents)
    assessmentsInProgress += stats.assessments.filter((a) => a.status === 'draft').length
  }

  return { active, perPart, draftsToReview, assessmentsInProgress }
}
