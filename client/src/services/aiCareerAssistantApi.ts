/**
 * AI Career Assistant API Service
 * Unified client for all AI career assistant functions
 */

import { supabase } from '../lib/supabase'

// ============================================
// TYPES
// ============================================

export type AssistantType = 'interview-prep' | 'salary-compass' | 'networking-help' | 'education-guide'

// Interview Prep Types
export interface InterviewPrepParams {
  companyName: string
  orgNumber?: string
  jobTitle?: string
  jobDescription?: string
}

export interface InterviewPrepResult {
  companyInfo: {
    summary: string
    recentNews: string[]
    culture: string
    challenges: string[]
  }
  interviewQuestions: {
    common: string[]
    roleSpecific: string[]
    behavioral: string[]
  }
  tipsForCandidate: string[]
  questionsToAsk: string[]
  salaryExpectations: {
    range: string
    negotiationTips: string[]
  }
}

// Salary Compass Types
export interface SalaryCompassParams {
  occupation: string
  region?: string
  experienceYears?: number
  currentSalary?: number
  skills?: string[]
}

export interface SalaryCompassResult {
  marketData: {
    averageSalary: string
    salaryRange: string
    percentile25: string
    percentile75: string
  }
  progression: {
    year1: string
    year3: string
    year5: string
  }
  comparisons: {
    industry: string
    region: string
    experience: string
  }[]
  highValueSkills: {
    skill: string
    salaryImpact: string
  }[]
  negotiationInsights: string[]
  sources: string[]
}

// Networking Help Types
export interface NetworkingHelpParams {
  contactName?: string
  contactTitle?: string
  contactCompany?: string
  userGoal?: string
  userBackground?: string
  platform?: 'LinkedIn' | 'Email' | 'Other'
}

export interface NetworkingHelpResult {
  suggestedMessage: string
  alternativeOpenings: string[]
  followUpStrategy: string[]
  networkingTips: string[]
  relevantGroups: {
    name: string
    platform: string
    relevance: string
  }[]
  linkedInTips: string[]
}

// Education Guide Types
export interface EducationGuideParams {
  targetOccupation: string
  currentSkills?: string[]
  budget?: string
  timeAvailable?: string
  location?: string
}

export interface EducationGuideResult {
  freeCourses: {
    title: string
    provider: string
    url: string
    duration: string
    level: string
  }[]
  certifications: {
    name: string
    provider: string
    cost: string
    value: string
    timeToComplete: string
  }[]
  formalEducation: {
    type: string
    provider: string
    duration: string
    location: string
  }[]
  learningPath: {
    step: number
    action: string
    timeframe: string
    outcome: string
  }[]
  roiAnalysis: {
    investmentTime: string
    estimatedCost: string
    expectedSalaryIncrease: string
    paybackPeriod: string
  }
}

// Generic response
export interface AIAssistantResponse<T> {
  success: boolean
  type: AssistantType
  result: T
  citations?: string[]
  error?: string
}

// ============================================
// API FUNCTIONS
// ============================================

