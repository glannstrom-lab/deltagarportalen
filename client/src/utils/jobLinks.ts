/**
 * Länkbyggare för jobbflödet — en källa i stället för tre handrullade
 * encodeURIComponent-kedjor (JobSearch-kortet, jobbdetalj-modalen,
 * DailyJobTab).
 */

import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'
import type { SpontaneousCompany } from '@/services/supabaseApi'

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

/** Länk till Personligt brev-generatorn, förifylld från ett sparat spontanföretag. */
export function buildSpontaneousCoverLetterUrl(
  company: Pick<SpontaneousCompany, 'company_name' | 'company_data'>,
  title: string,
  descMaxLength = 500,
): string {
  const desc = company.company_data?.businessDescription
    || company.company_data?.sniCodes?.[0]?.description
    || ''
  const params = new URLSearchParams({
    company: company.company_name,
    title,
    desc: desc.substring(0, descMaxLength),
  })
  return `/cover-letter?${params.toString()}`
}
