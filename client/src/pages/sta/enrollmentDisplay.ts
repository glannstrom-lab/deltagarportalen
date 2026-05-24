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
 * AF:s tidsfrister per del:
 *   Del 1: 3 veckor
 *   Del 2: 5 veckor
 *   Del 3: 6 månader (kalendermånader)
 *   Del 4: 6 månader (kalendermånader)
 *
 * Vi mäter i den enhet AF mäter — veckor för Del 1/2, kalendermånader för
 * Del 3/4 — så slutdatum hamnar på samma dag-i-månaden istället för 4 dagar
 * fel (180 dagar ≠ 6 kalendermånader).
 */
export const PART_DURATIONS = {
  1: { weeks: 3 },
  2: { weeks: 5 },
  3: { months: 6 },
  4: { months: 6 },
} as const

/** Mänsklig label per del — för UI. */
export const PART_DURATION_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: '3 v',
  2: '5 v',
  3: '6 mån',
  4: '6 mån',
}

function addPartDuration(date: Date, part: 1 | 2 | 3 | 4): Date {
  const d = new Date(date)
  const config = PART_DURATIONS[part]
  if ('weeks' in config) {
    d.setDate(d.getDate() + config.weeks * 7)
  } else {
    d.setMonth(d.getMonth() + config.months)
  }
  return d
}

export interface PartSegment {
  part: 1 | 2 | 3 | 4
  startDate: Date
  endDate: Date
  /** Mänsklig längdetikett ("3 v", "5 v", "6 mån"). */
  durationLabel: string
  /** TRUE om idag ligger inom [startDate, endDate). */
  isCurrent: boolean
  /** TRUE om delen redan är passerad (endDate < idag). */
  isPast: boolean
  /** TRUE om delen är aktiv men dagens datum kommit förbi maxtiden. */
  isOverdue: boolean
}

export interface PartTimeline {
  /** Härlett part-nummer från start_date + includes_part_2 + idag. */
  currentPart: 1 | 2 | 3 | 4
  /** När den aktuella delen började. */
  partStartedAt: Date
  /** När den aktuella delen tar slut. */
  partEndsAt: Date
  /** Dagar kvar (0 om förfallen). */
  daysLeft: number
  /** Hela tidslinjen, alltid Del 1 → 4 (Del 2 utesluts om !includesPart2). */
  segments: PartSegment[]
}

/**
 * Härleder vilken del deltagaren är i, baserat på startdatum + om Del 2 ingår
 * + idag. ALLA delar progredieras automatiskt på datum — konsulenten behöver
 * bara välja om Del 2 ingår, allt annat räknas ut.
 *
 * Tidslinjen om Del 2 ingår:    Del 1 (3v) → Del 2 (5v) → Del 3 (6mån) → Del 4 (6mån)
 * Tidslinjen utan Del 2:        Del 1 (3v) →             Del 3 (6mån) → Del 4 (6mån)
 *
 * Efter Del 4 stannar vi i Del 4 (markeras som overdue om tiden gått ut).
 */
