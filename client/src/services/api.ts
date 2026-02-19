import {
  mockAuthApi,
  mockCvApi,
  mockInterestApi,
  mockCoverLetterApi,
  mockArticleApi,
  mockUserApi,
  mockJobsApi,
} from './mockApi'

// Använd mock API för demo-läge (fungerar utan backend)
const USE_MOCK = true

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

async function realApiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('auth-storage')
    ? JSON.parse(localStorage.getItem('auth-storage')!).state.token
    : null

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Ett fel inträffade' }))
    throw new Error(error.error || 'Ett fel inträffade')
  }

  return response.json()
}

// Hybrid API - använder mock eller riktigt API
export const apiRequest = USE_MOCK
  ? (...args: [string, RequestInit?]) => {
      // Mock API hanterar alla endpoints internt
      return (async (endpoint: string, options: RequestInit = {}) => {
        // Konvertera till mock API format
        const method = options.method || 'GET'
        const body = options.body ? JSON.parse(options.body as string) : undefined
        
        // Auth endpoints
        if (endpoint.startsWith('/auth/login')) {
          return mockAuthApi.login(body.email, body.password)
        }
        if (endpoint.startsWith('/auth/register')) {
          return mockAuthApi.register(body)
        }
        
        // CV endpoints  
        if (endpoint === '/cv' && method === 'GET') {
          return mockCvApi.getCV()
        }
        if (endpoint === '/cv' && method === 'PUT') {
          return mockCvApi.updateCV(body)
        }
        if (endpoint === '/cv/ats-analysis') {
          return mockCvApi.getATSAnalysis()
        }
        
        // Interest endpoints
        if (endpoint === '/interest/questions') {
          return mockInterestApi.getQuestions()
        }
        if (endpoint === '/interest/result' && method === 'GET') {
          return mockInterestApi.getResult()
        }
        if (endpoint === '/interest/result' && method === 'POST') {
          return mockInterestApi.saveResult(body)
        }
        if (endpoint === '/interest/recommendations') {
          return mockInterestApi.getRecommendations()
        }
        
        // Cover letter endpoints
        if (endpoint === '/cover-letter' && method === 'GET') {
          return mockCoverLetterApi.getAll()
        }
        if (endpoint === '/cover-letter' && method === 'POST') {
          return mockCoverLetterApi.create(body)
        }
        if (endpoint === '/cover-letter/generate' && method === 'POST') {
          return mockCoverLetterApi.generate(body)
        }
        
        // Articles endpoints
        if (endpoint === '/articles') {
          return mockArticleApi.getAll()
        }
        if (endpoint.match(/^\/articles\/\w+$/)) {
          const id = endpoint.split('/')[2]
          return mockArticleApi.getById(id)
        }
        
        // User endpoints
        if (endpoint === '/users/me') {
          return mockUserApi.getMe()
        }
        
        console.warn('Unhandled mock endpoint:', endpoint, method)
        throw new Error('Endpoint not implemented in mock API')
      })(args[0], args[1])
    }
  : realApiRequest

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    USE_MOCK
      ? mockAuthApi.login(email, password)
      : apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    USE_MOCK
      ? mockAuthApi.register(data)
      : apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
}

// CV API
export const cvApi = {
  getCV: () =>
    USE_MOCK ? mockCvApi.getCV() : apiRequest('/cv'),
  updateCV: (data: any) =>
    USE_MOCK
      ? mockCvApi.updateCV(data)
      : apiRequest('/cv', { method: 'PUT', body: JSON.stringify(data) }),
  getATSAnalysis: () =>
    USE_MOCK ? mockCvApi.getATSAnalysis() : apiRequest('/cv/ats-analysis'),
  // Versions
  getVersions: () =>
    USE_MOCK ? mockCvApi.getVersions() : apiRequest('/cv/versions'),
  saveVersion: (name: string, data: any) =>
    USE_MOCK
      ? mockCvApi.saveVersion(name, data)
      : apiRequest('/cv/versions', { method: 'POST', body: JSON.stringify({ name, data }) }),
  restoreVersion: (versionId: string) =>
    USE_MOCK
      ? mockCvApi.restoreVersion(versionId)
      : apiRequest(`/cv/versions/${versionId}/restore`, { method: 'POST' }),
  // Sharing
  shareCV: () =>
    USE_MOCK ? mockCvApi.shareCV() : apiRequest('/cv/share', { method: 'POST' }),
  // Job matching
  getJobMatches: () =>
    USE_MOCK ? mockCvApi.getJobMatches() : apiRequest('/cv/job-matches'),
  analyzeJob: (jobDescription: string) =>
    USE_MOCK
      ? mockCvApi.analyzeJob(jobDescription)
      : apiRequest('/cv/analyze-job', { method: 'POST', body: JSON.stringify({ jobDescription }) }),
}

