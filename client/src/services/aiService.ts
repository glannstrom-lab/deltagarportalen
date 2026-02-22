import { api } from './api'

// Request/Response interfaces
export interface CVOptimizationRequest {
  cvText: string
  yrke?: string
}

export interface CVOptimizationResponse {
  success: boolean
  feedback: string
  yrke: string | null
}

export interface GenerateCVRequest {
  yrke: string
  erfarenhet?: string
  utbildning?: string
  styrkor?: string
}

export interface GenerateCVResponse {
  success: boolean
  cvText: string
  yrke: string
}

export interface CoverLetterRequest {
  jobbAnnons: string
  erfarenhet?: string
  motivering?: string
  namn?: string
  ton?: 'professionell' | 'entusiastisk' | 'formell'
  extraContext?: string
}

export interface CoverLetterResponse {
  success: boolean
  brev: string
  ton: string
}

export interface InterviewPrepRequest {
  jobbTitel: string
  foretag?: string
  erfarenhet?: string
  egenskaper?: string
}

export interface InterviewPrepResponse {
  success: boolean
  forberedelser: string
  jobbTitel: string
  foretag?: string
}

export interface JobTipsRequest {
  intressen?: string
  tidigareErfarenhet?: string
  hinder?: string
  mal?: string
}

export interface JobTipsResponse {
  success: boolean
  tips: string
}

export interface ExerciseHelpRequest {
  ovningId: string
  steg: number
  fraga: string
  anvandarSvar?: string
}

export interface ExerciseHelpResponse {
  success: boolean
  hjalp: string
  ovningId: string
  steg: number
}

export interface SalaryNegotiationRequest {
  roll: string
  erfarenhetAr?: number
  nuvarandeLon?: number
  foretagsStorlek?: string
  ort?: string
}

export interface SalaryNegotiationResponse {
  success: boolean
  radgivning: string
  roll: string
}

export interface AIHealthResponse {
  status: string
  enabled: boolean
  url: string
  aiServer?: {
    status: string
    timestamp: string
    version: string
    model?: string
    modelConfigured?: boolean
    endpoints?: string[]
  }
  message?: string
}

export interface AIModel {
  id: string
  name: string
  provider: string
  description: string
  recommended?: boolean
}

export interface AIModelsResponse {
  currentModel: string
  models: AIModel[]
  note: string
}

/**
 * Tjänst för AI-funktioner
 * Alla anrop går via backend för att skydda API-nyckeln
 */
export const aiService = {
  /**
   * Kolla om AI-servern är tillgänglig
   */
  async checkHealth(): Promise<AIHealthResponse> {
    const response = await api.get('/ai/health')
    return response.data
  },

  /**
   * Få AI-feedback på CV
   */
  async optimizeCV(data: CVOptimizationRequest): Promise<CVOptimizationResponse> {
    const response = await api.post('/ai/cv-optimering', data)
    return response.data
  },

  /**
   * Generera CV-text med AI
   */
  async generateCVText(data: GenerateCVRequest): Promise<GenerateCVResponse> {
    const response = await api.post('/ai/generera-cv-text', data)
    return response.data
  },

  /**
   * Generera personligt brev
   */
  async generateCoverLetter(data: CoverLetterRequest): Promise<CoverLetterResponse> {
    const response = await api.post('/ai/personligt-brev', data)
    return response.data
  },

  /**
   * Förberedelser inför intervju
   */
  async prepareInterview(data: InterviewPrepRequest): Promise<InterviewPrepResponse> {
    const response = await api.post('/ai/intervju-forberedelser', data)
    return response.data
  },

  /**
   * Få personliga jobbsökartips
   */
  async getJobTips(data: JobTipsRequest): Promise<JobTipsResponse> {
    const response = await api.post('/ai/jobbtips', data)
    return response.data
  },

  /**
   * Hjälp med övningar
   */
  async getExerciseHelp(data: ExerciseHelpRequest): Promise<ExerciseHelpResponse> {
    const response = await api.post('/ai/ovningshjalp', data)
    return response.data
  },

  /**
   * Löneförhandlingsrådgivning
   */
  async getSalaryAdvice(data: SalaryNegotiationRequest): Promise<SalaryNegotiationResponse> {
    const response = await api.post('/ai/loneforhandling', data)
    return response.data
  },

  /**
   * Kontrollera om AI är aktiverat
   */
  async isEnabled(): Promise<boolean> {
    try {
      const health = await this.checkHealth()
      return health.enabled && health.status === 'OK'
    } catch {
      return false
    }
  },

  /**
   * Hämta nuvarande AI-modell
   */
  async getCurrentModel(): Promise<string | null> {
    try {
      const health = await this.checkHealth()
      return health.aiServer?.model || null
    } catch {
      return null
    }
  }
}