export function derivePartTimeline(
  startedAt: string | Date,
  includesPart2: boolean,
  today: Date = new Date(),
): PartTimeline {
  const start = typeof startedAt === 'string' ? new Date(startedAt) : new Date(startedAt)
  const part1End = addPartDuration(start, 1)
  const part2Start = part1End
  const part2End = includesPart2 ? addPartDuration(part2Start, 2) : part2Start
  const part3Start = part2End
  const part3End = addPartDuration(part3Start, 3)
  const part4Start = part3End
  const part4End = addPartDuration(part4Start, 4)

  let currentPart: 1 | 2 | 3 | 4
  if (today < part1End) {
    currentPart = 1
  } else if (includesPart2 && today < part2End) {
    currentPart = 2
  } else if (today < part3End) {
    currentPart = 3
  } else {
    // Efter Del 3-tiden — Del 4 (auto). Stannar på Del 4 även när Del 4 förfallen.
    currentPart = 4
  }

  const segments: PartSegment[] = [
    buildSegment(1, start, part1End, today, currentPart),
    ...(includesPart2 ? [buildSegment(2, part2Start, part2End, today, currentPart)] : []),
    buildSegment(3, part3Start, part3End, today, currentPart),
    buildSegment(4, part4Start, part4End, today, currentPart),
  ]

  const currentSegment = segments.find((s) => s.part === currentPart)!
  const daysLeft = Math.max(
    0,
    Math.ceil((currentSegment.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
  )

  return {
    currentPart,
    partStartedAt: currentSegment.startDate,
    partEndsAt: currentSegment.endDate,
    daysLeft,
    segments,
  }
}

function buildSegment(
  part: 1 | 2 | 3 | 4,
  startDate: Date,
  endDate: Date,
  today: Date,
  currentPart: 1 | 2 | 3 | 4,
): PartSegment {
  const isCurrent = part === currentPart
  const isPast = endDate < today && !isCurrent
  const isOverdue = isCurrent && today >= endDate
  return {
    part,
    startDate,
    endDate,
    durationLabel: PART_DURATION_LABELS[part],
    isCurrent,
    isPast,
    isOverdue,
  }
}

/**
 * Bekväm wrapper för existerande kod — accepterar StaEnrollment och returnerar
 * { daysLeft, endDate } som tidigare. Bytte från DB-baserad räkning till
 * härlett part + datum.
 */
export function daysLeftInPart(enrollment: StaEnrollment): {
  daysLeft: number
  endDate: Date
} {
  const timeline = derivePartTimeline(enrollment.started_at, enrollment.includes_part_2 ?? true)
  return { daysLeft: timeline.daysLeft, endDate: timeline.partEndsAt }
}

/**
 * Härlett current_part för en enrollment. Använd den här istället för
 * enrollment.current_part när du visar "deltagaren är i Del X" i UI.
 */
export function deriveCurrentPart(enrollment: StaEnrollment): 1 | 2 | 3 | 4 {
  return derivePartTimeline(enrollment.started_at, enrollment.includes_part_2 ?? true).currentPart
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
 * Resolver namn för en enrollment.
 *
 * Prioritet:
 *   1. external_name — sätts vid bulk-invite/manuellt-tillagd. Bevaras
 *      även om deltagaren senare registrerar sig på Jobin.
 *   2. participant_profile.first_name + last_name — joinas från profiles
 *      när deltagaren är linked till Jobin-konto.
 *   3. participant_profile.email — sista utväg innan generisk fallback.
 *   4. Generisk fallback (default: 'Deltagare utan namn').
 *
 * Använd överallt i konsulent-vyn för att inte få "Jobin-deltagare"
 * på linked-rader.
 */
export function resolveParticipantName(
  enrollment: Pick<StaEnrollment, 'external_name' | 'participant_profile'>,
  fallback: string = 'Deltagare utan namn',
): string {
  if (enrollment.external_name?.trim()) return enrollment.external_name.trim()
  const profile = enrollment.participant_profile
  if (profile) {
    const composed = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim()
    if (composed) return composed
    if (profile.email) return profile.email
  }
  return fallback
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
  const totalActivities = partActivities.length

  if (currentPart === 1) {
    if (totalActivities === 0) {
      return { primary: 'Ej startat', subtext: 'Del 1 dagsslinga', progress: 0 }
    }
    return {
      primary: `Dag ${Math.min(completed + 1, 14)}/14 · pågående`,
      subtext: 'Del 1 dagsslinga',
      progress: Math.round((completed / 14) * 100),
    }
  }
  if (currentPart === 2) {
    const stations = partActivities.filter((a) => a.activity_type === 'arbetsstation').length
    if (stations === 0 && totalActivities === 0) {
      return { primary: 'Ej startat', subtext: 'Del 2 arbetsstationer' }
    }
    return {
      primary: `Station ${stations} av 4`,
      subtext: 'Del 2 arbetsstationer',
    }
  }
  if (currentPart === 3) {
    if (totalActivities === 0) {
      return { primary: 'Ej startat', subtext: 'Del 3 — väntar på arbetsprövning' }
    }
    return {
      primary: 'Arbetsprövning',
      subtext: 'Del 3 — pågående',
    }
  }
  if (totalActivities === 0) {
    return { primary: 'Ej startat', subtext: 'Del 4 — väntar på arbetsplats' }
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
  const fullName = resolveParticipantName(enrollment)
  const currentPart = deriveCurrentPart(enrollment)
  const { daysLeft, endDate } = daysLeftInPart(enrollment)
  const activityInfo = describeCurrentActivity(activities, currentPart)

  const partAssessments = assessments.filter((a) => a.part === currentPart)
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
    currentPart,
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
    perPart[deriveCurrentPart(stats.enrollment)] += 1
    draftsToReview += countDraftsToReview(stats.documents)
    assessmentsInProgress += stats.assessments.filter((a) => a.status === 'draft').length
  }

  return { active, perPart, draftsToReview, assessmentsInProgress }
}
