/**
 * STA-deadline-utility — beräkning av AF-tidsfrister per delredovisning.
 *
 * Använder PART_DURATIONS från enrollmentDisplay.ts via daysLeftInPart.
 * Per enrollment och nuvarande del: en delredovisning ska in när delen löper ut.
 *
 * En enrollment har EN aktiv deadline åt gången — nästa delredovisning.
 * Om delredovisningen för current_part redan är 'submitted' eller 'approved'
 * räknas den inte som aktiv (man har redan lämnat in).
 */

import { daysLeftInPart, deriveCurrentPart, resolveParticipantName } from './enrollmentDisplay'
import type { EnrollmentStats } from './enrollmentDisplay'

export interface StaDeadline {
  enrollmentId: string
  participantName: string
  part: 1 | 2 | 3 | 4
  docType: string // 'delredovisning_1'..'delredovisning_4'
  daysLeft: number
  dueAt: Date
  /** Skickad/godkänd? Då är den inte aktiv längre. */
  alreadySubmitted: boolean
}

const DOC_TYPE_FOR_PART: Record<1 | 2 | 3 | 4, string> = {
  1: 'delredovisning_1',
  2: 'delredovisning_2',
  3: 'delredovisning_3',
  4: 'delredovisning_4',
}

/**
 * Returnerar nästa aktiva delredovisnings-deadline för en enrollment,
 * eller null om current_part redan är inlämnad / avbruten.
 */
export function nextDeadlineFor(stats: EnrollmentStats): StaDeadline | null {
  const { enrollment, documents } = stats
  if (enrollment.status !== 'active' && enrollment.status !== 'paused') {
    return null
  }

  const part = deriveCurrentPart(enrollment)
  const docType = DOC_TYPE_FOR_PART[part]

  const alreadySubmitted = documents.some(
    (d) => d.doc_type === docType && (d.status === 'submitted' || d.status === 'approved' || d.status === 'submitted_to_af'),
  )

  const { daysLeft, endDate } = daysLeftInPart(enrollment)

  return {
    enrollmentId: enrollment.id,
    participantName: resolveParticipantName(enrollment),
    part,
    docType,
    daysLeft,
    dueAt: endDate,
    alreadySubmitted,
  }
}

/**
 * Alla aktiva deadlines för en lista enrollments, sorterade efter dagar kvar.
 * Filtrerar bort redan inlämnade och paused/cancelled enrollments.
 */
export function collectActiveDeadlines(allStats: EnrollmentStats[]): StaDeadline[] {
  const all = allStats
    .map(nextDeadlineFor)
    .filter((d): d is StaDeadline => d !== null && !d.alreadySubmitted)
  all.sort((a, b) => a.daysLeft - b.daysLeft)
  return all
}

/** Antal deadlines inom N dagar (default 7) — för KPI-kortet. */
export function countDeadlinesWithinDays(allStats: EnrollmentStats[], days = 7): number {
  return collectActiveDeadlines(allStats).filter((d) => d.daysLeft <= days).length
}

/** Visuell ton per dagar-kvar. */
export function deadlineSeverity(daysLeft: number): 'critical' | 'warning' | 'normal' {
  if (daysLeft <= 3) return 'critical'
  if (daysLeft <= 7) return 'warning'
  return 'normal'
}

export function formatDocType(docType: string): string {
  switch (docType) {
    case 'delredovisning_1': return 'Delredovisning Del 1'
    case 'delredovisning_2': return 'Delredovisning Del 2'
    case 'delredovisning_3': return 'Delredovisning Del 3'
    case 'delredovisning_4': return 'Delredovisning Del 4'
    default: return docType
  }
}

export function formatDaysLeft(daysLeft: number): string {
  if (daysLeft === 0) return 'idag'
  if (daysLeft === 1) return 'imorgon'
  if (daysLeft < 0) return `${Math.abs(daysLeft)} dagar sent`
  return `om ${daysLeft} dagar`
}
