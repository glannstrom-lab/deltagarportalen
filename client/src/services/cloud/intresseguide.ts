/** Intresseguiden: pågående test (interest_guide_progress) och historik (interest_guide_history). */

import { supabase } from '@/lib/supabase'
import { storageLogger } from '@/lib/logger'
import { getCurrentUser, handleStorageError } from './_shared'
// Typerna för intresseguidens profiler. `Record<string, number>` stod här och
// gav fyra TS2322 i TestTab: ett interface är inte tilldelningsbart till
// Record<string, number> eftersom det saknar indexsignatur. interestGuideData
// importerar inget härifrån, så ingen cirkel uppstår.
import type {
  RiasecScores,
  BigFiveScores,
  ICFScores,
  StrongInterestCategories,
} from '../interestGuideData'

interface InterestGuideAnswers {
  [key: string]: unknown
}

// ============================================
// INTRESSEGUIDE
// ============================================

export interface InterestGuideHistoryEntry {
  id: string
  user_id: string
  answers: Record<string, number>
  riasec_profile: Record<string, number>
  bigfive_profile: Record<string, number>
  icf_profile: Record<string, number>
  strong_interest: Record<string, number>
  top_occupations: Array<{ name: string; matchPercentage: number }>
  completed_at: string
  created_at: string
}

export const interestGuideApi = {
  async getProgress() {
    const user = await getCurrentUser()
    if (!user) {
      storageLogger.debug('Ingen användare inloggad - kan inte hämta intresseguide')
      return null
    }

    // E11 (2026-07-23): explicit kolumnlista.
    // `updated_at` tillagd 2026-08-21: `useInterestProfile:280,293` och
    // `QuestionCard:36` läste redan fältet, men det hämtades aldrig — så
    // `completedAt` var alltid null i fallback-grenen. `lint:schema` ser inget
    // fel eftersom kolumnen finns i tabellen; den fattas bara i select-listan.
    const { data, error } = await supabase
      .from('interest_guide_progress')
      .select('answers, current_step, is_completed, updated_at')
      .eq('user_id', user.id)
      .maybeSingle()

    /*
      KASTAR vid annat än "ingen rad". Tidigare loggades felet och `null`
      returnerades — och varje anropare tolkar `null` som "användaren har inte
      gjort testet". Ett RLS-fel eller ett nätverksglapp blev alltså
      "Genomför testet först" för någon som gjort det, och i TestTab dessutom
      startpunkten för ett nytt test som upsertade över de sparade svaren.
      (Granskning 2026-08-21.)
    */
    if (error && error.code !== 'PGRST116') {
      storageLogger.error('Error getting interest guide progress:', error)
      throw error
    }
    return data || null
  },

  /**
   * Returnerar `true` bara om raden faktiskt skrevs.
   *
   * Funktionen kunde tidigare inte misslyckas: `handleStorageError` är
   * `void`-typad och kastar aldrig, så `await saveProgress(...)` löstes alltid
   * ut. TestTabs `catch` var därmed oåtkomlig för databasfel, och den gröna
   * bocken **"Sparat"** visades även när ingenting sparats. För en målgrupp
   * vars ork räcker till ett försök var det den dyraste buggen på sidan.
   * Mönstret följer `integrationChecklistApi.saveProgress`.
   */
  async saveProgress(progress: {
    current_step?: number
    answers?: InterestGuideAnswers
    energy_level?: string
    is_completed?: boolean
  }): Promise<boolean> {
    const user = await getCurrentUser()
    if (!user) {
      storageLogger.debug('Ingen användare inloggad - intresseguide sparas inte')
      return false
    }

    const { error } = await supabase
      .from('interest_guide_progress')
      .upsert({
        user_id: user.id,
        ...progress,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      handleStorageError(error, 'spara intresseguide')
      return false
    }
    return true
  },

  async reset() {
    const user = await getCurrentUser()
    if (!user) return

    const { error } = await supabase
      .from('interest_guide_progress')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      handleStorageError(error, 'återställa intresseguide')
    }
  },

  // ===== HISTORIK =====
  async saveToHistory(historyEntry: {
    answers: Record<string, number>
    riasec_profile: RiasecScores
    bigfive_profile: BigFiveScores
    /** null när hälsosamtycke saknas — ICF-delen är art. 9-data. */
    icf_profile: ICFScores | null
    strong_interest: StrongInterestCategories
    top_occupations: Array<{ name: string; matchPercentage: number }>
  }) {
    const user = await getCurrentUser()
    if (!user) {
      storageLogger.debug('Ingen användare inloggad - historik sparas inte')
      return null
    }

    const { data, error } = await supabase
      .from('interest_guide_history')
      .insert({
        user_id: user.id,
        ...historyEntry,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      handleStorageError(error, 'spara intresseguide-historik')
      return null
    }
    return data
  },

  async getHistory(limit: number = 10): Promise<InterestGuideHistoryEntry[]> {
    const user = await getCurrentUser()
    if (!user) {
      return []
    }

    // E11 (2026-07-23): explicit kolumnlista — matchar exakt InterestGuideHistoryEntry
    // (returtypen konsumenterna typas mot).
    const { data, error } = await supabase
      .from('interest_guide_history')
      .select('id, user_id, answers, riasec_profile, bigfive_profile, icf_profile, strong_interest, top_occupations, completed_at, created_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (error) {
      handleStorageError(error, 'hämta intresseguide-historik')
      return []
    }
    return data || []
  },

  async getHistoryEntry(id: string): Promise<InterestGuideHistoryEntry | null> {
    const user = await getCurrentUser()
    if (!user) return null

    // E11 (2026-07-23): explicit kolumnlista — samma som getHistory ovan.
    const { data, error } = await supabase
      .from('interest_guide_history')
      .select('id, user_id, answers, riasec_profile, bigfive_profile, icf_profile, strong_interest, top_occupations, completed_at, created_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      handleStorageError(error, 'hämta historikpost')
      return null
    }
    return data
  },

  async getHistoryCount(): Promise<number> {
    const user = await getCurrentUser()
    if (!user) return 0

    const { count, error } = await supabase
      .from('interest_guide_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (error) {
      handleStorageError(error, 'räkna historikposter')
      return 0
    }
    return count || 0
  }
}
