/**
 * API Service för skarp drift
 * Använder Supabase som backend (glannstrom.se/deltagarportalen)
 * + Arbetsförmedlingen API:er
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

// Arbetsförmedlingen API:er
export { afApi, POPULAR_QUERIES } from './arbetsformedlingenApi'
export { taxonomyApi } from './afTaxonomyApi'
export { jobEdApi } from './afJobEdApi'
export { enrichmentsApi } from './afEnrichmentsApi'
export { trendsApi } from './afTrendsApi'

// Exportera Supabase API:er
export { authApi, cvApi, interestApi, coverLetterApi, articleApi, jobsApi, userApi, activityApi, savedJobsApi }

// Bakåtkompatibel apiRequest-funktion
export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const method = options.method || 'GET'
  const body = options.body ? JSON.parse(options.body as string) : undefined
  
  if (endpoint === '/auth/login') return authApi.login(body.email, body.password)
  if (endpoint === '/auth/register') return authApi.register(body)
  
  if (endpoint === '/cv' && method === 'GET') return cvApi.getCV()
  if (endpoint === '/cv' && method === 'PUT') return cvApi.updateCV(body)
  if (endpoint === '/cv/ats-analysis') return cvApi.getATSAnalysis()
  if (endpoint === '/cv/versions' && method === 'GET') return cvApi.getVersions()
  if (endpoint === '/cv/versions' && method === 'POST') return cvApi.saveVersion(body.name, body.data)
  
  if (endpoint === '/interest/questions') return interestApi.getQuestions()
  if (endpoint === '/interest/result' && method === 'GET') return interestApi.getResult()
  if (endpoint === '/interest/result' && method === 'POST') return interestApi.saveResult(body)
  if (endpoint === '/interest/recommendations') return interestApi.getRecommendations()
  
  if (endpoint === '/cover-letter' && method === 'GET') return coverLetterApi.getAll()
  if (endpoint === '/cover-letter' && method === 'POST') return coverLetterApi.create(body)
  if (endpoint === '/cover-letter/generate') return coverLetterApi.generate(body)
  
  if (endpoint === '/articles') return articleApi.getAll()
  if (endpoint.match(/^\/articles\/\w+$/)) return articleApi.getById(endpoint.split('/')[2])
  
  if (endpoint === '/jobs') return jobsApi.search(body || {})
  if (endpoint.match(/^\/jobs\/\w+$/)) return jobsApi.getById(endpoint.split('/')[2])
  if (endpoint === '/saved-jobs' && method === 'GET') return jobsApi.getSavedJobs()
  if (endpoint === '/saved-jobs' && method === 'POST') return jobsApi.saveJob(body)
  
  if (endpoint === '/users/me' && method === 'GET') return userApi.getProfile()
  if (endpoint === '/users/me' && method === 'PUT') return userApi.updateProfile(body)
  
  throw new Error(`Okänd endpoint: ${endpoint}`)
}

// Bakåtkompatibel api-objekt för gamla importer (t.ex. aiService.ts)
export const api = {
  get: (endpoint: string) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint: string, data?: any) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint: string, data?: any) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint: string) => apiRequest(endpoint, { method: 'DELETE' })
}
