/**
 * Delat av alla domänfiler i services/cloud/ (KA3, 2026-09-12): aktuell
 * användare, feltypen och de två felhanterarna. Ingenting här är publikt
 * utanför services/cloud — bara LagringsFel re-exporteras av index.ts.
 *
 * OBS: alla api-objekt hanterar RLS-fel (42501) genom att falla tillbaka på
 * localStorage; handleStorageError loggar tyst och kastar aldrig.
 */

import { supabase } from '@/lib/supabase'
import { storageLogger } from '@/lib/logger'

export interface SupabaseError {
  code?: string
  status?: number
  message?: string
}

// Hjälpfunktion för att hämta aktuell användare
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Type guard for Supabase errors
export function isSupabaseError(error: unknown): error is SupabaseError {
  return typeof error === 'object' && error !== null && ('code' in error || 'status' in error)
}

/**
 * Fel som anroparen ska kunna visa för användaren.
 *
 * `handleStorageError` nedan är `void`-typad och sväljer allt. Det mönstret
 * gjorde att Personligt varumärke kunde tappa hela objekt utan ett ord:
 * portfolioposten skrevs, servern svarade 400, formuläret stängdes och listan
 * var oförändrad. Skrivvägar som användaren har arbetat för ska kasta det
 * här i stället.
 */
export class LagringsFel extends Error {
  readonly kod?: string
  constructor(meddelande: string, kod?: string) {
    super(meddelande)
    this.name = 'LagringsFel'
    this.kod = kod
  }
}

export function kastaLagringsFel(error: unknown, context: string): never {
  handleStorageError(error, context)
  const kod = isSupabaseError(error) ? String(error.code ?? error.status ?? '') : undefined
  throw new LagringsFel(context, kod)
}

// Hjälpfunktion för att hantera fel
export function handleStorageError(error: unknown, context: string): void {
  if (!isSupabaseError(error)) {
    storageLogger.error(`Fel vid ${context}:`, error)
    return
  }

  // RLS-policy fel (42501) - logga tyst
  if (error.code === '42501') {
    storageLogger.debug(`RLS policy förhindrar ${context} - använder fallback`)
    return
  }
  // Användaren inte inloggad
  if (error.code === 'PGRST116' || error.status === 401 || error.status === 406) {
    storageLogger.debug(`Användare inte inloggad för ${context} - använder fallback`)
    return
  }
  // Andra fel - logga för debugging
  storageLogger.error(`Fel vid ${context}:`, error)
}
