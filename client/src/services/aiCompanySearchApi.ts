/**
 * AI Company Search API Service
 * Uses Perplexity to search for companies and verifies against Bolagsverket
 */

import { supabase } from '../lib/supabase'

export interface AICompanyResult {
  name: string
  orgNumber: string | null
  description: string
  city: string | null
  industry: string | null
  verified: boolean
  verifiedData?: {
    orgNumber: string
    name: string
    legalForm: string
    address: {
      street: string
      postalCode: string
      city: string
    }
  }
}

export interface AICompanySearchResponse {
  success: boolean
  query: string
  companies: AICompanyResult[]
  totalFound: number
  verified: number
  error?: string
}

/**
 * Search for companies using AI
 */
export async function searchCompaniesWithAI(
  query: string,
  maxResults: number = 10
): Promise<AICompanySearchResponse> {
  if (!query || query.trim().length < 3) {
    throw new Error('Söktermen måste vara minst 3 tecken')
  }

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  if (!token) {
    throw new Error('Du måste vara inloggad för att använda AI-sökning')
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  const response = await fetch(`${supabaseUrl}/functions/v1/ai-company-search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query.trim(),
      maxResults,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Sökning misslyckades: ${response.status}`)
  }

  const result: AICompanySearchResponse = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Sökning misslyckades')
  }

  return result
}

export default {
  searchCompaniesWithAI,
}
