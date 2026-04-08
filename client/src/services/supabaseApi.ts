/**
 * Supabase API Service - Deltagarportalen
 * All datahantering sker via Supabase (PostgreSQL + Auth + Edge Functions)
 */

import { supabase } from '../lib/supabase'
import { contentArticleApi, contentExerciseApi } from './contentApi'
import type { Tables } from '../lib/supabase'
import { apiLogger } from '../lib/logger'

// ============================================
// TYPES
// ============================================

// WorkExperience som används i UI-komponenter (camelCase)
export interface WorkExperience {
  id: string
  title: string
  company: string
  location?: string
  startDate: string
  endDate?: string
  current?: boolean
  description?: string
}

// Education som används i UI-komponenter (camelCase)
export interface Education {
  id: string
  degree: string
  school: string
  field?: string
  location?: string
  startDate: string
  endDate?: string
  description?: string
}

// Skill som används i UI-komponenter
export interface Skill {
  id: string
  name: string
  level: number // 1-5
  category: 'technical' | 'soft' | 'tool' | 'language' | 'certification' | 'other'
}

// Language som används i UI-komponenter
export interface Language {
  id: string
  language: string
  level: 'Grundläggande' | 'God' | 'Flytande' | 'Modersmål'
}

// Certificate som används i UI-komponenter
export interface Certificate {
  id: string
  name: string
  issuer?: string
  date?: string
  expiryDate?: string
}

// Link som används i UI-komponenter
export interface Link {
  id: string
  type: 'linkedin' | 'github' | 'portfolio' | 'website' | 'other'
  url: string
  label?: string
}

// Reference som används i UI-komponenter
export interface Reference {
  id: string
  name: string
  title?: string
  company?: string
  relation?: string
  email?: string
  phone?: string
}

// CVVersion för versionshantering
export interface CVVersion {
  id: string
  name: string
  data: CVData
  createdAt: string
}

// Huvud-CVData interface som används i hela applikationen
export interface CVData {
  id?: string
  user_id?: string
  // Personlig info (camelCase för UI)
  firstName?: string
  lastName?: string
  first_name?: string
  last_name?: string
  profileImage?: string | null
  profile_image?: string | null
  title?: string | null
  email?: string | null
  phone?: string | null
  location?: string | null
  summary?: string | null
  // Erfarenheter och utbildning
  workExperience?: WorkExperience[]
  work_experience?: WorkExperience[]
  education?: Education[]
  // Kompetenser och andra listor
  skills?: Skill[]
  languages?: Language[]
  certificates?: Certificate[]
  links?: Link[]
  references?: Reference[]
  // Utseende
  template?: string
  colorScheme?: string
  color_scheme?: string
  font?: string
  // ATS-analys
  ats_score?: number | null
  atsScore?: number | null
  ats_feedback?: unknown
  atsFeedback?: unknown
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
  job_data: Record<string, unknown>
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

function handleError(error: unknown): never {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'PGRST116'
  ) {
    throw new APIError('Resursen hittades inte', 'NOT_FOUND', 404)
  }
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === '42501'
  ) {
    throw new APIError('Åtkomst nekad', 'FORBIDDEN', 403)
  }
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === '23505'
  ) {
    throw new APIError('Resursen finns redan', 'CONFLICT', 409)
  }

  const message =
    error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : 'Ett fel uppstod'
  const code =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined
  const status =
    error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
      ? error.status
      : undefined

  throw new APIError(message, code, status)
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

    // Transform snake_case to camelCase - VIKTIGT: exkludera snake_case fält för att undvika konflikter vid sparning
    const { work_experience, color_scheme, first_name, last_name, profile_image, ...rest } = data
    return {
      ...rest,
      workExperience: work_experience || [],
      colorScheme: color_scheme,
      firstName: first_name,
      lastName: last_name,
      profileImage: profile_image,
    }
  },

  async updateCV(cvData: Partial<CVData>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    // Transform camelCase to snake_case - prioritera camelCase (UI-fält) över snake_case (DB-fält)
    const dbData: Record<string, unknown> = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
      first_name: cvData.firstName ?? cvData.first_name,
      last_name: cvData.lastName ?? cvData.last_name,
      title: cvData.title,
      email: cvData.email,
      phone: cvData.phone,
      location: cvData.location,
      summary: cvData.summary,
      profile_image: cvData.profileImage ?? cvData.profile_image,
      work_experience: cvData.workExperience ?? cvData.work_experience,
      education: cvData.education,
      skills: cvData.skills,
      languages: cvData.languages,
      certificates: cvData.certificates,
      links: cvData.links,
      "references": cvData.references,
      template: cvData.template,
      color_scheme: cvData.colorScheme ?? cvData.color_scheme,
      font: cvData.font,
    }

    // Remove undefined values
    Object.keys(dbData).forEach(key => {
      if (dbData[key] === undefined) delete dbData[key]
    })
    
    try {
      // Försök uppdatera först (om raden finns)
      const { data: existing } = await supabase
        .from('cvs')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      
      let result
      if (existing) {
        // Uppdatera befintlig rad
        const { data, error } = await supabase
          .from('cvs')
          .update(dbData)
          .eq('user_id', user.id)
          .select()
          .single()
        if (error) throw error
        result = data
      } else {
        // Skapa ny rad
        const { data, error } = await supabase
          .from('cvs')
          .insert(dbData)
          .select()
          .single()
        if (error) throw error
        result = data
      }
      
      return result
    } catch (error: unknown) {
      handleError(error)
      throw error
    }
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

  async deleteVersion(versionId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)
    
    const { error } = await supabase
      .from('cv_versions')
      .delete()
      .eq('id', versionId)
      .eq('user_id', user.id)
    
    if (error) handleError(error)
    return true
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

  async saveResult(resultData: Record<string, unknown>) {
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
    cvData: CVData
    jobDescription: string
    companyName: string
    jobTitle: string
    tone?: 'formal' | 'friendly' | 'enthusiastic'
    focus?: 'experience' | 'skills' | 'motivation'
  }) {
    // Försök hämta session, om den saknas försök refresha
    let { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      // Försök refresha sessionen
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError || !refreshData.session) {
        throw new APIError('Du har blivit utloggad. Vänligen logga in igen.', 'UNAUTHORIZED', 401)
      }
      session = refreshData.session
    }
    
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
// Uses contentApi.ts for database access with mock data fallback
// ============================================
export const articleApi = {
  /**
   * Get all active articles
   */
  async getAll() {
    return contentArticleApi.getAll()
  },

  /**
   * Get article by slug or ID
   */
  async getById(id: string) {
    return contentArticleApi.getById(id)
  },

  /**
   * Get articles by category
   */
  async getByCategory(category: string) {
    return contentArticleApi.getByCategory(category)
  },

  /**
   * Get all article categories
   */
  async getCategories() {
    const categories = await contentArticleApi.getCategories()
    return categories.map(cat => ({
      id: cat.key,
      name: cat.name,
      slug: cat.key,
      description: cat.description,
      subcategories: cat.subcategories?.map(sub => sub.name) || []
    }))
  },

  /**
   * Search articles
   */
  async search(query: string) {
    return contentArticleApi.search(query)
  }
}

