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

  /**
   * Användarens intresseresultat.
   *
   * `interest_results` skrivs av ingenting: `saveResult` nedan har noll
   * anropare, och TestTab sparar till `interest_guide_progress` +
   * `interest_guide_history`. Prod bekräftar: 10 slutförda test i historiken,
   * **1** rad i `interest_results`.
   *
   * Sju läsare hängde på den tomma tabellen, och två av dem gjorde påståenden
   * om användaren av tomheten:
   *   · `useUnifiedProgress` gav alltid `riasecScore = 0`, vilket är 15 % av
   *     framstegsmätaren (`SECTION_WEIGHTS.riasec`), och visade tipset "Gör
   *     intressetestet för personliga jobbförslag" — till den som just gjort det.
   *   · `learningService` lät hela RIASEC-personaliseringen bli dödkod.
   *
   * Fallbacken nedan läser senaste historikposten och formar om den till en
   * `interest_results`-rad. Det är ETT ställe i stället för sju, och det gör
   * inget anspråk på att raden finns — den härleds ur det som faktiskt sparats.
   * (Granskning 2026-08-21.)
   */
  async getResult() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('interest_results')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) handleError(error)
    if (data) return data

    const { data: historik, error: historikFel } = await supabase
      .from('interest_guide_history')
      .select('riasec_profile, bigfive_profile, top_occupations, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (historikFel) handleError(historikFel)
    if (!historik?.riasec_profile) return null

    const r = historik.riasec_profile as Record<string, number>
    const b = (historik.bigfive_profile || {}) as Record<string, number>
    return {
      user_id: user.id,
      // RIASEC lagras 1–5 i historiken; kolumnerna här är 0–100.
      realistic: Math.round((r.R ?? 0) * 20),
      investigative: Math.round((r.I ?? 0) * 20),
      artistic: Math.round((r.A ?? 0) * 20),
      social: Math.round((r.S ?? 0) * 20),
      enterprising: Math.round((r.E ?? 0) * 20),
      conventional: Math.round((r.C ?? 0) * 20),
      openness: b.openness ?? null,
      conscientiousness: b.conscientiousness ?? null,
      extraversion: b.extraversion ?? null,
      agreeableness: b.agreeableness ?? null,
      neuroticism: null,
      holland_code: Object.entries(r)
        .sort(([, a], [, c]) => c - a)
        .slice(0, 3)
        .map(([k]) => k)
        .join(''),
      recommended_jobs: historik.top_occupations ?? [],
      completed_at: historik.completed_at,
      physical_requirements: null,
    }
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
