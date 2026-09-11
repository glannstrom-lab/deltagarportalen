/** Intervjusimulatorns sessioner (interview_sessions). Typerna speglar prod-schemat — inga indexsignaturer. */

import { supabase } from '@/lib/supabase'
import { getCurrentUser, handleStorageError } from './_shared'

/**
 * En rad i `interview_sessions`, som tabellen faktiskt ser ut i prod
 * (verifierat mot information_schema 2026-08-18).
 *
 * Typen beskrev tidigare `company_name`, `position`, `interview_date` och
 * `notes` — **inga av dem är kolumner**. Med `[key: string]: unknown` gick
 * vilken nyckel som helst igenom, så TypeScript kunde inte fånga att
 * `interviewService` skickade fem påhittade fältnamn och utelämnade det enda
 * NOT NULL-fältet. Insertet kunde aldrig lyckas, och tabellen stod tom i hela
 * prod. Index-signaturen är därför borttagen: nya fält ska läggas till här,
 * mot schemat, inte smygas in vid anropet.
 */
interface InterviewSessionInsert {
  /** NOT NULL utan default — utelämnas den avvisas hela raden. */
  job_title: string
  company?: string | null
  type?: string
  status?: string
  questions?: unknown
  answers?: unknown
  feedback?: unknown
  started_at?: string
  completed_at?: string | null
  score?: number
  score_breakdown?: unknown
}

interface InterviewSessionUpdate {
  job_title?: string
  company?: string | null
  type?: string
  status?: string
  questions?: unknown
  answers?: unknown
  feedback?: unknown
  current_question_index?: number
  started_at?: string
  completed_at?: string | null
  score?: number | null
  score_breakdown?: unknown
}

// ============================================
// INTERVJU-FÖRBEREDELSER
// ============================================
export const interviewSessionsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      handleStorageError(error, 'hämta intervjusessioner')
      return []
    }
    return data || []
  },

  async create(session: InterviewSessionInsert) {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Användaren måste vara inloggad för att skapa intervjusession')
    }

    const { data, error } = await supabase
      .from('interview_sessions')
      .insert({
        ...session,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: InterviewSessionUpdate) {
    const { error } = await supabase
      .from('interview_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      handleStorageError(error, 'uppdatera intervjusession')
    }
  }
}
