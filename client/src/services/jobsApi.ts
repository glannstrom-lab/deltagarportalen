/**
 * Jobs-API: Arbetsförmedlingen-sökning, sparade jobb, ansökningar, och
 * jobbevakningar.
 *
 * Extraherat från supabaseApi.ts 2026-05-09 (P2-skuld). jobsApi/savedJobsApi/
 * jobAlertsApi delar typer och anropar varandra internt — flyttades därför
 * tillsammans.
 */

import { supabase } from '../lib/supabase'
import { APIError, handleError } from './apiError'
import { applicationsApi } from './applicationsApi'
import type { Application, ApplicationStatus } from '@/types/application.types'
import type { CVData, SavedJob, Skill, WorkExperience } from './supabaseApi'

/**
 * Application (domänform, gemen status) -> SavedJob (rå radform, VERSAL status).
 *
 * E12 (2026-07-28): jobbsökningens konsumenter arbetar med radformen. I stället
 * för att låta dem läsa tabellen själva översätts domänobjektet här, så
 * databasåtkomsten kan ligga samlad i applicationsApi.
 */
function toSavedJobRow(a: Application): SavedJob {
  return {
    id: a.id,
    user_id: a.userId,
    job_id: a.jobId,
    job_data: a.jobData as unknown as Record<string, unknown>,
    status: a.status.toUpperCase() as SavedJob['status'],
    notes: a.notes ?? null,
    applied_at: a.applicationDate ?? null,
    created_at: a.createdAt,
  }
}

// ============================================
// JOBS API (Arbetsförmedlingen)
// ============================================
export const jobsApi = {
  async search(params: {
    search?: string
    location?: string
    employmentType?: string
    remote?: boolean
    limit?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params.search) queryParams.set('q', params.search)
    if (params.location) queryParams.set('municipality', params.location)
    if (params.employmentType) queryParams.set('employment-type', params.employmentType)
    if (params.remote) queryParams.set('remote', 'true')

    const response = await fetch(
      `https://jobsearch.api.jobtechdev.se/search?${queryParams}&limit=${params.limit || 20}`
    )

    if (!response.ok) throw new APIError('Kunde inte söka jobb', 'SEARCH_ERROR')

    const data = await response.json()
    return data.hits || []
  },

  async searchJobs(params?: {
    search?: string
    location?: string
    employmentType?: string
    remote?: boolean
    limit?: number
  }) {
    return this.search(params || {})
  },

  async getById(id: string) {
    const response = await fetch(
      `https://jobsearch.api.jobtechdev.se/ad/${id}`
    )

    if (!response.ok) throw new APIError('Kunde inte hämta jobb', 'NOT_FOUND', 404)

    return response.json()
  },

  async saveJob(jobId: string, status: string = 'SAVED', jobData?: Record<string, unknown>) {
    let dataToSave = jobData
    if (!dataToSave) {
      try {
        dataToSave = await this.getById(jobId)
      } catch {
        dataToSave = { id: jobId }
      }
    }
    const app = await applicationsApi.saveJob(jobId, dataToSave ?? { id: jobId }, status.toLowerCase() as ApplicationStatus)
    return toSavedJobRow(app)
  },

  async getSavedJobs(): Promise<SavedJob[]> {
    return (await applicationsApi.getAll()).map(toSavedJobRow)
  },

  async getApplications(): Promise<SavedJob[]> {
    return this.getSavedJobs()
  },

  async updateApplication(id: string, updates: { status?: string, notes?: string }) {
    const app = await applicationsApi.update(id, {
      ...(updates.status ? { status: updates.status.toLowerCase() as ApplicationStatus } : {}),
      ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
    })
    return toSavedJobRow(app)
  },

  async deleteApplication(id: string) {
    await applicationsApi.delete(id)
    return true
  },

  async matchCV(jobId: string, cvData: CVData) {
    const job = await this.getById(jobId)

    const jobText = `${job.headline || ''} ${job.description?.text || ''} ${job.occupation?.label || ''}`.toLowerCase()
    const skills = cvData.skills || []
    const experiences = cvData.work_experience || []

    let matchScore = 0
    let maxScore = 0
    const matchingSkills: string[] = []
    const missingSkills: string[] = []

    skills.forEach((skill: Skill | string) => {
      maxScore += 3
      const skillName = typeof skill === 'string' ? skill : skill.name
      if (jobText.includes(skillName.toLowerCase())) {
        matchScore += 3
        matchingSkills.push(skillName)
      } else {
        missingSkills.push(skillName)
      }
    })

    experiences.forEach((exp: WorkExperience) => {
      const expTitle = (exp.title || '').toLowerCase()
      if (jobText.includes(expTitle)) {
        matchScore += 2
      }
      maxScore += 2
    })

    const score = maxScore > 0 ? Math.round((matchScore / maxScore) * 100) : 50

    return {
      matchPercentage: score,
      matchingSkills,
      missingSkills,
      suggestions: [
        'Anpassa ditt CV för att lyfta fram relevanta erfarenheter',
        'Inkludera nyckelord från annonsen i ditt personliga brev',
        'Beskriv hur dina tidigare resultat kan överföras till denna roll'
      ]
    }
  }
}

// ============================================
// SAVED JOBS API (Alias för kompatibilitet)
// ============================================
/**
 * savedJobsApi — jobbsökningens vy på saved_jobs.
 *
 * E12-konsolideringen (2026-07-28): all databasåtkomst ligger nu i
 * applicationsApi. Det här objektet är kvar som API-yta för jobbsöks-
 * konsumenterna (useSavedJobs, useDashboardData, Resources m.fl.) som arbetar
 * med rå radform (`job_id`/`job_data`/VERSAL status) i stället för domäntypen
 * `Application`. Det översätter alltså form — det pratar inte med databasen.
 *
 * Skiftläget hanteras numera på ETT ställe: applicationsApi versaliserar mot
 * databasen och gemenar vid läsning. Tidigare gjorde de tre lagren det olika,
 * mot samma kolumn.
 */
