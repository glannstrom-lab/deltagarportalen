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

/**
 * Färgkodning per del. Använd via PartChip nedan eller direkt i klassnamn.
 * Värdena är klassiska Tailwind-utilities (whitelist-säkra) och håller sig
 * inom DESIGN.md:s neutrala bas + 4 distinkta accentnyanser.
 *   Del 1 — sky      (intro, lugn kartläggning)
 *   Del 2 — amber    (prova på, aktivt utforska)
 *   Del 3 — emerald  (arbetsprövning, riktigt arbete)
 *   Del 4 — violet   (matchning mot anställning)
 */
export const PART_COLORS: Record<
  1 | 2 | 3 | 4,
  { bg: string; text: string; border: string; bgSolid: string; ring: string; name: string }
> = {
  1: {
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    bgSolid: 'bg-sky-100',
    ring: 'ring-sky-300',
    name: 'Lär känna',
  },
  2: {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-200',
    bgSolid: 'bg-amber-100',
    ring: 'ring-amber-300',
    name: 'Prova på',
  },
  3: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    bgSolid: 'bg-emerald-100',
    ring: 'ring-emerald-300',
    name: 'Arbetsprövning',
  },
  4: {
    bg: 'bg-violet-50',
    text: 'text-violet-800',
    border: 'border-violet-200',
    bgSolid: 'bg-violet-100',
    ring: 'ring-violet-300',
    name: 'Hitta arbetsplats',
  },
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
 *
 * Räknar "vilken dag/vecka är vi inne på" direkt från part-tidslinjen istället
 * för att titta i sta_activities-tabellen. Tidigare visade vi "Ej startat" så
 * fort tabellen var tom — men deltagaren kan ha varit igång i veckor utan att
 * konsulenten hunnit logga aktiviteter. Nu visar vi schema-positionen alltid.
 */
export function describeCurrentActivity(enrollment: StaEnrollment): {
  primary: string
  subtext: string
  progress?: number
} {
  const timeline = derivePartTimeline(enrollment.started_at, enrollment.includes_part_2 ?? true)
  const seg = timeline.segments.find((s) => s.part === timeline.currentPart)!
  const today = new Date()
  const totalDays = Math.max(1, Math.round((seg.endDate.getTime() - seg.startDate.getTime()) / 86400000))
  const elapsedDays = Math.max(0, Math.round((today.getTime() - seg.startDate.getTime()) / 86400000))
  const currentDay = Math.min(elapsedDays + 1, totalDays)
  const progress = Math.min(100, Math.round((elapsedDays / totalDays) * 100))

  // Förfallen — visa hur mycket över tiden
  if (seg.isOverdue) {
    const daysOver = Math.round((today.getTime() - seg.endDate.getTime()) / 86400000)
    return {
      primary: `${daysOver} dagar över`,
      subtext: `Del ${seg.part} — ${PART_COLORS[seg.part].name}`,
      progress: 100,
    }
  }

  if (timeline.currentPart === 1) {
    return {
      primary: `Dag ${currentDay} av 21`,
      subtext: 'Del 1 — Lär känna',
      progress,
    }
  }
  if (timeline.currentPart === 2) {
    const week = Math.min(5, Math.floor(elapsedDays / 7) + 1)
    return {
      primary: `Vecka ${week} av 5 · dag ${currentDay} av 35`,
      subtext: 'Del 2 — Prova på',
      progress,
    }
  }
  if (timeline.currentPart === 3) {
    const monthsIn = Math.min(6, Math.floor(elapsedDays / 30) + 1)
    return {
      primary: `Månad ${monthsIn} av 6`,
      subtext: 'Del 3 — Arbetsprövning',
      progress,
    }
  }
  const monthsIn = Math.min(6, Math.floor(elapsedDays / 30) + 1)
  return {
    primary: `Månad ${monthsIn} av 6`,
    subtext: 'Del 4 — Hitta arbetsplats',
    progress,
  }
}

/**
 * Mappar EnrollmentStats → StaParticipantRow (samma format som tidigare mock).
 */
export function toParticipantRow(stats: EnrollmentStats): StaParticipantRow {
  const { enrollment, assessments, documents, quickNotes } = stats
  const fullName = resolveParticipantName(enrollment)
  const currentPart = deriveCurrentPart(enrollment)
  const { daysLeft, endDate } = daysLeftInPart(enrollment)
  const activityInfo = describeCurrentActivity(enrollment)

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
