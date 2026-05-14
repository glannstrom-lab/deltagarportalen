/**
 * Job + JobApplication typer
 * Flyttade från services/mockApi.ts (B5, 2026-05-15) — den filen var
 * 774 rader varav 23 mock*Api-exports utan callers. Bara dessa två typer
 * användes externt (av JobCard, JobDetailModal, ApplicationsTracker).
 */

export interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  requirements: string[]
  employmentType: string
  experienceLevel: string
  publishedAt: string
  publishedDate?: string  // Alias för bakåtkompatibilitet
  deadline?: string
  salary?: string
  salaryRange?: string  // Alias för bakåtkompatibilitet
  benefits: string[]
  matchPercentage?: number
  matchingSkills?: string[]
  missingKeywords?: string[]
  url: string
}

export interface JobApplication {
  id: string
  jobId: string
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
  appliedAt?: string
  appliedDate?: string  // Alias för bakåtkompatibilitet
  notes?: string
  job?: Job
}