/**
 * Offline-lagret som följde med från cloudStorage-varianten (E12, 2026-07-28).
 * Det är INTE felmaskering i D11:s mening — det är en medveten affordans så att
 * jobb kan sparas innan man loggat in och överleva ett tillfälligt tapp. Behålls
 * ordagrant så konsolideringen inte tyst tar bort en funktion.
 */
const offline = {
  read(): SavedJob[] {
    try { return JSON.parse(localStorage.getItem('savedJobs') || '[]') } catch { return [] }
  },
  write(jobs: unknown[]) {
    localStorage.setItem('savedJobs', JSON.stringify(jobs))
  },
}

export const savedJobsApi = {
  async getAll(): Promise<SavedJob[]> {
    try {
      return await jobsApi.getSavedJobs()
    } catch (err) {
      console.error('Kunde inte hämta sparade jobb:', err)
      return offline.read()
    }
  },

  async save(jobId: string, jobData: Record<string, unknown>) {
    return jobsApi.saveJob(jobId, 'SAVED', jobData)
  },

  async updateStatus(jobId: string, status: string) {
    return toSavedJobRow(
      await applicationsApi.updateByJobId(jobId, { status: status.toLowerCase() as ApplicationStatus })
    )
  },

  async delete(jobId: string) {
    await applicationsApi.deleteByJobId(jobId)
    return true
  },

  async updateNotes(jobId: string, notes: string) {
    return toSavedJobRow(await applicationsApi.updateByJobId(jobId, { notes }))
  },

  async updateFollowUpDate(jobId: string, date: string | null) {
    return toSavedJobRow(await applicationsApi.updateByJobId(jobId, { followUpDate: date ?? undefined }))
  },

  async updatePriority(jobId: string, priority: 'low' | 'medium' | 'high') {
    return toSavedJobRow(await applicationsApi.updateByJobId(jobId, { priority }))
  },

  /**
   * add/remove/isSaved fanns tidigare bara i cloudStorage-varianten av
   * savedJobsApi. Ytan här är nu en superset av båda, så den konsoliderade
   * modulen kan ersätta bägge utan att någon konsument tappar en metod.
   */
  async add(job: { id: string; [key: string]: unknown }) {
    try {
      return await jobsApi.saveJob(job.id, 'SAVED', job)
    } catch (err) {
      console.error('Kunde inte spara jobb i molnet, sparar lokalt:', err)
      const saved = offline.read()
      saved.push(job as unknown as SavedJob)
      offline.write(saved)
      return job as unknown as SavedJob
    }
  },

  async remove(jobId: string) {
    try {
      await applicationsApi.deleteByJobId(jobId)
    } catch (err) {
      console.error('Kunde inte ta bort sparat jobb i molnet, tar bort lokalt:', err)
      offline.write(offline.read().filter(j => j.id !== jobId && j.job_id !== jobId))
    }
    return true
  },

  async isSaved(jobId: string): Promise<boolean> {
    try {
      return await applicationsApi.isSaved(jobId)
    } catch {
      return offline.read().some(j => j.id === jobId || j.job_id === jobId)
    }
  },

  async getByStatus(statuses: string[]): Promise<SavedJob[]> {
    const apps = await applicationsApi.getByStatus(
      statuses.map(s => s.toLowerCase() as ApplicationStatus)
    )
    return apps.map(toSavedJobRow)
  },

  async getApplications(): Promise<SavedJob[]> {
    return this.getByStatus(['APPLIED', 'INTERVIEW', 'REJECTED', 'OFFER'])
  }
}

// ============================================
// JOB ALERTS API
// ============================================
export interface JobAlert {
  id: string
  user_id: string
  name: string
  query?: string
  municipality?: string
  region?: string
  employment_type?: string
  published_within?: string
  remote?: boolean
  is_active: boolean
  notification_frequency: 'instant' | 'daily' | 'weekly'
  last_checked_at?: string
  new_jobs_count: number
  created_at: string
  updated_at: string
}

export const jobAlertsApi = {
  async getAll(): Promise<JobAlert[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('job_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) handleError(error)
    return data || []
  },

  async create(alert: Partial<JobAlert>): Promise<JobAlert> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('job_alerts')
      .insert({
        user_id: user.id,
        name: alert.name || 'Min bevakning',
        query: alert.query,
        municipality: alert.municipality,
        region: alert.region,
        employment_type: alert.employment_type,
        published_within: alert.published_within || 'week',
        remote: alert.remote || false,
        is_active: true,
        notification_frequency: alert.notification_frequency || 'daily',
        new_jobs_count: 0
      })
      .select()
      .single()

    if (error) handleError(error)
    return data
  },

  async update(id: string, updates: Partial<JobAlert>): Promise<JobAlert> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('job_alerts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) handleError(error)
    return data
  },

  async delete(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { error } = await supabase
      .from('job_alerts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) handleError(error)
    return true
  },

  async toggleActive(id: string, isActive: boolean): Promise<JobAlert> {
    return this.update(id, { is_active: isActive })
  },

  async updateNewJobsCount(id: string, count: number): Promise<void> {
    await this.update(id, {
      new_jobs_count: count,
      last_checked_at: new Date().toISOString()
    })
  }
}
