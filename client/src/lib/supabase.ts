import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓ set' : '✗ missing')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ set' : '✗ missing')
  console.error('Please check GITHUB_SECRETS_FIX.md for instructions')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: localStorage,
    storageKey: 'supabase.auth.token',
    // Disable Navigator LockManager to prevent timeout issues
    // This can cause issues with multiple tabs but prevents white screen crashes
    lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
      // No-op lock - just execute the function directly without locking
      return await fn()
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    // Note: Don't set Content-Type globally - it breaks storage uploads
    headers: {
      'Accept': 'application/json'
    }
  }
})

// JSON type for database columns storing JSON data
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

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
    program: string | null
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
    ats_feedback: JsonValue | null
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
    physical_requirements: JsonValue | null
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
    job_data: JsonValue | null
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

// getCurrentUser raderad 2026-09-22 — enda anroparen var useAuth, som nu
// läser authStore. services/cloud har en egen i _shared.ts.

// Profile helpers
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

// CV helpers
// getCV har NOLL anropare sedan länge men står kvar ENBART för att
// `src/test/single-krav-en-rad.test.ts` har en ALLOWLIST-post
// ('client/src/lib/supabase.ts::cvs') som fäller grinden om kedjan försvinner.
// Radera funktionen och posten i samma ändring (utanför uppdrag 2026-09-22:s
// ägarskap, därför kvar).
export async function getCV(userId: string) {
  const { data, error } = await supabase
    .from('cvs')
    .select('*')
    .eq('user_id', userId)
    .single()
  return { data, error }
}

// updateProfile, upsertCV, getCoverLetters, createCoverLetter,
// signUp/signIn/signOut, getCurrentSession och de två realtime-
// prenumerationerna (subscribeToCVUpdates, subscribeToConsultantNotes)
// RADERADE 2026-09-22 — noll anropare. Inloggning går via authStore,
// CV via services/cvApi, breven via callAI('personligt-brev'). De två
// prenumerationerna hade dessutom FASTA kanalnamn ('cv-updates',
// 'consultant-notes') — supabase-js återanvänder en kanal med samma namn,
// så två anropare hade delat kanal och den första `removeChannel` hade
// tystat båda.

// Storage helpers RADERADE 2026-07-27 (H5): uploadProfileImage och
// uploadCVFile hade noll anropare och pekade dessutom på buckets som inte
// finns — `profile_images` och `cv_files` med UNDERSTRECK, medan den enda
// bildbucketen heter `profile-images` med BINDESTRECK. Den levande vägen är
// `unifiedProfileApi.uploadProfileImage` (vars bucketnamn också var fel och
// rättades samtidigt). Finns i git-historiken.
