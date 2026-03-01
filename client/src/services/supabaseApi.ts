/**
 * Supabase API Service - Deltagarportalen
 * All datahantering sker via Supabase (PostgreSQL + Auth + Edge Functions)
 */

import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/supabase'

// ============================================
// TYPES
// ============================================
export interface CVData {
  id?: string
  user_id?: string
  profile_image?: string | null
  title?: string | null
  email?: string | null
  phone?: string | null
  location?: string | null
  summary?: string | null
  work_experience?: Array<{
    id?: string
    title: string
    company: string
    description?: string
    startDate?: string
    endDate?: string
    current?: boolean
  }>
  education?: Array<{
    id?: string
    degree: string
    school: string
    startDate?: string
    endDate?: string
  }>
  skills?: string[]
  languages?: Array<{
    language: string
    level: string
  }>
  certificates?: Array<{
    name: string
    issuer?: string
    date?: string
  }>
  links?: Array<{
    type: string
    url: string
  }>
  references?: Array<{
    name: string
    relation: string
    contact?: string
  }>
  template?: string
  color_scheme?: string
  font?: string
  ats_score?: number | null
  ats_feedback?: any
}

export interface CoverLetter {
  id: string
  user_id: string
  title: string
  job_ad?: string | null
  content: string
  company?: string | null
  job_title?: string | null
  ai_generated: boolean
  created_at: string
  updated_at: string
}

export interface SavedJob {
  id: string
  user_id: string
  job_id: string
  job_data: any
  status: 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'REJECTED' | 'ACCEPTED'
  notes?: string | null
  applied_at?: string | null
  created_at: string
}

// ============================================
// ERROR HANDLING
// ============================================
class APIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message)
    this.name = 'APIError'
  }
}

function handleError(error: any): never {
  if (error.code === 'PGRST116') {
    throw new APIError('Resursen hittades inte', 'NOT_FOUND', 404)
  }
  if (error.code === '42501') {
    throw new APIError('Åtkomst nekad', 'FORBIDDEN', 403)
  }
  if (error.code === '23505') {
    throw new APIError('Resursen finns redan', 'CONFLICT', 409)
  }
  throw new APIError(
    error.message || 'Ett fel uppstod',
    error.code,
    error.status
  )
}

// ============================================
// AUTH API
// ============================================
export const authApi = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw new APIError(error.message, error.code)
    
    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()
    
    return {
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email!,
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        role: profile?.role || 'USER'
      }
    }
  },

  async register(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    role?: 'USER' | 'CONSULTANT'
  }) {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role || 'USER'
        }
      }
    })
    
    if (error) throw new APIError(error.message, error.code)
    
    if (!data.session) {
      throw new APIError('Konto skapat men kräver e-postbekräftelse', 'EMAIL_NOT_CONFIRMED')
    }
    
    return {
      token: data.session.access_token,
      user: {
        id: data.user!.id,
        email: data.user!.email!,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'USER'
      }
    }
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    
    return {
      id: user.id,
      email: user.email!,
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      role: profile?.role || 'USER'
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new APIError(error.message, error.code)
  }
}