// ============================================
// EXERCISES API
// Uses contentApi.ts for database access with mock data fallback
// ============================================
export const exerciseApi = {
  /**
   * Get all active exercises
   */
  async getAll() {
    return contentExerciseApi.getAll()
  },

  /**
   * Get exercise by slug or ID
   */
  async getById(id: string) {
    return contentExerciseApi.getById(id)
  },

  /**
   * Get exercises by category
   */
  async getByCategory(category: string) {
    return contentExerciseApi.getByCategory(category)
  },

  /**
   * Get all exercise categories
   */
  async getCategories() {
    return contentExerciseApi.getCategories()
  },

  /**
   * Get exercise steps with questions
   */
  async getSteps(exerciseSlug: string) {
    return contentExerciseApi.getSteps(exerciseSlug)
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
// USER API
// ============================================

// Onboarding progress interface
export interface OnboardingProgress {
  profile?: boolean
  interest?: boolean
  cv?: boolean
  career?: boolean
  jobSearch?: boolean
  coverLetter?: boolean
}

// Profile preferences interface
export interface ProfilePreferences {
  desired_jobs?: string[]
  interests?: string[]
  onboarding_progress?: OnboardingProgress
  // Tillgänglighet & Jobbsökningsstatus
  availability?: {
    status?: 'unemployed' | 'employed' | 'student' | 'parental_leave' | 'sick_leave' | 'other'
    availableFrom?: string // ISO date eller 'immediately'
    noticePeriod?: string // '1_month', '2_months', '3_months', 'none'
    employmentTypes?: ('fulltime' | 'parttime' | 'freelance' | 'temporary' | 'internship')[]
    remoteWork?: 'yes' | 'no' | 'hybrid'
  }
  // Mobilitet & Körkort
  mobility?: {
    driversLicense?: string[] // ['B', 'A', 'C', etc.]
    hasCar?: boolean
    maxCommuteMinutes?: number
    willingToTravel?: boolean
    willingToRelocate?: boolean
    relocateRegions?: string[] // Regioner man kan tänka sig flytta till
  }
  // Lön & Förmåner
  salary?: {
    expectationMin?: number
    expectationMax?: number
    currency?: 'SEK' | 'EUR' | 'USD'
    period?: 'monthly' | 'yearly' | 'hourly'
    importantBenefits?: string[] // ['friskvård', 'pension', 'flexibla_tider', etc.]
  }
  // Arbetsmarknadsstatus (Sverige-specifikt)
  labor_market_status?: {
    registeredAtAF?: boolean
    participatingInProgram?: boolean
    programName?: string // 'jobbgarantin', 'etablering', 'stöd_och_matchning', etc.
    hasActivitySupport?: boolean
  }
  // Arbetspreferenser
  work_preferences?: {
    sectors?: ('private' | 'public' | 'nonprofit')[]
    companySizes?: ('startup' | 'small' | 'medium' | 'large' | 'enterprise')[]
    industries?: string[]
    importantValues?: string[] // ['hållbarhet', 'innovation', 'work_life_balance', etc.]
  }
  // Fysiska förutsättningar (frivilligt)
  physical_requirements?: {
    hasAdaptationNeeds?: boolean
    adaptationDescription?: string
    ergonomicNeeds?: string[]
  }
}

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

  // Get profile preferences (desired jobs, interests, onboarding, and extended profile data)
  async getPreferences(): Promise<ProfilePreferences> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('profiles')
      .select('desired_jobs, interests, onboarding_progress, availability, mobility, salary, labor_market_status, work_preferences, physical_requirements')
      .eq('id', user.id)
      .single()

    if (error) {
      // Return empty if columns don't exist yet
      if (error.code === '42703') {
        return { desired_jobs: [], interests: [], onboarding_progress: {} }
      }
      handleError(error)
    }

    return {
      desired_jobs: data?.desired_jobs || [],
      interests: data?.interests || [],
      onboarding_progress: data?.onboarding_progress || {},
      availability: data?.availability || {},
      mobility: data?.mobility || {},
      salary: data?.salary || {},
      labor_market_status: data?.labor_market_status || {},
      work_preferences: data?.work_preferences || {},
      physical_requirements: data?.physical_requirements || {}
    }
  },

  // Update profile preferences
  async updatePreferences(prefs: ProfilePreferences) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const updates: Record<string, unknown> = {}
    if (prefs.desired_jobs !== undefined) updates.desired_jobs = prefs.desired_jobs
    if (prefs.interests !== undefined) updates.interests = prefs.interests
    if (prefs.onboarding_progress !== undefined) updates.onboarding_progress = prefs.onboarding_progress
    if (prefs.availability !== undefined) updates.availability = prefs.availability
    if (prefs.mobility !== undefined) updates.mobility = prefs.mobility
    if (prefs.salary !== undefined) updates.salary = prefs.salary
    if (prefs.labor_market_status !== undefined) updates.labor_market_status = prefs.labor_market_status
    if (prefs.work_preferences !== undefined) updates.work_preferences = prefs.work_preferences
    if (prefs.physical_requirements !== undefined) updates.physical_requirements = prefs.physical_requirements

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('desired_jobs, interests, onboarding_progress, availability, mobility, salary, labor_market_status, work_preferences, physical_requirements')
      .single()

    if (error) handleError(error)
    return data
  },

  // Update single onboarding step
  async updateOnboardingStep(step: keyof OnboardingProgress, completed: boolean) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    // First get current progress
    const { data: current } = await supabase
      .from('profiles')
      .select('onboarding_progress')
      .eq('id', user.id)
      .single()

    const currentProgress = (current?.onboarding_progress || {}) as OnboardingProgress
    const newProgress = { ...currentProgress, [step]: completed }

    const { data, error } = await supabase
      .from('profiles')
      .update({ onboarding_progress: newProgress })
      .eq('id', user.id)
      .select('onboarding_progress')
      .single()

    if (error) handleError(error)
    return data?.onboarding_progress as OnboardingProgress
  },

  // Get onboarding progress
  async getOnboardingProgress(): Promise<OnboardingProgress> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_progress')
      .eq('id', user.id)
      .single()

    if (error) {
      if (error.code === '42703') return {}
      handleError(error)
    }

    return (data?.onboarding_progress || {}) as OnboardingProgress
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

