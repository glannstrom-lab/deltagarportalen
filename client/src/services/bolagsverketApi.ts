/**
 * Bolagsverket API Service
 * Client for fetching company information from Swedish Companies Registry
 */

import { supabase } from '../lib/supabase'

// Response types from Bolagsverket API
export interface BolagsverketCompany {
  orgNumber: string
  name: string
  legalForm?: string
  address?: {
    street?: string
    postalCode?: string
    city?: string
  }
  sniCodes?: Array<{
    code: string
    description?: string
  }>
  businessDescription?: string
  registrationDate?: string
  _raw?: Record<string, unknown>
}

export interface BolagsverketResponse {
  success: boolean
  company?: BolagsverketCompany
  error?: string
}

// Cache for company lookups
const companyCache = new Map<string, { data: BolagsverketCompany; timestamp: number }>()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

/**
 * Normalize organization number to 10 digits without dash
 */
export function normalizeOrgNumber(orgNumber: string): string {
  return orgNumber.replace(/[-\s]/g, '').trim()
}

/**
 * Format organization number with dash (e.g., 556074-7551)
 */
export function formatOrgNumber(orgNumber: string): string {
  const normalized = normalizeOrgNumber(orgNumber)
  if (normalized.length === 10) {
    return `${normalized.slice(0, 6)}-${normalized.slice(6)}`
  }
  return orgNumber
}

/**
 * Validate organization number format
 */
export function isValidOrgNumber(orgNumber: string): boolean {
  const normalized = normalizeOrgNumber(orgNumber)
  return /^\d{10}$/.test(normalized)
}

/**
 * Get company information from Bolagsverket
 */
export async function getCompanyInfo(orgNumber: string): Promise<BolagsverketCompany | null> {
  const normalized = normalizeOrgNumber(orgNumber)

  if (!isValidOrgNumber(normalized)) {
    throw new Error('Ogiltigt organisationsnummer. Ange 10 siffror.')
  }

  // Check cache first
  const cached = companyCache.get(normalized)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[bolagsverket] Cache hit for', normalized)
    return cached.data
  }

  console.log('[bolagsverket] Fetching company info for', normalized)

  try {
    const { data, error } = await supabase.functions.invoke('bolagsverket', {
      body: null,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // The Edge Function uses path-based routing, so we need to call it differently
    // Using fetch directly to the Edge Function URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    const response = await fetch(`${supabaseUrl}/functions/v1/bolagsverket/company/${normalized}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    const result: BolagsverketResponse = await response.json()

    if (!result.success || !result.company) {
      return null
    }

    // Cache the result
    companyCache.set(normalized, {
      data: result.company,
      timestamp: Date.now(),
    })

    return result.company
  } catch (error) {
    console.error('[bolagsverket] Error fetching company:', error)
    throw error
  }
}

/**
 * Lookup multiple companies (batch)
 */
export async function getCompaniesInfo(orgNumbers: string[]): Promise<Map<string, BolagsverketCompany | null>> {
  const results = new Map<string, BolagsverketCompany | null>()

  // Process in parallel with rate limiting (max 10 concurrent)
  const batchSize = 10
  for (let i = 0; i < orgNumbers.length; i += batchSize) {
    const batch = orgNumbers.slice(i, i + batchSize)
    const promises = batch.map(async (orgNumber) => {
      try {
        const company = await getCompanyInfo(orgNumber)
        results.set(normalizeOrgNumber(orgNumber), company)
      } catch {
        results.set(normalizeOrgNumber(orgNumber), null)
      }
    })
    await Promise.all(promises)
  }

  return results
}

/**
 * Clear cache (useful for testing or force refresh)
 */
export function clearCache(): void {
  companyCache.clear()
}

/**
 * Get SNI code description in Swedish
 */
export function getSniDescription(sniCode: string): string {
  // Common SNI codes - extend as needed
  const sniDescriptions: Record<string, string> = {
    '62010': 'Dataprogrammering',
    '62020': 'Datakonsultverksamhet',
    '62030': 'Databasverksamhet och drift',
    '62090': 'Övrig IT-verksamhet',
    '70220': 'Konsultverksamhet avseende företags organisation',
    '47110': 'Livsmedelshandel',
    '47190': 'Detaljhandel med brett sortiment',
    '56100': 'Restaurangverksamhet',
    '56300': 'Barverksamhet',
    '68100': 'Handel med egna fastigheter',
    '68200': 'Uthyrning av egna fastigheter',
    '69101': 'Redovisning och bokföring',
    '69102': 'Skatterådgivning',
    '69103': 'Revision',
    '70100': 'Verksamheter som utövas av huvudkontor',
    '73110': 'Reklambyråer',
    '73120': 'Förmedling av reklamutrymme',
    '78100': 'Rekrytering och uthyrning av personal',
    '86210': 'Öppenvård',
    '86220': 'Specialiserad öppenvård',
    '86901': 'Hälsocentraler',
    '86902': 'Primärvård utan läkare',
    '96020': 'Frisering och annan kroppsvård',
  }

  return sniDescriptions[sniCode] || `Branschkod ${sniCode}`
}

export default {
  getCompanyInfo,
  getCompaniesInfo,
  normalizeOrgNumber,
  formatOrgNumber,
  isValidOrgNumber,
  clearCache,
  getSniDescription,
}
