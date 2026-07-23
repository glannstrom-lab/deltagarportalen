/**
 * AI API Client - Centralized client for all AI API calls
 * Automatically includes authentication headers.
 *
 * GDPR-säkerhet (2026-05-15): PII-sanitering körs på all data innan
 * det skickas till backend (som sedan vidarebefordrar till OpenRouter USA).
 * Personnummer, kreditkort, bankkonton stryks helt. Email/telefon flaggas.
 * Se client/src/lib/piiSanitizer.ts.
 */

import { supabase } from '@/lib/supabase'
import { sanitizeObjectForAi } from '@/lib/piiSanitizer'
import { apiLogger } from '@/lib/logger'

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

/** Maxtid för ett AI-anrop innan vi ger upp (E1/P3, 2026-07-10).
 *  Vercel-funktionen har egen serverside-timeout; 60 s täcker långsamma
 *  modellsvar utan att låta UI:t vänta för evigt på hängda anslutningar. */
const AI_TIMEOUT_MS = 60_000

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

  // GDPR: sanitera prompten innan vi skickar persondata till AI-leverantören.
  const { sanitized, stripped, warnings } = sanitizeObjectForAi(data)
  const strippedCount = Object.values(stripped).reduce((a, b) => a + b, 0)
  if (strippedCount > 0) {
    apiLogger.warn('[callAI] PII strippad innan AI-anrop:', { functionName, stripped })
  }
  if (warnings.length > 0) {
    apiLogger.debug('[callAI] PII-warning (behållen, krävs för AI-output):', { functionName, warnings })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ function: functionName, data: sanitized }),
      signal: controller.signal
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('AI-tjänsten svarade inte i tid. Försök igen om en stund.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }

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

// C12 (2026-07-23): convenience-wrappers för de 8 orphanade ai.js-funktionerna
// raderade tillsammans med funktionerna (cv-optimering, generera-cv-text,
// intervju-forberedelser, jobbtips, loneforhandling, natverkande,
// ansokningscoach, mentalt-stod) — noll anropare. Återskapas från git-
// historiken om G10-personaliseringen vill koppla in någon av dem.
// karriarplan lever (anropas direkt via callAI i PlanTab, B7).

export async function chatWithAI(data: {
  meddelande: string
  historik?: Array<{ roll: string; innehall: string }>
}) {
  return callAI<string>('chatbot', data)
}

export async function generateProfileSummary(data: {
  name?: string
  title?: string
  location?: string
  experience?: Array<{ title: string; company: string; description?: string }>
  education?: Array<{ degree: string; school: string }>
  skills?: Array<{ name: string; level?: number }>
  desiredJobs?: string[]
  interests?: string[]
}) {
  return callAI<string>('profile-summary', data)
}

/**
 * STA — DOA-sammanfattning för AF-blankett sida 4.
 * Returnerar strukturerad summering med 1 mål-och-planering + en text per kategori.
 * AT redigerar utkastet innan PDF-export.
 */
export interface DoaSummaryResult {
  malPlanering: string
  kategorier: Array<{ title: string; resurserBegransningar: string }>
}

export async function generateDoaSummary(data: {
  firstName?: string
  categories: Array<{
    title: string
    items: Array<{
      text: string
      person: number | null
      bedomare: number | string | null
      comment: string | null
    }>
  }>
}) {
  const result = await callAI<DoaSummaryResult>('sta-doa-sammanfattning', data as unknown as Record<string, unknown>)
  return result
}

export default {
  callAI,
  generateCoverLetter,
  chatWithAI,
  generateProfileSummary
}