// Jobs API - NYTT
export const jobsApi = {
  searchJobs: (filters?: { search?: string; location?: string; employmentType?: string[]; experienceLevel?: string[]; publishedWithin?: 'today' | 'week' | 'month' | 'all'; minMatchPercentage?: number }) =>
    USE_MOCK 
      ? mockJobsApi.searchJobs(filters) 
      : apiRequest('/jobs', { method: 'POST', body: JSON.stringify({ filters }) }),
  getJob: (jobId: string) =>
    USE_MOCK ? mockJobsApi.getJob(jobId) : apiRequest(`/jobs/${jobId}`),
  matchCV: (jobId: string, cvData: any) =>
    USE_MOCK
      ? mockJobsApi.matchCV(jobId, cvData)
      : apiRequest('/jobs/match-cv', { method: 'POST', body: JSON.stringify({ jobId, cvData }) }),
  // Applications
  getApplications: () =>
    USE_MOCK ? mockJobsApi.getApplications() : apiRequest('/job-applications'),
  saveJob: (jobId: string, status: string, notes?: string) =>
    USE_MOCK
      ? mockJobsApi.saveJob(jobId, status as any, notes)
      : apiRequest('/job-applications', { method: 'POST', body: JSON.stringify({ jobId, status, notes }) }),
  updateApplication: (appId: string, data: any) =>
    USE_MOCK
      ? mockJobsApi.updateApplication(appId, data)
      : apiRequest(`/job-applications/${appId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteApplication: (appId: string) =>
    USE_MOCK
      ? mockJobsApi.deleteApplication(appId)
      : apiRequest(`/job-applications/${appId}`, { method: 'DELETE' }),
}

// Interest API
export const interestApi = {
  getQuestions: () =>
    USE_MOCK ? mockInterestApi.getQuestions() : apiRequest('/interest/questions'),
  getResult: () =>
    USE_MOCK ? mockInterestApi.getResult() : apiRequest('/interest/result'),
  saveResult: (data: any) =>
    USE_MOCK
      ? mockInterestApi.saveResult(data)
      : apiRequest('/interest/result', { method: 'POST', body: JSON.stringify(data) }),
  getRecommendations: () =>
    USE_MOCK ? mockInterestApi.getRecommendations() : apiRequest('/interest/recommendations'),
}

// Cover Letter API
export const coverLetterApi = {
  getAll: () =>
    USE_MOCK ? mockCoverLetterApi.getAll() : apiRequest('/cover-letter'),
  create: (data: any) =>
    USE_MOCK
      ? mockCoverLetterApi.create(data)
      : apiRequest('/cover-letter', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    USE_MOCK
      ? mockCoverLetterApi.update(id, data)
      : apiRequest(`/cover-letter/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  generate: (jobAd: string, styleReference?: string) =>
    USE_MOCK
      ? mockCoverLetterApi.generate(jobAd, styleReference)
      : apiRequest('/cover-letter/generate', { method: 'POST', body: JSON.stringify({ jobAd, styleReference }) }),
}

// Article API
export const articleApi = {
  getAll: (filters?: { search?: string; category?: string }) =>
    USE_MOCK ? mockArticleApi.getAll(filters) : apiRequest('/articles'),
  getById: (id: string) =>
    USE_MOCK ? mockArticleApi.getById(id) : apiRequest(`/articles/${id}`),
  getCategories: () =>
    USE_MOCK ? mockArticleApi.getCategories() : apiRequest('/articles/categories'),
}

// User API
export const userApi = {
  getMe: () =>
    USE_MOCK ? mockUserApi.getMe() : apiRequest('/users/me'),
  updateMe: (data: any) =>
    USE_MOCK ? mockUserApi.updateMe(data) : apiRequest('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
}
