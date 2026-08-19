/**
 * AI Company Search API Service
 * Uses Perplexity to search for companies and verifies against Bolagsverket
 */

import { supabase } from '../lib/supabase'
import { sanitizeForAi } from '../lib/piiSanitizer'

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
 * Fel från AI-företagssökningen, med edge-funktionens felkod bevarad.
 *
 * Koden behövs för att UI:t ska kunna skilja saker som ser likadana ut men
 * kräver olika svar av personen. Framför allt: `AI_DISABLED` betyder att hon
 * själv stängt av AI-behandling (GDPR art. 21) — då är "försök igen om en
 * stund" ett råd som aldrig kan funka, och vägen framåt är Inställningar.
 * Ett 503 betyder tvärtom att det är vi som strular och att det ÄR värt att
 * försöka igen.
 *
 * Koderna sätts i `supabase/functions/_shared/aiGate.ts`. `error`-texten får
 * skrivas om; `code` är kontraktet.
 */
export class AiFöretagsfel extends Error {
  kod?: string
  httpStatus?: number
  /** Sekunder till nästa försök, när servern skickat med det. */
  retryAfter?: number

  constructor(message: string, kod?: string, httpStatus?: number, retryAfter?: number) {
    super(message)
    this.name = 'AiFöretagsfel'
    this.kod = kod
    this.httpStatus = httpStatus
    this.retryAfter = retryAfter
  }

  /** Personen har själv stängt av AI — inget att försöka igen med. */
  get arAvstangdAvAnvandaren(): boolean {
    return this.kod === 'AI_DISABLED' || this.kod === 'AI_CONSENT_REQUIRED'
  }

  /** Tjänstefel eller kvot — det är meningsfullt att vänta och försöka igen. */
  get gårAttFörsökaIgen(): boolean {
    return !this.arAvstangdAvAnvandaren
  }
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

  // PII-sanering.
  //
  // Anrop till /api/ai går genom `prepareAiRequest`, som sanerar nyttolasten
  // innan den lämnar webbläsaren. Den här vägen går till en edge-funktion och
  // hade därför INGEN sanering alls till 2026-08-19 — söktexten skickades
  // ordagrant vidare till Perplexity, som dessutom gör en webbsökning på den.
  // Söktexten är fritext: skriver någon in sitt personnummer, sin adress eller
  // ett namn hamnar det hos en tredje part.
  //
  // Hårda strykningar (personnummer, kort, bankkonton) sker alltid.
  // `detectSoftPii: false` eftersom varningarna för e-post och telefon inte
  // har någon mottagare här — de används av /api/ai:s eget varningslager.
  const { sanitized: sanerad } = sanitizeForAi(query.trim(), { detectSoftPii: false })

  // Taket klampas här och inte bara i edge-funktionen: värdet interpoleras in
  // i en systemprompt på andra sidan, och ett tal som inte är ett tal hör inte
  // hemma i en prompt.
  //
  // `Number(x) || 10` duger inte: 0 är falsy och hade blivit 10, alltså tio
  // träffar när anroparen bad om noll. Skilj "inte ett tal" (→ standardvärdet)
  // från "ett tal utanför intervallet" (→ klampas). Ett test fällde precis
  // den skillnaden.
  const begart = Number(maxResults)
  const tak = Number.isFinite(begart)
    ? Math.min(25, Math.max(1, Math.round(begart)))
    : 10

  const response = await fetch(`${supabaseUrl}/functions/v1/ai-company-search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: sanerad,
      maxResults: tak,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new AiFöretagsfel(
      errorData.error || `Sökning misslyckades: ${response.status}`,
      typeof errorData.code === 'string' ? errorData.code : undefined,
      response.status,
      typeof errorData.retryAfter === 'number' ? errorData.retryAfter : undefined,
    )
  }

  const result: AICompanySearchResponse = await response.json()

  if (!result.success) {
    throw new AiFöretagsfel(result.error || 'Sökning misslyckades')
  }

  return result
}

export default {
  searchCompaniesWithAI,
}