async function callAssistant<T>(
  type: AssistantType,
  params: Record<string, unknown>
): Promise<AIAssistantResponse<T>> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  if (!token) {
    throw new Error('Du måste vara inloggad för att använda AI-assistenten')
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  const response = await fetch(`${supabaseUrl}/functions/v1/ai-career-assistant`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, params }),
  })

  if (response.status === 429) {
    const data = await response.json()
    throw new Error(`För många förfrågningar. Försök igen om ${data.retryAfter || 60} sekunder.`)
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Förfrågan misslyckades: ${response.status}`)
  }

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Ett fel uppstod')
  }

  return result as AIAssistantResponse<T>
}

/**
 * Get interview preparation insights for a company/job
 */
export async function getInterviewPrep(
  params: InterviewPrepParams
): Promise<AIAssistantResponse<InterviewPrepResult>> {
  return callAssistant<InterviewPrepResult>('interview-prep', params)
}

/**
 * Get salary market data and insights
 */
export async function getSalaryCompass(
  params: SalaryCompassParams
): Promise<AIAssistantResponse<SalaryCompassResult>> {
  return callAssistant<SalaryCompassResult>('salary-compass', params)
}

/**
 * Get networking assistance with message generation
 */
export async function getNetworkingHelp(
  params: NetworkingHelpParams
): Promise<AIAssistantResponse<NetworkingHelpResult>> {
  return callAssistant<NetworkingHelpResult>('networking-help', params)
}

/**
 * Get education and learning path recommendations
 */
export async function getEducationGuide(
  params: EducationGuideParams
): Promise<AIAssistantResponse<EducationGuideResult>> {
  return callAssistant<EducationGuideResult>('education-guide', params)
}

// ============================================
// COMPANY ANALYSIS API (for SearchTab)
// ============================================

export interface CompanyAnalysisParams {
  companyName: string
  orgNumber?: string
  industry?: string
}

export interface CompanyAnalysisResult {
  recentNews: {
    title: string
    date: string
    summary: string
    sentiment: 'positive' | 'neutral' | 'negative'
  }[]
  financialStatus: {
    summary: string
    revenue?: string
    employees?: string
    growth?: string
  }
  recruitmentNeeds: {
    hiring: boolean
    roles: string[]
    signals: string[]
  }
  companyCulture: {
    summary: string
    values: string[]
    workEnvironment: string
    ratings?: {
      glassdoor?: string
      indeed?: string
    }
  }
  spontaneousApplicationTips: {
    bestApproach: string
    talkingPoints: string[]
    avoidTopics: string[]
    bestTimeToApply: string
  }
}

export async function getCompanyAnalysis(
  params: CompanyAnalysisParams
): Promise<AIAssistantResponse<CompanyAnalysisResult>> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  if (!token) {
    throw new Error('Du måste vara inloggad för att använda AI-analys')
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  const response = await fetch(`${supabaseUrl}/functions/v1/ai-company-analysis`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (response.status === 429) {
    const data = await response.json()
    throw new Error(`För många förfrågningar. Försök igen om ${data.retryAfter || 60} sekunder.`)
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Förfrågan misslyckades: ${response.status}`)
  }

  return response.json()
}

// ============================================
// INDUSTRY RADAR API (for LaborMarketTab)
// ============================================

export interface IndustryRadarParams {
  userInterests?: string[]
  currentOccupation?: string
  region?: string
}

export interface IndustryRadarResult {
  trendingIndustries: {
    name: string
    growthIndicator: 'up' | 'stable' | 'down'
    growthPercent: number
    demandLevel: 'high' | 'medium' | 'low'
    salaryTrend: string
  }[]
  emergingSkills: {
    skill: string
    demandGrowth: string
    industries: string[]
    learningTime: string
  }[]
  marketInsights: {
    title: string
    summary: string
    impact: string
  }[]
  personalizedRecommendations: string[]
  lastUpdated: string
}

export async function getIndustryRadar(
  params: IndustryRadarParams
): Promise<AIAssistantResponse<IndustryRadarResult>> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  if (!token) {
    throw new Error('Du måste vara inloggad')
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  const response = await fetch(`${supabaseUrl}/functions/v1/ai-industry-radar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (response.status === 429) {
    const data = await response.json()
    throw new Error(`För många förfrågningar. Försök igen om ${data.retryAfter || 60} sekunder.`)
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Förfrågan misslyckades: ${response.status}`)
  }

  return response.json()
}

// ============================================
// COMMUTE PLANNER API (for JobSearch)
// ============================================

export interface CommutePlannerParams {
  homeAddress: string
  workAddress: string
  preferredMode?: 'public' | 'car' | 'bike' | 'any'
}

export interface CommutePlannerResult {
  publicTransit: {
    duration: string
    transfers: number
    lines: string[]
    monthlyCost: string
  } | null
  car: {
    duration: string
    distance: string
    monthlyCost: string
    parkingInfo: string
  } | null
  bike: {
    duration: string
    distance: string
    feasibility: string
  } | null
  recommendation: string
  remoteWorkSuggestion: string
  alternativeJobs?: {
    suggestion: string
  }
}

export async function getCommutePlan(
  params: CommutePlannerParams
): Promise<AIAssistantResponse<CommutePlannerResult>> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  if (!token) {
    throw new Error('Du måste vara inloggad')
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  const response = await fetch(`${supabaseUrl}/functions/v1/ai-commute-planner`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (response.status === 429) {
    const data = await response.json()
    throw new Error(`För många förfrågningar. Försök igen om ${data.retryAfter || 60} sekunder.`)
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Förfrågan misslyckades: ${response.status}`)
  }

  return response.json()
}

export default {
  getInterviewPrep,
  getSalaryCompass,
  getNetworkingHelp,
  getEducationGuide,
  getCompanyAnalysis,
  getIndustryRadar,
  getCommutePlan,
}
