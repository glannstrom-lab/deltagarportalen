/**
 * AI API Client - Centralized client for all AI API calls
 * Automatically includes authentication headers
 */

import { supabase } from '@/lib/supabase'

interface AIApiOptions {
  function: string
  data: Record<string, unknown>
}

interface AIApiResponse<T = unknown> {
  success: boolean
  error?: string
  [key: string]: T | boolean | string | undefined
}

/**
 * Get the current user's access token
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

/**
 * Make an authenticated request to the AI API
 */
export async function callAI<T = unknown>(
  functionName: string,
  data: Record<string, unknown>
): Promise<AIApiResponse<T>> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('Du måste vara inloggad för att använda AI-funktioner.')
  }

  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ function: functionName, data })
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Din session har gått ut. Vänligen logga in igen.')
    }
    if (response.status === 429) {
      throw new Error('För många förfrågningar. Försök igen om en stund.')
    }
    throw new Error('Ett fel uppstod vid kommunikation med AI-tjänsten.')
  }

  return response.json()
}

/**
 * Convenience functions for specific AI endpoints
 */

export async function generateCoverLetter(data: {
  jobbAnnons?: string
  jobDescription?: string
  companyName?: string
  jobTitle?: string
  cvData?: Record<string, unknown>
  ton?: 'professionell' | 'entusiastisk' | 'formell'
  extraKeywords?: string
  motivering?: string
}) {
  return callAI<string>('personligt-brev', data)
}

export async function optimizeCV(data: {
  cvText: string
  yrke?: string
}) {
  return callAI<string>('cv-optimering', data)
}

export async function generateCVText(data: {
  yrke: string
  erfarenhet?: string
  utbildning?: string
  styrkor?: string
}) {
  return callAI<string>('generera-cv-text', data)
}

export async function prepareInterview(data: {
  jobbTitel?: string
  foretag?: string
  erfarenhet?: string
  egenskaper?: string
}) {
  return callAI<string>('intervju-forberedelser', data)
}

export async function getJobTips(data: {
  intressen?: string
  tidigareErfarenhet?: string
  hinder?: string
  mal?: string
}) {
  return callAI<string>('jobbtips', data)
}

export async function prepareSalaryNegotiation(data: {
  roll: string
  erfarenhetAr?: number
  nuvarandeLon?: number
  foretagsStorlek?: string
  ort?: string
}) {
  return callAI<string>('loneforhandling', data)
}

export async function createCareerPlan(data: {
  currentOccupation: string
  targetOccupation: string
  experienceYears: number
  currentSalary?: number
  targetSalary?: number
  demand?: 'high' | 'medium' | 'low'
  jobCount?: number
}) {
  return callAI<{
    steps: Array<{
      order: number
      title: string
      description: string
      timeframe: string
      actions: string[]
      education: string[]
    }>
    analysis: string
    keySkills: string[]
    challenges: string[]
  }>('karriarplan', data)
}

export async function chatWithAI(data: {
  meddelande: string
  historik?: Array<{ roll: string; innehall: string }>
}) {
  return callAI<string>('chatbot', data)
}

export default {
  callAI,
  generateCoverLetter,
  optimizeCV,
  generateCVText,
  prepareInterview,
  getJobTips,
  prepareSalaryNegotiation,
  createCareerPlan,
  chatWithAI
}
