/**
 * Interest Guide-API: queries mot `interest_results`-tabellen.
 *
 * Extraherat från supabaseApi.ts 2026-05-09 (P2-skuld, runda 2).
 */

import { supabase } from '../lib/supabase'
import { APIError, handleError } from './apiError'

export const interestApi = {
  async getQuestions() {
    // Questions are static in the app
    return { questions: [] }
  },

  async getResult() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('interest_results')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) handleError(error)
    return data
  },

  async saveResult(resultData: Record<string, unknown>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('interest_results')
      .upsert({
        ...resultData,
        user_id: user.id,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) handleError(error)
    return data
  },

  async getRecommendations() {
    const result = await this.getResult()
    if (!result) return { occupations: [] }

    return {
      occupations: result.recommended_jobs || []
    }
  }
}