// ============================================
// ACTIVITY API
// ============================================
export const activityApi = {
  async logActivity(activityType: string, activityData?: Record<string, unknown>) {
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

// ============================================
// SPONTANEOUS COMPANIES API
// ============================================

export type SpontaneousStatus =
  | 'saved'
  | 'to_contact'
  | 'contacted'
  | 'waiting'
  | 'response_positive'
  | 'response_negative'
  | 'no_response'
  | 'archived'

export type SpontaneousPriority = 'high' | 'medium' | 'low'
export type OutreachMethod = 'email' | 'linkedin' | 'phone' | 'visit' | 'other'

export interface SpontaneousCompany {
  id: string
  user_id: string
  org_number: string
  company_name: string
  company_data: {
    legalForm?: string
    address?: {
      street?: string
      postalCode?: string
      city?: string
    }
    sniCodes?: Array<{ code: string; description?: string }>
    businessDescription?: string
    registrationDate?: string
  }
  status: SpontaneousStatus
  priority: SpontaneousPriority
  notes?: string
  why_interested?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  contact_linkedin?: string
  outreach_method?: OutreachMethod
  outreach_date?: string
  followup_date?: string
  response_date?: string
  response_notes?: string
  created_at: string
  updated_at: string
}

export interface CreateSpontaneousCompany {
  org_number: string
  company_name: string
  company_data?: SpontaneousCompany['company_data']
  status?: SpontaneousStatus
  priority?: SpontaneousPriority
  notes?: string
  why_interested?: string
}

export interface UpdateSpontaneousCompany {
  status?: SpontaneousStatus
  priority?: SpontaneousPriority
  notes?: string
  why_interested?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  contact_linkedin?: string
  outreach_method?: OutreachMethod
  outreach_date?: string
  followup_date?: string
  response_date?: string
  response_notes?: string
}

export const spontaneousCompaniesApi = {
  /**
   * Get all spontaneous companies for the current user
   */
  async getAll(): Promise<SpontaneousCompany[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('spontaneous_companies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) handleError(error)
    return (data || []) as SpontaneousCompany[]
  },

  /**
   * Get companies by status
   */
  async getByStatus(status: SpontaneousStatus): Promise<SpontaneousCompany[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('spontaneous_companies')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) handleError(error)
    return (data || []) as SpontaneousCompany[]
  },

  /**
   * Get a single company by ID
   */
  async getById(id: string): Promise<SpontaneousCompany | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('spontaneous_companies')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') handleError(error)
    return data as SpontaneousCompany | null
  },

  /**
   * Check if a company is already saved
   */
  async exists(orgNumber: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const normalized = orgNumber.replace(/[-\s]/g, '')
    const { count, error } = await supabase
      .from('spontaneous_companies')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('org_number', normalized)

    if (error) handleError(error)
    return (count || 0) > 0
  },

  /**
   * Add a new company
   */
  async create(company: CreateSpontaneousCompany): Promise<SpontaneousCompany> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const normalized = company.org_number.replace(/[-\s]/g, '')

    const { data, error } = await supabase
      .from('spontaneous_companies')
      .insert({
        user_id: user.id,
        org_number: normalized,
        company_name: company.company_name,
        company_data: company.company_data || {},
        status: company.status || 'saved',
        priority: company.priority || 'medium',
        notes: company.notes,
        why_interested: company.why_interested,
      })
      .select()
      .single()

    if (error) handleError(error)
    return data as SpontaneousCompany
  },

  /**
   * Update a company
   */
  async update(id: string, updates: UpdateSpontaneousCompany): Promise<SpontaneousCompany> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('spontaneous_companies')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) handleError(error)
    return data as SpontaneousCompany
  },

  /**
   * Update status only
   */
  async updateStatus(id: string, status: SpontaneousStatus): Promise<SpontaneousCompany> {
    return this.update(id, { status })
  },

  /**
   * Delete a company
   */
  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { error } = await supabase
      .from('spontaneous_companies')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) handleError(error)
  },

  /**
   * Get statistics
   */
  async getStats(): Promise<Record<SpontaneousStatus, number>> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('spontaneous_companies')
      .select('status')
      .eq('user_id', user.id)

    if (error) handleError(error)

    const stats: Record<SpontaneousStatus, number> = {
      saved: 0,
      to_contact: 0,
      contacted: 0,
      waiting: 0,
      response_positive: 0,
      response_negative: 0,
      no_response: 0,
      archived: 0,
    }

    data?.forEach((item: { status: SpontaneousStatus }) => {
      if (item.status in stats) {
        stats[item.status]++
      }
    })

    return stats
  },

  /**
   * Get companies with upcoming followups
   */
  async getUpcomingFollowups(days: number = 7): Promise<SpontaneousCompany[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    const { data, error } = await supabase
      .from('spontaneous_companies')
      .select('*')
      .eq('user_id', user.id)
      .not('followup_date', 'is', null)
      .lte('followup_date', futureDate.toISOString().split('T')[0])
      .not('status', 'in', '("archived","response_positive","response_negative")')
      .order('followup_date', { ascending: true })

    if (error) handleError(error)
    return (data || []) as SpontaneousCompany[]
  },
}
