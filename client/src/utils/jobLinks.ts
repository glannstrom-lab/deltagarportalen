/**
 * Länkbyggare för jobbflödet — en källa i stället för tre handrullade
 * encodeURIComponent-kedjor (JobSearch-kortet, jobbdetalj-modalen,
 * DailyJobTab).
 */

import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'

/** Länk till Personligt brev-generatorn, förifylld från en annons. */
export function buildCoverLetterUrl(job: PlatsbankenJob, descMaxLength = 500): string {
  const params = new URLSearchParams({
    jobId: job.id,
    company: job.employer?.name || '',
    title: job.headline,
    desc: job.description?.text?.substring(0, descMaxLength) || '',
  })
  return `/cover-letter?${params.toString()}`
}
