import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
})

// Type definitions for database tables
export type Tables = {
  profiles: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    role: 'USER' | 'CONSULTANT' | 'ADMIN'
    phone: string | null
    avatar_url: string | null
    consultant_id: string | null
    created_at: string
    updated_at: string
  }
  cvs: {
    id: string
    user_id: string
    profile_image: string | null
    title: string | null
    email: string | null
    phone: string | null
    location: string | null
    summary: string | null
    work_experience: Array<{
      title: string
      company: string
      description?: string
      startDate?: string
      endDate?: string
    }>
    education: Array<{
      degree: string
      school: string
      startDate?: string
      endDate?: string
    }>
    skills: string[]
    languages: string[]
    certificates: Array<{
      name: string
      issuer?: string
      date?: string
    }>
    links: Array<{
      type: string
      url: string
    }>
    references: Array<{
      name: string
      relation: string
      contact?: string
    }>
    ats_score: number | null
    ats_feedback: any
    created_at: string
    updated_at: string
  }
  interest_results: {
    id: string
    user_id: string
    realistic: number
    investigative: number
    artistic: number
    social: number
    enterprising: number
    conventional: number
    holland_code: string | null
    openness: number
    conscientiousness: number
    extraversion: number
    agreeableness: number
    neuroticism: number
    physical_requirements: any
    recommended_jobs: string[]
    completed_at: string
  }
  cover_letters: {
    id: string
    user_id: string
    title: string
    job_ad: string | null
    content: string
    company: string | null
    job_title: string | null
    ai_generated: boolean
    created_at: string
    updated_at: string
  }
  articles: {
    id: string
    title: string
    content: string
    summary: string | null
    category: string
    tags: string[]
    published: boolean
    author_id: string | null
    created_at: string
    updated_at: string
  }
  consultant_notes: {
    id: string
    consultant_id: string
    participant_id: string
    content: string
    category: 'GENERAL' | 'PROGRESS' | 'CONCERN' | 'GOAL'
    created_at: string
    updated_at: string
  }
  saved_jobs: {
    id: string
    user_id: string
    job_id: string
    job_data: any
    status: 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'REJECTED' | 'ACCEPTED'
    notes: string | null
    applied_at: string | null
    created_at: string
  }
}

// Helper types
export type Profile = Tables['profiles']
export type CV = Tables['cvs']
export type InterestResult = Tables['interest_results']
export type CoverLetter = Tables['cover_letters']
export type Article = Tables['articles']
export type ConsultantNote = Tables['consultant_notes']
export type SavedJob = Tables['saved_jobs']

// Auth helpers
export async function signUp(email: string, password: string, userData: {
  first_name: string
  last_name: string
  role?: 'USER' | 'CONSULTANT' | 'ADMIN'
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role || 'USER'
      }
    }
  })
  return { data, error }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Profile helpers
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function updateProfile(userId: string, updates: Partial<Tables['profiles']>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
  return { data, error }
}

// CV helpers
export async function getCV(userId: string) {
  const { data, error } = await supabase
    .from('cvs')
    .select('*')
    .eq('user_id', userId)
    .single()
  return { data, error }
}

export async function upsertCV(cvData: Partial<Tables['cvs']>) {
  const { data, error } = await supabase
    .from('cvs')
    .upsert(cvData)
    .select()
  return { data, error }
}

// Cover letter helpers
export async function getCoverLetters(userId: string) {
  const { data, error } = await supabase
    .from('cover_letters')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function createCoverLetter(letter: Partial<Tables['cover_letters']>) {
  const { data, error } = await supabase
    .from('cover_letters')
    .insert(letter)
    .select()
  return { data, error }
}

// Edge Functions helpers
export async function generateCoverLetterWithAI(requestData: {
  cvData: any
  jobDescription: string
  companyName: string
  jobTitle: string
  tone?: 'formal' | 'friendly' | 'enthusiastic'
  focus?: 'experience' | 'skills' | 'motivation'
}) {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/ai-cover-letter`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to generate cover letter')
  }

  return response.json()
}

export async function analyzeCVWithAI(requestData: {
  cvData: any
  jobDescription: string
  jobRequirements?: string[]
}) {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/cv-analysis`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to analyze CV')
  }

  return response.json()
}

// Realtime subscriptions
export function subscribeToCVUpdates(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel('cv-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cvs',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
}

export function subscribeToConsultantNotes(participantId: string, callback: (payload: any) => void) {
  return supabase
    .channel('consultant-notes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'consultant_notes',
        filter: `participant_id=eq.${participantId}`
      },
      callback
    )
    .subscribe()
}

// Storage helpers
export async function uploadProfileImage(userId: string, file: File) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('profile_images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    })
  
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from('profile_images')
    .getPublicUrl(fileName)
  
  return publicUrl
}

export async function uploadCVFile(userId: string, file: File) {
  const fileName = `${userId}/cv-${Date.now()}.pdf`
  
  const { data, error } = await supabase.storage
    .from('cv_files')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    })
  
  if (error) throw error
  return data.path
}
