/**
 * API Service - Deltagarportalen
 * All data hanteras via Supabase (PostgreSQL + Edge Functions)
 * 
 * Tidigare PHP-backend har ersatts helt med Supabase.
 */

import {
  authApi,
  cvApi,
  interestApi,
  coverLetterApi,
  articleApi,
  jobsApi,
  userApi,
  activityApi,
  savedJobsApi
} from './supabaseApi'

// Arbetsförmedlingen API:er via Edge Functions
export { afApi, POPULAR_QUERIES } from './arbetsformedlingenApi'
export { taxonomyApi } from './afTaxonomyApi'
export { jobEdApi } from './afJobEdApi'
export { enrichmentsApi } from './afEnrichmentsApi'
export { trendsApi } from './afTrendsApi'

// Supabase API:er
export { authApi, cvApi, interestApi, coverLetterApi, articleApi, jobsApi, userApi, activityApi, savedJobsApi }

// Re-export supabase client för direktåtkomst vid behov
export { supabase } from '../lib/supabase'

// OBS: Den gamla apiRequest-funktionen är BORTTAGEN
// Använd direkta Supabase-anrop istället:
// 
// GAMMALT:
//   await apiRequest('/cv', { method: 'GET' })
// 
// NYTT:
//   await cvApi.getCV()
// 
// Eller ännu bättre - använd React Query:
//   const { data } = useQuery({ queryKey: ['cv'], queryFn: cvApi.getCV })

/**
 * @deprecated Använd specifika API-funktioner istället
 * Denna funktion finns kvar för bakåtkompatibilitet under övergångsperioden
 * men kommer tas bort i nästa version.
 */
export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  console.warn('apiRequest är föråldrad. Använd specifika API-funktioner från supabaseApi.ts')
  
  const method = options.method || 'GET'
  const body = options.body ? JSON.parse(options.body as string) : undefined
  
  // Auth endpoints
  if (endpoint === '/auth/login') return authApi.login(body.email, body.password)
  if (endpoint === '/auth/register') return authApi.register(body)
  if (endpoint === '/auth/me') return authApi.getCurrentUser()
  
  // CV endpoints
  if (endpoint === '/cv' && method === 'GET') return cvApi.getCV()
  if (endpoint === '/cv' && method === 'PUT') return cvApi.updateCV(body)
  if (endpoint === '/cv/ats-analysis') return cvApi.getATSAnalysis()
  if (endpoint === '/cv/versions' && method === 'GET') return cvApi.getVersions()
  if (endpoint === '/cv/versions' && method === 'POST') return cvApi.saveVersion(body.name, body.data)
  
  // Interest guide endpoints
  if (endpoint === '/interest/questions') return interestApi.getQuestions()
  if (endpoint === '/interest/result' && method === 'GET') return interestApi.getResult()
  if (endpoint === '/interest/result' && method === 'POST') return interestApi.saveResult(body)
  if (endpoint === '/interest/recommendations') return interestApi.getRecommendations()
  
  // Cover letter endpoints
  if (endpoint === '/cover-letter' && method === 'GET') return coverLetterApi.getAll()
  if (endpoint === '/cover-letter' && method === 'POST') return coverLetterApi.create(body)
  if (endpoint === '/cover-letter/generate') return coverLetterApi.generate(body)
  
  // Articles endpoints
  if (endpoint === '/articles') return articleApi.getAll()
  if (endpoint.match(/^\/articles\/\w+$/)) return articleApi.getById(endpoint.split('/')[2])
  
  // Jobs endpoints
  if (endpoint === '/jobs') return jobsApi.search(body || {})
  if (endpoint.match(/^\/jobs\/\w+$/)) return jobsApi.getById(endpoint.split('/')[2])
  if (endpoint === '/saved-jobs' && method === 'GET') return savedJobsApi.getAll()
  if (endpoint === '/saved-jobs' && method === 'POST') return savedJobsApi.save(body.jobId, body.jobData)
  if (endpoint === '/saved-jobs' && method === 'DELETE') return savedJobsApi.delete(body.jobId)
  
  // User endpoints
  if (endpoint === '/users/me' && method === 'GET') return userApi.getProfile()
  if (endpoint === '/users/me' && method === 'PUT') return userApi.updateProfile(body)
  if (endpoint === '/users/profile') return userApi.updateProfile(body)
  
  throw new Error(`Okänd endpoint: ${endpoint}. Använd specifika API-funktioner från supabaseApi.ts`)
}

/**
 * @deprecated Använd specifika API-funktioner istället
 */
export const api = {
  get: (endpoint: string) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint: string, data?: any) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint: string, data?: any) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint: string) => apiRequest(endpoint, { method: 'DELETE' })
}