// ============================================
// CV API
// ============================================
export const cvApi = {
  async getCV(): Promise<CVData | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (error) handleError(error)
    
    if (!data) return null
    
    // Transform snake_case to camelCase
    return {
      ...data,
      workExperience: data.work_experience || [],
      colorScheme: data.color_scheme,
      firstName: data.first_name,
      lastName: data.last_name,
    }
  },

  async updateCV(cvData: Partial<CVData>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    // Transform camelCase to snake_case
    const dbData: any = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
      title: cvData.title,
      email: cvData.email,
      phone: cvData.phone,
      location: cvData.location,
      summary: cvData.summary,
      work_experience: cvData.work_experience || cvData.workExperience,
      education: cvData.education,
      skills: cvData.skills,
      languages: cvData.languages,
      certificates: cvData.certificates,
      links: cvData.links,
      "references": cvData.references,
      template: cvData.template,
      color_scheme: cvData.color_scheme || cvData.colorScheme,
      font: cvData.font,
    }
    
    // Remove undefined values
    Object.keys(dbData).forEach(key => {
      if (dbData[key] === undefined) delete dbData[key]
    })
    
    const { data, error } = await supabase
      .from('cvs')
      .upsert(dbData)
      .select()
      .single()
    
    if (error) handleError(error)
    return data
  },

  async getATSAnalysis() {
    const cv = await this.getCV()
    if (!cv) return null
    
    return {
      score: cv.ats_score || 0,
      feedback: cv.ats_feedback || []
    }
  },

  async getVersions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const { data, error } = await supabase
      .from('cv_versions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) handleError(error)
    return data || []
  },

  async saveVersion(name: string, cvData: CVData) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const { data, error } = await supabase
      .from('cv_versions')
      .insert({
        user_id: user.id,
        name,
        data: cvData
      })
      .select()
      .single()
    
    if (error) handleError(error)
    return data
  },

  async restoreVersion(versionId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const { data, error } = await supabase
      .from('cv_versions')
      .select('data')
      .eq('id', versionId)
      .eq('user_id', user.id)
      .single()
    
    if (error) handleError(error)
    return data?.data
  },

  async shareCV() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    // Generate unique share code
    const shareCode = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    
    const { data, error } = await supabase
      .from('cv_shares')
      .insert({
        user_id: user.id,
        share_code: shareCode,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()
    
    if (error) handleError(error)
    
    const shareUrl = `${window.location.origin}/cv/shared/${shareCode}`
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`
    
    return {
      shareUrl,
      qrCode: qrCodeUrl,
      expiresAt: expiresAt.toISOString(),
      shareCode
    }
  },

  async getSharedCV(shareCode: string) {
    const { data, error } = await supabase
      .from('cv_shares')
      .select(`
        *,
        cvs(*)
      `)
      .eq('share_code', shareCode)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (error) handleError(error)
    return data
  }
}

// ============================================
// INTEREST GUIDE API
// ============================================
export const interestApi = {
  async getQuestions() {
    // Questions are static in the app
    return { questions: [] }
  },

  async getResult() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const { data, error } = await supabase
      .from('interest_results')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (error) handleError(error)
    return data
  },

  async saveResult(resultData: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const { data, error } = await supabase
      .from('interest_results')
      .upsert({
        ...resultData,
        user_id: user.id,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) handleError(error)
    return data
  },

  async getRecommendations() {
    const result = await this.getResult()
    if (!result) return { occupations: [] }
    
    return {
      occupations: result.recommended_jobs || []
    }
  }
}

// ============================================
// COVER LETTER API
// ============================================
export const coverLetterApi = {
  async getAll(): Promise<CoverLetter[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const { data, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) handleError(error)
    return data || []
  },

  async getById(id: string): Promise<CoverLetter | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const { data, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      handleError(error)
    }
    return data
  },

  async create(letterData: Partial<CoverLetter>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const { data, error } = await supabase
      .from('cover_letters')
      .insert({
        ...letterData,
        user_id: user.id
      })
      .select()
      .single()
    
    if (error) handleError(error)
    return data
  },

  async update(id: string, letterData: Partial<CoverLetter>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const { data, error } = await supabase
      .from('cover_letters')
      .update({
        ...letterData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) handleError(error)
    return data
  },

  async delete(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const { error } = await supabase
      .from('cover_letters')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (error) handleError(error)
    return true
  },

  async generate(params: {
    cvData: any
    jobDescription: string
    companyName: string
    jobTitle: string
    tone?: 'formal' | 'friendly' | 'enthusiastic'
    focus?: 'experience' | 'skills' | 'motivation'
  }) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const response = await fetch(
      `${supabaseUrl}/functions/v1/ai-cover-letter`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      }
    )
    
    if (!response.ok) {
      const err = await response.json()
      throw new APIError(err.error || 'Kunde inte generera brev', 'GENERATION_ERROR')
    }
    
    return response.json()
  }
}

// ============================================
// ARTICLES API
// ============================================
export const articleApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
    
    if (error) handleError(error)
    return data || []
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) handleError(error)
    return data
  },

  async getByCategory(category: string) {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .eq('category', category)
      .order('created_at', { ascending: false })
    
    if (error) handleError(error)
    return data || []
  },

  async getCategories() {
    const { data, error } = await supabase
      .from('articles')
      .select('category, subcategory')
      .eq('published', true)
    
    if (error) handleError(error)
    
    // Extract unique categories with their subcategories
    const categoryMap = new Map()
    
    data?.forEach((article: any) => {
      const cat = article.category || 'Övrigt'
      const sub = article.subcategory
      
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { name: cat, subcategories: new Set() })
      }
      
      if (sub) {
        categoryMap.get(cat).subcategories.add(sub)
      }
    })
    
    // Convert to array format expected by components
    return Array.from(categoryMap.values()).map((cat: any) => ({
      name: cat.name,
      slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
      subcategories: Array.from(cat.subcategories)
    }))
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

  async searchJobs(params?: any) {
    return this.search(params || {})
  },

  async getById(id: string) {
    const response = await fetch(
      `https://jobsearch.api.jobtechdev.se/ad/${id}`
    )
    
    if (!response.ok) throw new APIError('Kunde inte hämta jobb', 'NOT_FOUND', 404)
    
    return response.json()
  },

  async saveJob(jobId: string, status: string = 'SAVED', jobData?: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    // Get job data if not provided
    let dataToSave = jobData
    if (!dataToSave) {
      try {
        dataToSave = await this.getById(jobId)
      } catch (e) {
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
    
    const dbUpdates: any = {}
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
    
    skills.forEach((skill: any) => {
      maxScore += 3
      if (jobText.includes((skill.name || skill).toLowerCase())) {
        matchScore += 3
        matchingSkills.push(skill.name || skill)
      } else {
        missingSkills.push(skill.name || skill)
      }
    })
    
    experiences.forEach((exp: any) => {
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
// USER API
// ============================================
export const userApi = {
  async getProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) handleError(error)
    return data
  },

  async updateProfile(updates: Partial<Tables['profiles']>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    
    if (error) handleError(error)
    return data
  },

  async updateSettings(settings: {
    calmMode?: boolean
    highContrast?: boolean
    largeText?: boolean
    reduceMotion?: boolean
    emailNotifications?: boolean
    jobAlerts?: boolean
    preferredLanguage?: string
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        calm_mode: settings.calmMode,
        high_contrast: settings.highContrast,
        large_text: settings.largeText,
        reduce_motion: settings.reduceMotion,
        email_notifications: settings.emailNotifications,
        job_alerts: settings.jobAlerts,
        preferred_language: settings.preferredLanguage,
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()
    
    if (error) handleError(error)
    return data
  }
}

// ============================================
// SAVED JOBS API (Alias för kompatibilitet)
// ============================================
export const savedJobsApi = {
  async getAll(): Promise<SavedJob[]> {
    return jobsApi.getSavedJobs()
  },

  async save(jobId: string, jobData: any) {
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
  }
}

// ============================================
// ACTIVITY API
// ============================================
export const activityApi = {
  async logActivity(activityType: string, activityData?: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const { data, error } = await supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        activity_type: activityType,
        activity_data: activityData || {}
      })
      .select()
      .single()
    
    if (error) handleError(error)
    return data
  },

  async getActivities(activityType?: string, limit: number = 30) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    let query = supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (activityType) {
      query = query.eq('activity_type', activityType)
    }
    
    const { data, error } = await query
    
    if (error) handleError(error)
    return data || []
  },

  async getActivityCounts(days: number = 10) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await supabase
      .from('user_activities')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })
    
    if (error) handleError(error)
    
    const counts = new Array(days).fill(0)
    data?.forEach(activity => {
      const date = new Date(activity.created_at)
      const dayDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
      if (dayDiff < days) {
        counts[days - 1 - dayDiff]++
      }
    })
    
    return counts
  },

  async getCount(activityType: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const { count, error } = await supabase
      .from('user_activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('activity_type', activityType)
    
    if (error) handleError(error)
    return count || 0
  }
}
