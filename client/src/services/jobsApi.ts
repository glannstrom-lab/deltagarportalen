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
import type { CVData, SavedJob, Skill, WorkExperience } from './supabaseApi'

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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    // Get job data if not provided
    let dataToSave = jobData
    if (!dataToSave) {
      try {
        dataToSave = await this.getById(jobId)
      } catch {
        dataToSave = { id: jobId }
      }
    }

    const { data, error } = await supabase
      .from('saved_jobs')
      .upsert({
        user_id: user.id,
        job_id: jobId,
        job_data: dataToSave,
        status: status
      }, {
        onConflict: 'user_id,job_id'
      })
      .select()
      .single()

    if (error) handleError(error)
    return data
  },

  async getSavedJobs(): Promise<SavedJob[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) handleError(error)
    return data || []
  },

  async getApplications(): Promise<SavedJob[]> {
    return this.getSavedJobs()
  },

  async updateApplication(id: string, updates: { status?: string, notes?: string }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const dbUpdates: Record<string, unknown> = {}
    if (updates.status) dbUpdates.status = updates.status.toUpperCase()
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes

    const { data, error } = await supabase
      .from('saved_jobs')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) handleError(error)
    return data
  },

  async deleteApplication(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) handleError(error)
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
export const savedJobsApi = {
  async getAll(): Promise<SavedJob[]> {
    return jobsApi.getSavedJobs()
  },

  async save(jobId: string, jobData: Record<string, unknown>) {
    return jobsApi.saveJob(jobId, 'SAVED', jobData)
  },

  async updateStatus(jobId: string, status: string) {
    const saved = await jobsApi.getSavedJobs()
    const job = saved.find(j => j.job_id === jobId)
    if (!job) throw new APIError('Jobb inte hittat', 'NOT_FOUND', 404)
    return jobsApi.updateApplication(job.id, { status })
  },

  async delete(jobId: string) {
    const saved = await jobsApi.getSavedJobs()
    const job = saved.find(j => j.job_id === jobId)
    if (!job) return true
    return jobsApi.deleteApplication(job.id)
  },

  async updateNotes(jobId: string, notes: string) {
    const saved = await jobsApi.getSavedJobs()
    const job = saved.find(j => j.job_id === jobId)
    if (!job) throw new APIError('Jobb inte hittat', 'NOT_FOUND', 404)
    return jobsApi.updateApplication(job.id, { notes })
  },

  async updateFollowUpDate(jobId: string, date: string | null) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const saved = await jobsApi.getSavedJobs()
    const job = saved.find(j => j.job_id === jobId)
    if (!job) throw new APIError('Jobb inte hittat', 'NOT_FOUND', 404)

    const { data, error } = await supabase
      .from('saved_jobs')
      .update({ follow_up_date: date, updated_at: new Date().toISOString() })
      .eq('id', job.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) handleError(error)
    return data
  },

  async updatePriority(jobId: string, priority: 'low' | 'medium' | 'high') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const saved = await jobsApi.getSavedJobs()
    const job = saved.find(j => j.job_id === jobId)
    if (!job) throw new APIError('Jobb inte hittat', 'NOT_FOUND', 404)

    const { data, error } = await supabase
      .from('saved_jobs')
      .update({ priority, updated_at: new Date().toISOString() })
      .eq('id', job.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) handleError(error)
    return data
  },

  async getByStatus(statuses: string[]): Promise<SavedJob[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('user_id', user.id)
      .in('status', statuses)
      .order('created_at', { ascending: false })

    if (error) handleError(error)
    return data || []
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
