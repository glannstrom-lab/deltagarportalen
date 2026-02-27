/**
 * Supabase API Service
 * Ersätter den gamla backenden för skarp drift
 * All data sparas i Supabase (PostgreSQL)
 */

import { supabase } from '../lib/supabase'

// ============================================
// AUTH API
// ============================================
export const authApi = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw new Error(error.message)
    
    // Hämta profilen
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()
    
    return {
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
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
  }) {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: 'USER'
        }
      }
    })
    
    if (error) throw new Error(error.message)
    
    if (!data.session) {
      throw new Error('Konto skapat men kräver e-postbekräftelse. Kontakta administratör.')
    }
    
    return {
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'USER'
      }
    }
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    return {
      id: user.id,
      email: user.email,
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      role: profile?.role || 'USER'
    }
  }
}

// ============================================
// CV API
// ============================================
export const cvApi = {
  async getCV() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (error) throw error
    
    // Konvertera snake_case till camelCase för frontend
    if (data) {
      return {
        ...data,
        colorScheme: data.color_scheme,
        font: data.font,
        firstName: data.first_name,
        lastName: data.last_name,
        workExperience: data.work_experience,
      }
    }
    return data
  },

  async updateCV(cvData: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    // Konvertera camelCase till snake_case för databasen
    const dbData: any = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
      title: cvData.title,
      email: cvData.email,
      phone: cvData.phone,
      location: cvData.location,
      summary: cvData.summary,
      work_experience: cvData.workExperience,
      education: cvData.education,
      skills: cvData.skills,
      languages: cvData.languages,
      certificates: cvData.certificates,
      links: cvData.links,
      "references": cvData.references,
      template: cvData.template,
      color_scheme: cvData.colorScheme,
      font: cvData.font,
    }
    
    const { data, error } = await supabase
      .from('cvs')
      .upsert(dbData)
      .select()
      .single()
    
    if (error) throw error
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
    if (!user) throw new Error('Inte inloggad')
    
    const { data, error } = await supabase
      .from('cv_versions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async saveVersion(name: string, cvData: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    const { data, error } = await supabase
      .from('cv_versions')
      .insert({
        user_id: user.id,
        name,
        data: cvData
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async restoreVersion(versionId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    const { data, error } = await supabase
      .from('cv_versions')
      .select('data')
      .eq('id', versionId)
      .eq('user_id', user.id)
      .single()
    
    if (error) throw error
    return data?.data
  },

  async shareCV() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    // Generera en unik delningskod
    const shareCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // Giltig i 30 dagar
    
    const { data, error } = await supabase
      .from('cv_shares')
      .insert({
        user_id: user.id,
        share_code: shareCode,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Bygg delnings-URL
    const shareUrl = `${window.location.origin}/cv/shared/${shareCode}`
    
    // Generera QR-kod URL (vi kan använda en extern tjänst)
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
    
    if (error) throw error
    return data
  }
}

// ============================================
// INTEREST GUIDE API
// ============================================
export const interestApi = {
  async getQuestions() {
    // Frågor är statiska i appen, men kan hämtas från DB om vi vill
    return { questions: [] }
  },

  async getResult() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    const { data, error } = await supabase
      .from('interest_results')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async saveResult(resultData: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    const { data, error } = await supabase
      .from('interest_results')
      .upsert({
        ...resultData,
        user_id: user.id
      })
      .select()
      .single()
    
    if (error) throw error
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
  async getAll() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    const { data, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(letterData: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    const { data, error } = await supabase
      .from('cover_letters')
      .insert({
        ...letterData,
        user_id: user.id
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async generate(params: {
    cvData: any
    jobDescription: string
    companyName: string
    jobTitle: string
    tone?: 'formal' | 'friendly' | 'enthusiastic'
  }) {
    // Anropa Edge Function för AI-generering
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Inte inloggad')
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-cover-letter`,
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
      throw new Error(err.error || 'Kunde inte generera brev')
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
    
    if (error) throw error
    return data || []
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }
}

// ============================================
// JOBS API (kopplat till Arbetsförmedlingen)
// ============================================
export const jobsApi = {
  async search(params: {
    search?: string
    location?: string
    employmentType?: string
    remote?: boolean
  }) {
    // Bygg query till Arbetsförmedlingen
    const queryParams = new URLSearchParams()
    if (params.search) queryParams.set('q', params.search)
    if (params.location) queryParams.set('municipality', params.location)
    if (params.employmentType) queryParams.set('employment-type', params.employmentType)
    if (params.remote) queryParams.set('remote', 'true')
    
    const response = await fetch(
      `https://jobsearch.api.jobtechdev.se/search?${queryParams}&limit=20`
    )
    
    if (!response.ok) throw new Error('Kunde inte söka jobb')
    
    const data = await response.json()
    return data.hits || []
  },

  // Alias för kompatibilitet
  async searchJobs(params?: any) {
    return this.search(params || {})
  },

  async getById(id: string) {
    const response = await fetch(
      `https://jobsearch.api.jobtechdev.se/ad/${id}`
    )
    
    if (!response.ok) throw new Error('Kunde inte hämta jobb')
    
    return response.json()
  },

  async saveJob(jobId: string, status: string = 'SAVED', jobData?: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    // Hämta jobbdata om den inte skickades med
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
    
    if (error) throw error
    return data
  },

  async getSavedJobs() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Alias för kompatibilitet med JobSearch.tsx
  async getApplications() {
    return this.getSavedJobs()
  },

  async updateApplication(id: string, updates: { status?: string, notes?: string }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
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
    
    if (error) throw error
    return data
  },

  async deleteApplication(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (error) throw error
    return true
  },

  async matchCV(jobId: string, cvData: any) {
    // Hämta jobbdata
    const job = await this.getById(jobId)
    
    // Enkel matchningsalgoritm baserad på nyckelord
    const jobText = `${job.headline || ''} ${job.description?.text || ''} ${job.occupation?.label || ''}`.toLowerCase()
    const skills = cvData.skills || []
    const experiences = cvData.workExperience || []
    
    let matchScore = 0
    let maxScore = 0
    const matchingSkills: string[] = []
    const missingSkills: string[] = []
    
    // Kontrollera kompetenser
    skills.forEach((skill: any) => {
      maxScore += skill.level || 3
      if (jobText.includes((skill.name || '').toLowerCase())) {
        matchScore += skill.level || 3
        matchingSkills.push(skill.name)
      } else {
        missingSkills.push(skill.name)
      }
    })
    
    // Kontrollera erfarenheter
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
    if (!user) throw new Error('Inte inloggad')
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) throw error
    return data
  },

  async updateProfile(updates: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// ============================================
// SAVED JOBS API
// ============================================
export const savedJobsApi = {
  async getAll() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async save(jobId: string, jobData: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    const { data, error } = await supabase
      .from('saved_jobs')
      .upsert({
        user_id: user.id,
        job_id: jobId,
        job_data: jobData,
        status: 'SAVED'
      }, {
        onConflict: 'user_id,job_id'
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateStatus(jobId: string, status: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    const { data, error } = await supabase
      .from('saved_jobs')
      .update({ 
        status,
        applied_at: status === 'APPLIED' ? new Date().toISOString() : null
      })
      .eq('user_id', user.id)
      .eq('job_id', jobId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(jobId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('user_id', user.id)
      .eq('job_id', jobId)
    
    if (error) throw error
  }
}

// ============================================
// ACTIVITY API
// ============================================
export const activityApi = {
  // Logga en aktivitet
  async logActivity(activityType: string, activityData?: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    const { data, error } = await supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        activity_type: activityType,
        activity_data: activityData || {}
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Hämta aktiviteter för en viss typ
  async getActivities(activityType?: string, limit: number = 30) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
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
    
    if (error) throw error
    return data || []
  },

  // Hämta aktiviteter från senaste X dagarna för diagram
  async getActivityCounts(days: number = 10) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await supabase
      .from('user_activities')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    // Gruppera per dag och räkna
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

  // Hämta antal för en specifik aktivitetstyp
  async getCount(activityType: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    
    const { count, error } = await supabase
      .from('user_activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('activity_type', activityType)
    
    if (error) throw error
    return count || 0
  }
}
