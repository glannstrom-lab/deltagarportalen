/**
 * Supabase API Service - Deltagarportalen
 * All datahantering sker via Supabase (PostgreSQL + Auth + Edge Functions)
 */

import { supabase } from '../lib/supabase'
import { contentArticleApi, contentExerciseApi } from './contentApi'
import type { Tables } from '../lib/supabase'
import { apiLogger } from '../lib/logger'
import { APIError, handleError } from './apiError'

// Re-export shared error helpers så callers fortsätter importera från
// '@/services/supabaseApi'. Splittringen 2026-05-09 (P2-skuld) ska vara
// transparent för konsumenter.
export { APIError, handleError } from './apiError'

// Re-export domän-API:er flyttade till egna filer 2026-05-09 (P2):
// supabaseApi.ts var en 1 835-radsmodul som blev en 1.5 MB chunk även
// för callers som bara behövde en delmängd. Domän-filerna kan tree-shake:as
// individuellt när callers byter till direkt-import (gradvis migration).
export { cvApi } from './cvApi'
export { userApi } from './userApi'
export { jobsApi, savedJobsApi, jobAlertsApi } from './jobsApi'
export type { JobAlert } from './jobsApi'
export { interestApi } from './interestApi'
export { coverLetterApi } from './coverLetterApi'
export { activityApi } from './activityApi'

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
  template?: string | null
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

// APIError + handleError importeras från './apiError' (import överst).

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
  // Arbetskonsulent data
  consultant_data?: {
    cvStatus?: 'complete' | 'needs_update' | 'missing'
    activityLevel?: {
      applicationsSent?: number
      interviews?: number
      employerContacts?: number
      lastActivityDate?: string
    }
    references?: 'available' | 'missing' | 'needs_contact'
    internship?: {
      active?: boolean
      company?: string
      supervisor?: string
      startDate?: string
      endDate?: string
      evaluation?: string
    }
    workBarriers?: string[]
    barrierDetails?: string
    nextSteps?: Array<{
      activity: string
      date: string
      completed: boolean
    }>
    geographicScope?: string[]
    targetIndustries?: string[]
  }
  // Arbetsterapeut data
  therapist_data?: {
    workCapacityAssessment?: {
      date?: string
      result?: string
      recommendations?: string
    }
    functionalLevel?: {
      physical?: 'full' | 'limited' | 'significantly_limited'
      cognitive?: 'full' | 'limited' | 'significantly_limited'
      social?: 'full' | 'limited' | 'significantly_limited'
      details?: string
    }
    adaptationNeeds?: string[]
    adaptationDetails?: string
    energyLevel?: {
      sustainableHoursPerDay?: number
      sustainableDaysPerWeek?: number
      bestTimeOfDay?: 'morning' | 'afternoon' | 'varies'
      notes?: string
    }
    rehabilitationPhase?: 'early' | 'ongoing' | 'late' | 'completed'
    assistiveTools?: {
      granted?: string[]
      applied?: string[]
      recommended?: string[]
    }
    followUpDate?: string
    followUpNotes?: string
  }
  // Mål och uppföljning
  support_goals?: {
    shortTerm?: {
      goal?: string
      deadline?: string
      progress?: number
    }
    longTerm?: {
      goal?: string
      deadline?: string
      progress?: number
    }
    notes?: string
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
